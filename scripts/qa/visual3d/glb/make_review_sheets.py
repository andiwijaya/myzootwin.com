"""Make labelled review derivatives of actual QA PNGs; never replace source captures."""
import hashlib
import json
import re
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[4]

def main():
    run_id, job = sys.argv[1:3]
    if not re.fullmatch(r'p[23]-\d{8}-[a-z0-9-]{1,24}', run_id) or not re.fullmatch(r'batch-[0-9-]+', job):
        raise ValueError('Use the exact recorded run and batch identifiers')
    run = ROOT / '.qa/glb' / run_id
    evidence = run / 'evidence'
    summary = json.loads((evidence / job / 'summary.json').read_text(encoding='utf8'))
    receipt = json.loads((run / 'source.json').read_text(encoding='utf8'))
    snapshot = run / 'library-manifest.json'
    manifest_path = snapshot if snapshot.exists() else ROOT / receipt.get('libraryRoot', 'art/imports/pelatuk-aviary/v01') / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf8'))
    assets = {a['id']: a for a in manifest.get('assets', [dict(a, category='animal') for a in manifest.get('models', [])])}
    out = run / 'reviews'
    out.mkdir(exist_ok=True)
    try:
        font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 20)
        small = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 17)
    except OSError:
        font = small = ImageFont.load_default()

    def read_capture(record):
        path = evidence / record['name']
        data = path.read_bytes()
        if hashlib.sha256(data).hexdigest() != record['sha256']:
            raise ValueError('Capture identity changed: ' + record['name'])
        return Image.open(path).convert('RGB')

    pages = []
    page_num = 0
    for category in dict.fromkeys(assets[r['id']]['category'] for r in summary['records']):
        records = [r for r in summary['records'] if assets[r['id']]['category'] == category]
        for start in range(0, len(records), 4):
            chunk = records[start:start + 4]
            page_num += 1
            page = Image.new('RGB', (1536, 1930), '#edf2eb')
            draw = ImageDraw.Draw(page)
            draw.text((14, 10), f'MyZooTwin GLB QA | {category} | page {page_num:02}', fill='#173c31', font=font)
            draw.text((14, 37), 'Review derivative at 50 percent | six original views per master retained separately', fill='#506c5e', font=small)
            for i, r in enumerate(chunk):
                x, y = (i % 2) * 768, 70 + (i // 2) * 930
                page.paste(read_capture(r['overview']).resize((768, 900), Image.Resampling.LANCZOS), (x, y + 28))
                draw.text((x + 8, y + 2), r['id'], fill='#173c31', font=font)
            name = f'masters-{page_num:02}.png'
            page.save(out / name)
            pages.append({'file': name, 'category': category, 'masters': [r['id'] for r in chunk], 'status': 'AWAITING_VISUAL_REVIEW'})

    animation_pages = []
    stock_pages = []
    for r in summary['records']:
        if r.get('animations'):
            clips = r['animations']
            page = Image.new('RGB', (1280, 60 + ((len(clips) + 1) // 2) * 195), '#edf2eb')
            draw = ImageDraw.Draw(page)
            draw.text((10, 8), r['id'] + ' | actual mixer samples', fill='#173c31', font=font)
            for i, clip in enumerate(clips):
                x, y = (i % 2) * 640, 55 + (i // 2) * 195
                page.paste(read_capture(clip['capture']).resize((640, 170), Image.Resampling.LANCZOS), (x, y + 22))
                draw.text((x + 8, y), clip['clip'], fill='#173c31', font=small)
            name = 'animation-' + r['id'] + '.png'
            page.save(out / name)
            animation_pages.append({'file': name, 'id': r['id'], 'clips': [c['clip'] for c in clips]})
        if r.get('stock'):
            page = Image.new('RGB', (1024, 1320), '#edf2eb')
            draw = ImageDraw.Draw(page)
            draw.text((10, 8), r['id'] + ' | stock variants', fill='#173c31', font=font)
            for i, case in enumerate(r['stock']):
                x, y = (i % 2) * 512, 50 + (i // 2) * 420
                page.paste(read_capture(case['capture']).resize((512, 384), Image.Resampling.LANCZOS), (x, y + 28))
                draw.text((x + 8, y), str(case['stock']), fill='#173c31', font=font)
            name = 'stock-' + r['id'] + '.png'
            page.save(out / name)
            stock_pages.append({'file': name, 'id': r['id']})
    index = {'run': run_id, 'job': job, 'scope': 'Labelled scaled review derivatives; native capture hashes verified; visual status set only after review', 'pages': pages, 'animations': animation_pages, 'stocks': stock_pages}
    (out / 'index.json').write_text(json.dumps(index, indent=2) + '\n', encoding='utf8')
    print(json.dumps({'masterPages': len(pages), 'animationPages': len(animation_pages), 'stockPages': len(stock_pages), 'directory': str(out)}))

if __name__ == '__main__':
    main()
