import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { exerciseMedia, mediaFor, mediaUrl } from '../src/domain/exercise-media';
import { seedExercises } from '../src/domain/seeds';

describe('动作示范素材', () => {
  it('每个示范都映射到真实内置动作，具备来源、授权、变式说明和有效体积', () => {
    expect(exerciseMedia.length).toBe(29);
    expect(new Set(exerciseMedia.map(media => media.exerciseId)).size).toBe(exerciseMedia.length);
    expect(new Set(exerciseMedia.map(media => media.sha256)).size).toBe(exerciseMedia.length);
    for (const media of exerciseMedia) {
      const exercise = seedExercises.find(item => item.id === media.exerciseId);
      expect(exercise?.name).toBe(media.exerciseName);
      expect(media.author).toBe('Goulart'); expect(media.license).toBe('CC-BY-SA-4.0');
      expect(media.sourceUrl).toMatch(/^https:\/\/wger\.de\/media\/exercise-video\//);
      expect(media.changes).toContain('移除音轨');
      expect(media.duration).toBeGreaterThan(0); expect(media.duration).toBeLessThanOrEqual(12.05);
      expect(Math.max(media.width, media.height)).toBeLessThanOrEqual(480);
      expect(media.bytes).toBeLessThan(3 * 1024 * 1024);
    }
  });
  it('发布文件与清单的大小及哈希一致，视频为实际 MP4', () => {
    for (const media of exerciseMedia) {
      const video = readFileSync(`public/${media.video}`), poster = readFileSync(`public/${media.poster}`);
      expect(video.byteLength).toBe(media.bytes); expect(poster.byteLength).toBe(media.posterBytes);
      expect(createHash('sha256').update(video).digest('hex')).toBe(media.sha256);
      expect(createHash('sha256').update(poster).digest('hex')).toBe(media.posterSha256);
      expect(video.subarray(4, 8).toString()).toBe('ftyp');
    }
  });
  it('不靠相似名称猜测视频，个人副本与未覆盖动作不误配', () => {
    expect(mediaFor(seedExercises[0])?.exerciseName).toBe('杠铃卧推');
    expect(mediaFor({ id: seedExercises[0].id, builtin: false })).toBeUndefined();
    expect(mediaFor(seedExercises.find(exercise => exercise.name === '俯卧撑')!)).toBeUndefined();
    expect(mediaFor(seedExercises.find(exercise => exercise.name === '辅助引体向上')!)).toBeUndefined();
  });
  it('媒体地址带站点基路径和内容版本，保持同源并避免旧缓存冒充新片段', () => {
    const media = exerciseMedia[0];
    expect(mediaUrl(media, 'video')).toBe(`${import.meta.env.BASE_URL}${media.video}?v=${media.sha256.slice(0, 12)}`);
    expect(mediaUrl(media, 'poster')).toContain(media.posterSha256.slice(0, 12));
  });
});
