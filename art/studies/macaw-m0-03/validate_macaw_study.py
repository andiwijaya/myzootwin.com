"""Bounded structural checks, not the official glTF validator or a GPU test."""
from pathlib import Path
import hashlib
import json
import math
import struct

OUT = Path(__file__).parent / 'study'

def validate(data):
    assert len(data) >= 28
    magic, version, length = struct.unpack_from('<4sII', data)
    assert magic == b'glTF' and version == 2 and length == len(data)
    jl, jt = struct.unpack_from('<I4s', data, 12)
    assert jt == b'JSON' and jl % 4 == 0
    scene = json.loads(data[20:20+jl])
    bl, bt = struct.unpack_from('<I4s', data, 20+jl)
    assert bt == b'BIN\0' and bl % 4 == 0 and 28+jl+bl == len(data)
    blob = data[28+jl:]
    assert len(scene['buffers']) == 1 and 'uri' not in scene['buffers'][0]
    assert scene['buffers'][0]['byteLength'] <= bl <= scene['buffers'][0]['byteLength']+3
    assert len(scene['materials']) == 1 and len(scene['meshes']) == 8
    assert not scene.get('images') and not scene.get('textures') and not scene.get('animations')
    assert scene['asset']['extras']['external_asset_inputs'] == []
    visited = set()
    def walk(node):
        assert node not in visited
        visited.add(node)
        for child in scene['nodes'][node].get('children', []):
            walk(child)
    for root in scene['scenes'][scene['scene']]['nodes']:
        walk(root)
    assert len(visited) == len(scene['nodes']) == 9
    ids = {node['name']: i for i, node in enumerate(scene['nodes'])}
    assert ids['jaw'] in scene['nodes'][ids['head']]['children']

    sizes = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}
    formats = {5121: ('B', 1), 5123: ('H', 2), 5126: ('f', 4)}
    def values(index):
        a = scene['accessors'][index]
        view = scene['bufferViews'][a['bufferView']]
        fmt, size = formats[a['componentType']]
        n = sizes[a['type']]
        offset = view.get('byteOffset', 0) + a.get('byteOffset', 0)
        assert offset % size == 0 and view.get('byteOffset', 0) % 4 == 0
        assert view['byteLength'] == a['count']*n*size
        assert offset+view['byteLength'] <= scene['buffers'][0]['byteLength']
        flat = struct.unpack_from('<'+fmt*(a['count']*n), blob, offset)
        return [flat[i:i+n] for i in range(0, len(flat), n)]

    total = 0
    for mesh in scene['meshes']:
        assert len(mesh['primitives']) == 1
        p = mesh['primitives'][0]
        assert p['mode'] == 4 and p['material'] == 0
        pos = values(p['attributes']['POSITION'])
        normals = values(p['attributes']['NORMAL'])
        colour = values(p['attributes']['COLOR_0'])
        indices = [x[0] for x in values(p['indices'])]
        assert len(pos) == len(normals) == len(colour)
        assert scene['accessors'][p['attributes']['COLOR_0']]['normalized']
        assert len(indices) % 3 == 0 and max(indices) < len(pos)
        assert all(math.isfinite(v) for row in pos+normals for v in row)
        assert all(abs(sum(v*v for v in n)-1) < 1e-5 for n in normals)
        a = scene['accessors'][p['attributes']['POSITION']]
        assert all(abs(min(q[k] for q in pos)-a['min'][k]) < 1e-5 and abs(max(q[k] for q in pos)-a['max'][k]) < 1e-5 for k in range(3))
        for i in range(0, len(indices), 3):
            x, y, z = (pos[j] for j in indices[i:i+3])
            u, v = [y[k]-x[k] for k in range(3)], [z[k]-x[k] for k in range(3)]
            cross = (u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0])
            assert sum(q*q for q in cross) > 1e-14
        total += len(indices)//3
    assert total == 2028
    return {'triangles': total, 'meshes': len(scene['meshes']), 'materials': 1, 'textures': 0, 'animations': 0, 'binary_payload_bytes': scene['buffers'][0]['byteLength']}

data = (OUT/'macaw-study.glb').read_bytes()
result = validate(data)
negative = []
for label, bad in [('invalid_magic', b'bad!'+data[4:]), ('truncated_file', data[:-4])]:
    try:
        validate(bad)
    except (AssertionError, ValueError, struct.error):
        negative.append(label)
    else:
        raise AssertionError('Invalid file accepted: '+label)
assert len(negative) == 2
result.update({'structural_checks': 'pass', 'negative_cases_rejected': negative, 'glb_sha256': hashlib.sha256(data).hexdigest(), 'glb_bytes': len(data), 'official_validator_run': False, 'webgl_render_tested': False, 'final_quality_pass': False})
(OUT/'validation-results.json').write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
print(json.dumps(result))
