import manifest from '../../public/media/exercises/manifest.json';
import type { Exercise } from './model';

export type ExerciseMedia = {
  exerciseId: string; exerciseName: string; variant: string;
  video: string; poster: string; bytes: number; posterBytes: number; duration: number;
  width: number; height: number; sha256: string; posterSha256: string;
  sourceExerciseId: number; sourceExerciseName: string; sourceVideoId: number;
  sourceUrl: string; author: string; license: string; licenseUrl: string; changes: string;
};
export const exerciseMedia: ExerciseMedia[] = manifest;
const byId = new Map(exerciseMedia.map(media => [media.exerciseId, media]));
export function mediaFor(exercise: Pick<Exercise, 'id' | 'builtin'>) {
  return exercise.builtin ? byId.get(exercise.id) : undefined;
}
export function mediaUrl(media: ExerciseMedia, kind: 'video' | 'poster') {
  const hash = kind === 'video' ? media.sha256 : media.posterSha256;
  return `${import.meta.env.BASE_URL}${media[kind]}?v=${hash.slice(0, 12)}`;
}
export const MEDIA_CACHE_NAME = `replog-exercise-media-v1-${encodeURIComponent(import.meta.env.BASE_URL)}`;

async function validResponse(response: Response, media: ExerciseMedia, kind: 'video' | 'poster') {
  if (response.status !== 200 || !crypto.subtle) return false;
  const body = await response.clone().arrayBuffer();
  const expectedBytes = kind === 'video' ? media.bytes : media.posterBytes;
  if (body.byteLength !== expectedBytes) return false;
  const expectedHash = kind === 'video' ? media.sha256 : media.posterSha256;
  const actualHash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', body))].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return actualHash === expectedHash;
}

export async function cachedMedia(media: ExerciseMedia) {
  if (!('caches' in window)) return null;
  const cache = await caches.open(MEDIA_CACHE_NAME);
  const [video, poster] = await Promise.all([cache.match(mediaUrl(media, 'video')), cache.match(mediaUrl(media, 'poster'))]);
  if (!video || !poster) return null;
  const valid = await Promise.all([validResponse(video, media, 'video'), validResponse(poster, media, 'poster')]);
  if (valid.every(Boolean)) return { video, poster };
  await Promise.all([cache.delete(mediaUrl(media, 'video')), cache.delete(mediaUrl(media, 'poster'))]);
  return null;
}

export async function saveMediaOffline(media: ExerciseMedia) {
  if (!('caches' in window) || !crypto.subtle) throw new Error('当前浏览器不支持离线示范，请使用 HTTPS 或本地安全来源。');
  const cache = await caches.open(MEDIA_CACHE_NAME);
  const responses: Response[] = [];
  for (const kind of ['video', 'poster'] as const) {
    const response = await fetch(mediaUrl(media, kind), { cache: 'reload' });
    if (response.status !== 200) throw new Error('示范下载不完整，请联网后重试。');
    if (!await validResponse(response, media, kind)) throw new Error('示范文件校验失败，请联网重试。');
    responses.push(response);
  }
  // 只在两个文件均已下载并校验后标记可离线；失败时不会显示成功。
  await cache.put(mediaUrl(media, 'poster'), responses[1]);
  await cache.put(mediaUrl(media, 'video'), responses[0]);
}

export async function removeOfflineMedia(media: ExerciseMedia) {
  if (!('caches' in window)) return;
  const cache = await caches.open(MEDIA_CACHE_NAME);
  await Promise.all([cache.delete(mediaUrl(media, 'video')), cache.delete(mediaUrl(media, 'poster'))]);
}
