import { useEffect, useRef, useState } from 'react';
import { Check, Download, Play, RotateCcw, Trash2 } from 'lucide-react';
import { ExerciseIllustration } from './ExerciseIllustration';
import type { Exercise } from '../domain/model';
import { cachedMedia, mediaFor, mediaUrl, removeOfflineMedia, saveMediaOffline } from '../domain/exercise-media';

export function ExerciseDemo({ exercise }: { exercise: Exercise }) {
  const media = mediaFor(exercise);
  if (!media) return <div className="demo-line-preview"><ExerciseIllustration exercise={exercise} animate={false} /><p className="demo-unavailable">暂无对应视频示范，可参考动作说明。</p></div>;
  return <DemoPlayer key={media.exerciseId} exercise={exercise} />;
}

function DemoPlayer({ exercise }: { exercise: Exercise }) {
  const media = mediaFor(exercise)!;
  const video = useRef<HTMLVideoElement>(null);
  const [videoSource, setVideoSource] = useState(mediaUrl(media, 'video'));
  const [posterSource, setPosterSource] = useState(mediaUrl(media, 'poster'));
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offlineError, setOfflineError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loop, setLoop] = useState(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [speed, setSpeed] = useState('1');
  useEffect(() => {
    let disposed = false; const urls: string[] = [];
    void cachedMedia(media).then(async cached => {
      if (!cached) return;
      const blobs = await Promise.all([cached.video.blob(), cached.poster.blob()]);
      if (disposed) return;
      const sources = blobs.map(blob => URL.createObjectURL(blob)); urls.push(...sources);
      setVideoSource(sources[0]); setPosterSource(sources[1]); setSaved(true);
    }).catch(() => { /* 缓存不可读时仍允许在线播放 */ });
    return () => { disposed = true; urls.forEach(url => URL.revokeObjectURL(url)); };
  }, [media]);
  function play() {
    setError(''); setLoading(true); setStarted(true);
    void video.current?.play().catch(() => { setLoading(false); setError('示范暂时无法播放，请检查网络后重试，或参考下方动作说明。'); });
  }
  async function save() {
    setSaving(true); setOfflineError('');
    try { await saveMediaOffline(media); setSaved(true); }
    catch (failure) { setOfflineError(failure instanceof Error ? failure.message : '保存失败，请检查存储空间后重试。'); }
    finally { setSaving(false); }
  }
  return <section className="exercise-demo" aria-label={`${exercise.name}视频示范`}>
    <div className="demo-heading"><h3>动作示范</h3><span>{media.variant || '真人演示'} · {media.duration.toFixed(1)} 秒</span></div>
    <div className="demo-stage">
      <video ref={video} className="demo-video" aria-label={`${exercise.name}示范视频`} src={videoSource} poster={posterSource} controls playsInline muted loop={loop} preload="none" onLoadedMetadata={() => { if (video.current) video.current.playbackRate = Number(speed); }} onPlay={() => { setStarted(true); setError(''); }} onPlaying={() => setLoading(false)} onWaiting={() => setLoading(true)} onPause={() => setLoading(false)} onError={() => { setLoading(false); setError('示范暂时无法加载，请检查网络后重试，或参考动作说明。'); }} />
      {!started && !error && <button className="demo-play" onClick={play} aria-label={`播放${exercise.name}示范`}><Play size={22} /><span>播放示范</span></button>}
      {loading && !error && <span className="demo-loading" role="status">正在加载示范…</span>}
    </div>
    {error && <div className="demo-error" role="alert"><span>{error}</span><button className="text-button" onClick={() => { video.current?.load(); play(); }}><RotateCcw size={14} />重试</button></div>}
    <div className="demo-controls"><label>速度 <select aria-label="示范播放速度" value={speed} onChange={event => { setSpeed(event.target.value); if (video.current) video.current.playbackRate = Number(event.target.value); }}><option value="0.5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option></select></label><label className="inline-checkbox"><input type="checkbox" checked={loop} onChange={event => setLoop(event.target.checked)} />循环播放</label></div>
    <div className="demo-offline"><span>{saved ? <><Check size={14} />已保存，可离线播放</> : `${(media.bytes / 1024 / 1024).toFixed(1)} MB · 按需下载`}</span>{saved ? <button className="text-button muted" onClick={() => { void removeOfflineMedia(media).then(() => setSaved(false)).catch(() => setOfflineError('移除失败，请重试。')); }}><Trash2 size={13} />移除下载</button> : <button className="button secondary small" onClick={() => void save()} disabled={saving}><Download size={14} />{saving ? '下载并校验中…' : '保存供离线'}</button>}</div>
    {offlineError && <p className="demo-error" role="alert">{offlineError}</p>}
    <p className="demo-credit">来源：<a href="https://wger.de" target="_blank" rel="noopener noreferrer">wger</a> · 作者 {media.author} · <a href={media.licenseUrl} target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a> · <a href={media.sourceUrl} target="_blank" rel="noopener noreferrer">原始素材</a>。已缩放、截取及去除音轨。</p>
  </section>;
}
