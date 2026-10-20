"""使用标准库生成与矢量图一致的本地图标，不依赖外部图像服务。"""
from pathlib import Path
import math
import struct
import zlib

out = Path(__file__).resolve().parent.parent / 'public'
points = [(107, 275), (184, 275), (226, 168), (291, 344), (329, 257), (405, 257)]

def segment_distance(x, y, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = max(0, min(1, ((x-a[0])*dx + (y-a[1])*dy) / (dx*dx + dy*dy)))
    return math.hypot(x-a[0]-t*dx, y-a[1]-t*dy)

def make(size, filename, maskable=False):
    rows = bytearray()
    for row in range(size):
        rows.append(0)
        for col in range(size):
            x, y = (col + .5) * 512 / size, (row + .5) * 512 / size
            if maskable:
                x, y = (x - 256) / .73 + 256, (y - 256) / .73 + 256
            color = (33, 122, 86, 255)
            distance = min(segment_distance(x, y, points[i], points[i+1]) for i in range(len(points)-1))
            if distance < 13.5:
                color = (255, 255, 255, 255)
            elif math.hypot(x-400, y-133) < 21:
                color = (182, 210, 165, 255)
            rows.extend(color)
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data))
    content = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
    content += chunk(b'IDAT', zlib.compress(bytes(rows))) + chunk(b'IEND', b'')
    (out / filename).write_bytes(content)

for size, name in [(192, 'icon-192.png'), (512, 'icon-512.png'), (180, 'apple-touch-icon.png')]:
    make(size, name)
make(512, 'icon-maskable.png', True)
