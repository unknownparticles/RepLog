"""从已核对的 wger CC BY-SA 素材生成可静态部署的短视频、海报和署名清单。"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'public' / 'media' / 'exercises'
CACHE = Path(tempfile.gettempdir()) / 'replog-exercise-originals'
CHANGES = '移除音轨，等比缩放至最长边 480 像素、20 fps，截取最多 12 秒并转为 H.264 MP4；从视频生成 JPEG 海报。'

def digest(path):
    result = hashlib.sha256()
    with path.open('rb') as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b''):
            result.update(block)
    return result.hexdigest()

def process(source):
    if source['license'] != 'CC-BY-SA-4.0' or not source['sourceUrl'].startswith('https://wger.de/media/exercise-video/'):
        raise ValueError('只处理已核对来源与授权的素材')
    original = CACHE / f"{source['sourceVideoId']}.mov"
    if not original.exists() or original.stat().st_size != source['sourceBytes']:
        subprocess.run(['curl', '-fSL', '--retry', '2', '--max-time', '180', '-o', str(original), source['sourceUrl']], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    if original.stat().st_size != source['sourceBytes']:
        raise ValueError(f"原始素材大小不符：{source['exerciseName']}")
    video = DEST / f"{source['exerciseId']}.mp4"
    poster = DEST / f"{source['exerciseId']}.jpg"
    start_seconds = source.get('startSeconds', 0)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(start_seconds), '-i', str(original), '-t', '12', '-an', '-vf', 'scale=480:480:force_original_aspect_ratio=decrease:force_divisible_by=2,fps=20,setsar=1', '-c:v', 'libx264', '-preset', 'fast', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(video)], check=True)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', '0' if start_seconds else '1', '-i', str(video), '-frames:v', '1', '-vf', 'scale=320:240:force_original_aspect_ratio=decrease,pad=320:240:(ow-iw)/2:(oh-ih)/2:color=white', '-q:v', '4', str(poster)], check=True)
    info = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_name,width,height', '-of', 'json', str(video)]))
    if video.stat().st_size > 3 * 1024 * 1024 or float(info['format']['duration']) <= 0:
        raise ValueError(f"输出大小或时长不符合要求：{video}")
    row = {**source, 'video': f'media/exercises/{video.name}', 'poster': f'media/exercises/{poster.name}', 'bytes': video.stat().st_size, 'posterBytes': poster.stat().st_size, 'duration': round(float(info['format']['duration']), 2), 'width': info['streams'][0]['width'], 'height': info['streams'][0]['height'], 'sha256': digest(video), 'posterSha256': digest(poster), 'changes': CHANGES + f' 片段起点为原片第 {start_seconds} 秒。'}
    print(f"完成：{source['exerciseName']} · {row['bytes'] // 1024} KiB", flush=True)
    return row

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--only', nargs='*', help='只更新指定动作标识')
    args = parser.parse_args()
    for tool in ['curl', 'ffmpeg', 'ffprobe']:
        if not shutil.which(tool):
            raise RuntimeError(f'需要先安装 {tool}')
    sources = json.loads((ROOT / 'resources' / 'exercise-media-sources.json').read_text())
    DEST.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    existing = json.loads((DEST / 'manifest.json').read_text()) if (DEST / 'manifest.json').exists() else []
    selected = [row for row in sources if not args.only or row['exerciseId'] in args.only]
    with ThreadPoolExecutor(max_workers=3) as executor:
        generated = list(executor.map(process, selected))
    rows = {row['exerciseId']: row for row in existing}
    rows.update({row['exerciseId']: row for row in generated})
    manifest = sorted(rows.values(), key=lambda row: row['exerciseId'])
    (DEST / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    attribution = ['# 动作视频署名', '', '这些 MP4 与 JPEG 衍生素材采用 CC BY-SA 4.0，原作者均为 Goulart，来源为 wger。', '', '许可证：https://creativecommons.org/licenses/by-sa/4.0/', '', '处理方式：' + CHANGES, '', '动作名称与来源对应关系核对日期：2026-10-20。', '']
    for row in manifest:
        attribution += [f"## {row['exerciseName']}（{row['exerciseId']}）", '', f"- 原始素材：{row['sourceUrl']}", f"- wger 动作：{row['sourceExerciseName']}（{row['sourceExerciseId']}）", '- 作者：Goulart', '- 原始和衍生素材许可：CC BY-SA 4.0', f"- 修改说明：{row['changes']}", f"- 视频 SHA-256：{row['sha256']}", '']
    (DEST / 'ATTRIBUTION.md').write_text('\n'.join(attribution))
    print(f'合计 {len(manifest)} 个视频，{sum(row["bytes"] + row["posterBytes"] for row in manifest) / 1024 / 1024:.1f} MiB。')

if __name__ == '__main__':
    main()
