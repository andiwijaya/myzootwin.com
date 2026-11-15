"""Derive runtime GLBs with shared original WebP textures and compact constant tracks.

Never rewrites authoring masters. Geometry/skin floats remain exact; colour WebP is
quality 92, normal WebP is lossless. Actual runtime variants require browser review.
"""
import copy
import hashlib
import io
import json
import struct
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'art/animals/v01'
OUT = ROOT / '.qa/zoo-assets/v01-candidate'
sha = lambda b: hashlib.sha256(b).hexdigest()
size = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
component = {5121: 1, 5123: 2, 5125: 4, 5126: 4}


def main():
    manifest = json.loads((SOURCE / 'manifest.json').read_text(encoding='utf8'))
    (OUT / 'models').mkdir(parents=True, exist_ok=True)
    (OUT / 'textures').mkdir(exist_ok=True)
    models, textures = [], {}
    for asset in manifest['assets']:
        raw = (SOURCE / asset['localPath']).read_bytes()
        if sha(raw) != asset['sha256']:
            raise ValueError('Changed master ' + asset['id'])
        length = struct.unpack_from('<I', raw, 12)[0]
        doc = json.loads(raw[20:20 + length])
        binary = raw[28 + length:]
        accessors = copy.deepcopy(doc['accessors'])
        data = []
        for a in accessors:
            view = doc['bufferViews'][a['bufferView']]
            if 'byteStride' in view or a.get('sparse'):
                raise ValueError('Unexpected interleaved/sparse authoring data')
            start = view.get('byteOffset', 0) + a.get('byteOffset', 0)
            data.append(binary[start:start + a['count'] * size[a['type']] * component[a['componentType']]])
        used_textures = []
        for index, image in enumerate(doc['images']):
            view = doc['bufferViews'][image['bufferView']]
            png = binary[view.get('byteOffset', 0):view.get('byteOffset', 0) + view['byteLength']]
            picture = Image.open(io.BytesIO(png)).convert('RGB')
            if asset['detail'] == 'low':
                picture = picture.resize((768, 512), Image.Resampling.LANCZOS)
            target = io.BytesIO()
            picture.save(target, format='WEBP', quality=92, lossless=index == 1, method=6)
            webp = target.getvalue()
            digest = sha(webp)
            path = 'textures/' + digest + '.webp'
            (OUT / path).write_bytes(webp)
            textures[digest] = {'sha256': digest, 'url': path, 'bytes': len(webp), 'width': picture.width, 'height': picture.height, 'encoding': 'lossless-normal' if index == 1 else 'colour-quality-92', 'sourcePngSha256': sha(png), 'resampling': 'Lanczos 768x512' if asset['detail'] == 'low' else 'original dimensions'}
            doc['images'][index] = {'uri': '../' + path, 'name': image.get('name', 'original animal surface')}
            used_textures.append(digest)
        reduced = 0
        for animation in doc['animations']:
            for sampler in animation['samplers']:
                index = sampler['output']
                a = accessors[index]
                width = size[a['type']]
                values = struct.unpack('<' + 'f' * (len(data[index]) // 4), data[index])
                if all(abs(values[k] - values[k % width]) < 1e-7 for k in range(len(values))):
                    old_input = accessors[sampler['input']]
                    duration = struct.unpack_from('<f', data[sampler['input']], (old_input['count'] - 1) * 4)[0]
                    sampler['input'] = len(accessors)
                    accessors.append({'componentType': 5126, 'type': 'SCALAR', 'count': 2, 'min': [0], 'max': [duration]})
                    data.append(struct.pack('<ff', 0, duration))
                    data[index] = struct.pack('<' + 'f' * (width * 2), *values[:width], *values[:width])
                    a['count'] = 2
                    reduced += 1
        used, geometry, indices = set(), set(), set()
        for mesh in doc['meshes']:
            for primitive in mesh['primitives']:
                geometry.update(primitive['attributes'].values())
                indices.add(primitive['indices'])
                used.update(primitive['attributes'].values())
                used.add(primitive['indices'])
        for skin in doc['skins']:
            used.add(skin['inverseBindMatrices'])
        for animation in doc['animations']:
            for sampler in animation['samplers']:
                used.update([sampler['input'], sampler['output']])
        remap = {old: new for new, old in enumerate(sorted(used))}
        views, packed, output, cache = [], [], bytearray(), {}
        for old in sorted(used):
            a = copy.deepcopy(accessors[old])
            payload = data[old]
            target = 34963 if old in indices else 34962 if old in geometry else None
            key = (sha(payload), target)
            if key not in cache:
                while len(output) % 4:
                    output.append(0)
                view = {'buffer': 0, 'byteOffset': len(output), 'byteLength': len(payload)}
                if target:
                    view['target'] = target
                cache[key] = len(views)
                views.append(view)
                output.extend(payload)
            a['bufferView'] = cache[key]
            a.pop('byteOffset', None)
            packed.append(a)
        for mesh in doc['meshes']:
            for primitive in mesh['primitives']:
                primitive['attributes'] = {k: remap[v] for k, v in primitive['attributes'].items()}
                primitive['indices'] = remap[primitive['indices']]
        for skin in doc['skins']:
            skin['inverseBindMatrices'] = remap[skin['inverseBindMatrices']]
        for animation in doc['animations']:
            for sampler in animation['samplers']:
                sampler['input'], sampler['output'] = remap[sampler['input']], remap[sampler['output']]
        doc['accessors'], doc['bufferViews'] = packed, views
        doc['buffers'] = [{'byteLength': len(output)}]
        doc['asset']['generator'] += '; exact geometry, shared original WebP, constant track compaction'
        document = json.dumps(doc, separators=(',', ':')).encode()
        document += b' ' * (-len(document) % 4)
        output += b'\0' * (-len(output) % 4)
        result = struct.pack('<III', 0x46546C67, 2, 28 + len(document) + len(output)) + struct.pack('<II', len(document), 0x4E4F534A) + document + struct.pack('<II', len(output), 0x004E4942) + output
        digest = sha(result)
        path = 'models/' + asset['id'] + '-' + digest[:16] + '.glb'
        (OUT / path).write_bytes(result)
        models.append({k: asset[k] for k in ['id', 'species', 'scientificName', 'variant', 'detail', 'animations', 'triangles', 'vertices']} | {'sourceSha256': asset['sha256'], 'sourceBytes': len(raw), 'rawPath': path, 'rawBytes': len(result), 'rawSha256': digest, 'textures': used_textures, 'constantTracksCompacted': reduced})
        print(asset['id'], len(raw), '->', len(result), 'raw bytes')
    report = {'schemaVersion': 1, 'version': 'v01', 'scope': 'Original MyZooTwin animal runtime derivatives; visual acceptance pending', 'sourceManifestSha256': sha((SOURCE / 'manifest.json').read_bytes()), 'models': models, 'textures': list(textures.values())}
    (OUT / 'manifest.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf8')


if __name__ == '__main__':
    main()
