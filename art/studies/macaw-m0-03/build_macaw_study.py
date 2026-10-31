"""Original MyZooTwin M0-03 mesh study. Not final M2-01 art or a game engine.

No external mesh, texture, photograph, font or executable input is incorporated.
Generates one reusable vertex-colour GLB and an SVG projection of its triangles.
"""
from pathlib import Path
import hashlib
import json
import math
import struct

OUT = Path(__file__).parent / 'study'
OUT.mkdir(exist_ok=True)
PALETTE = {'blue': (25, 130, 188), 'deep_blue': (27, 88, 137), 'sky': (51, 159, 206), 'gold': (245, 183, 45), 'warm_gold': (222, 147, 34), 'green': (68, 141, 86), 'ivory': (246, 242, 226), 'beak': (38, 45, 49), 'foot': (80, 82, 78), 'eye': (242, 204, 72)}
PIVOTS = {'body': (0, 0, 0), 'head': (0, .34, .10), 'wing_left': (-.16, .16, -.01), 'wing_right': (.16, .16, -.01), 'tail': (0, -.15, -.12), 'foot_left': (-.075, -.22, .04), 'foot_right': (.075, -.22, .04), 'jaw': (0, .32, .23)}
PARTS = {name: [] for name in PIVOTS}

def sub(a, b): return tuple(a[i] - b[i] for i in range(3))
def dot(a, b): return sum(x*y for x, y in zip(a, b))
def cross(a, b): return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
def unit(v):
    length = math.sqrt(dot(v, v))
    return tuple(x / length for x in v) if length > 1e-10 else (0, 1, 0)

def tri(part, a, b, c, colour):
    normal = cross(sub(b, a), sub(c, a))
    if dot(normal, normal) > 1e-14:
        PARTS[part].append((a, b, c, PALETTE[colour] if isinstance(colour, str) else colour))

def ellipsoid(part, center, radii, colour, segments=12, rings=7):
    points = []
    for j in range(rings+1):
        lat = -math.pi/2 + math.pi*j/rings
        points.append([tuple(center[k] + radii[k]*v for k, v in enumerate((math.cos(lat)*math.cos(2*math.pi*i/segments), math.sin(lat), math.cos(lat)*math.sin(2*math.pi*i/segments)))) for i in range(segments)])
    for j in range(rings):
        for i in range(segments):
            for a, b, c in [(points[j][i], points[j+1][i], points[j+1][(i+1)%segments]), (points[j][i], points[j+1][(i+1)%segments], points[j][(i+1)%segments])]:
                mid = tuple((a[k]+b[k]+c[k])/3 for k in range(3))
                tri(part, a, b, c, colour(mid) if callable(colour) else colour)

def cylinder(part, a, b, radius, colour, segments=6):
    axis = unit(sub(b, a))
    side = unit(cross(axis, (0, 1, 0) if abs(axis[1]) < .9 else (1, 0, 0)))
    up = unit(cross(axis, side))
    ends = [[tuple(p[k] + radius*(side[k]*math.cos(2*math.pi*i/segments)+up[k]*math.sin(2*math.pi*i/segments)) for k in range(3)) for i in range(segments)] for p in (a, b)]
    for i in range(segments):
        n = (i+1)%segments
        tri(part, ends[0][i], ends[1][i], ends[1][n], colour)
        tri(part, ends[0][i], ends[1][n], ends[0][n], colour)
        tri(part, a, ends[0][n], ends[0][i], colour)
        tri(part, b, ends[1][i], ends[1][n], colour)

def feather(part, base, tip, width, thickness, colour):
    mid = tuple(base[k]*.35 + tip[k]*.65 for k in range(3))
    points = [(base[0]-width*.42, base[1], base[2]), (base[0]+width*.42, base[1], base[2]), (mid[0]+width*.5, mid[1], mid[2]), tip, (mid[0]-width*.5, mid[1], mid[2])]
    top = [(x, y, z+thickness) for x, y, z in points]
    bottom = [(x, y, z-thickness) for x, y, z in points]
    for i in range(1, 4):
        tri(part, top[0], top[i], top[i+1], colour)
        tri(part, bottom[0], bottom[i+1], bottom[i], 'warm_gold' if part == 'tail' else 'deep_blue')
    for i in range(5):
        n = (i+1)%5
        tri(part, top[i], bottom[i], bottom[n], colour)
        tri(part, top[i], bottom[n], top[n], colour)

# A tapered body, separate neck/head, long tail, hooked bill and facial markings.
ellipsoid('body', (0, .015, 0), (.17, .275, .16), lambda p: 'gold' if p[2] > -.005 else 'blue')
ellipsoid('body', (0, .235, .07), (.12, .15, .125), lambda p: 'gold' if p[2] > .035 else 'blue', 12, 6)
ellipsoid('head', (0, .39, .12), (.135, .145, .14), lambda p: 'green' if p[1] > .46 and p[2] > .09 else 'blue', 14, 8)
ellipsoid('head', (0, .29, .205), (.085, .065, .047), 'beak', 10, 5)
for sign in (-1, 1):
    ellipsoid('head', (sign*.123, .385, .165), (.023, .085, .087), 'ivory', 10, 6)
    ellipsoid('head', (sign*.148, .411, .192), (.006, .020, .020), 'eye', 10, 5)
    ellipsoid('head', (sign*.154, .411, .194), (.0035, .011, .011), 'beak', 8, 4)
    for row in range(3):
        y = .36-row*.015
        cylinder('head', (sign*.145, y, .125), (sign*.147, y-.009, .164), .0027, 'beak', 4)
    part = 'wing_right' if sign == 1 else 'wing_left'
    ellipsoid(part, (sign*.165, .025, -.035), (.045, .225, .145), 'blue', 10, 6)
    for i in range(5):
        base = (sign*(.16+i*.006), .04-i*.025, -.035-i*.020)
        tip = (sign*(.19+i*.007), -.22-i*.014, -.11-i*.018)
        feather(part, base, tip, .035, .006, 'sky' if i%2 == 0 else 'deep_blue')
    foot = 'foot_right' if sign == 1 else 'foot_left'
    ankle = (sign*.075, -.238, .05)
    cylinder(foot, (sign*.075, -.19, .035), ankle, .015, 'foot')
    for toe in (-1, 1):
        for direction in (-1, 1):
            joint = (sign*.075+toe*.012, -.272, .05+direction*.055)
            end = (joint[0], -.290, joint[2]-direction*.006)
            cylinder(foot, ankle, joint, .0065, 'foot', 5)
            cylinder(foot, joint, end, .004, 'beak', 5)
for x, length in [(-.036, .57), (0, .68), (.036, .60)]:
    feather('tail', (x, -.14, -.11), (x*.65, -.14-length, -.11-length*.35), .055, .005, 'blue')

# Curved upper mandible: changing cross-sections give a real hook, not a cone.
bill = [(.205, .400, .063, .064), (.255, .399, .065, .065), (.300, .373, .050, .060), (.330, .330, .026, .042), (.322, .281, .005, .009)]
bill_rings = [[(rx*math.cos(2*math.pi*i/10), y+ry*math.sin(2*math.pi*i/10), z) for i in range(10)] for z, y, rx, ry in bill]
for j in range(len(bill_rings)-1):
    for i in range(10):
        n = (i+1)%10
        tri('head', bill_rings[j][i], bill_rings[j+1][i], bill_rings[j+1][n], 'beak')
        tri('head', bill_rings[j][i], bill_rings[j+1][n], bill_rings[j][n], 'beak')
ellipsoid('jaw', (0, .306, .245), (.046, .028, .062), 'beak', 10, 5)

def linear_byte(value):
    s = value / 255
    return round(255*(s/12.92 if s <= .04045 else ((s+.055)/1.055)**2.4))

blob = bytearray()
gltf = {'asset': {'version': '2.0', 'generator': 'Original MyZooTwin M0-03 procedural study', 'extras': {'origin': 'original_project_authored', 'external_asset_inputs': [], 'status': 'Feasibility study, not final M2-01 art'}}, 'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'name': 'Ara_ararauna_study', 'children': []}], 'meshes': [], 'materials': [{'name': 'Original_vertex_palette', 'pbrMetallicRoughness': {'baseColorFactor': [1,1,1,1], 'metallicFactor': 0, 'roughnessFactor': .86}, 'doubleSided': True}], 'accessors': [], 'bufferViews': [], 'buffers': []}

def accessor(data, component, count, shape, target, **extra):
    blob.extend(b'\0' * (-len(blob)%4))
    view = len(gltf['bufferViews'])
    gltf['bufferViews'].append({'buffer': 0, 'byteOffset': len(blob), 'byteLength': len(data), 'target': target})
    blob.extend(data)
    index = len(gltf['accessors'])
    gltf['accessors'].append({'bufferView': view, 'componentType': component, 'count': count, 'type': shape, **extra})
    return index

node_ids = {}
for name, triangles in PARTS.items():
    positions, normals, colours = [], [], []
    pivot = PIVOTS[name]
    for a, b, c, colour in triangles:
        normal = unit(cross(sub(b, a), sub(c, a)))
        for point in (a, b, c):
            positions.append(sub(point, pivot))
            normals.append(normal)
            colours.append(tuple(linear_byte(v) for v in colour)+(255,))
    count = len(positions)
    assert 0 < count < 65536
    pack_float = lambda rows: struct.pack('<'+'f'*(len(rows)*3), *(v for row in rows for v in row))
    pos = accessor(pack_float(positions), 5126, count, 'VEC3', 34962, min=[min(p[k] for p in positions) for k in range(3)], max=[max(p[k] for p in positions) for k in range(3)])
    norm = accessor(pack_float(normals), 5126, count, 'VEC3', 34962)
    colour = accessor(bytes(v for row in colours for v in row), 5121, count, 'VEC4', 34962, normalized=True)
    indices = accessor(struct.pack('<'+'H'*count, *range(count)), 5123, count, 'SCALAR', 34963)
    mesh = len(gltf['meshes'])
    gltf['meshes'].append({'name': name, 'primitives': [{'attributes': {'POSITION': pos, 'NORMAL': norm, 'COLOR_0': colour}, 'indices': indices, 'material': 0, 'mode': 4}]})
    node_ids[name] = len(gltf['nodes'])
    gltf['nodes'].append({'name': name, 'mesh': mesh, 'translation': list(sub(pivot, PIVOTS['head']) if name == 'jaw' else pivot)})
gltf['nodes'][0]['children'] = [node_ids[n] for n in PARTS if n != 'jaw']
gltf['nodes'][node_ids['head']]['children'] = [node_ids['jaw']]
gltf['buffers'] = [{'byteLength': len(blob)}]
json_bytes = json.dumps(gltf, separators=(',', ':')).encode()
json_bytes += b' ' * (-len(json_bytes)%4)
blob.extend(b'\0' * (-len(blob)%4))
binary = struct.pack('<4sII', b'glTF', 2, 12+8+len(json_bytes)+8+len(blob)) + struct.pack('<I4s', len(json_bytes), b'JSON') + json_bytes + struct.pack('<I4s', len(blob), b'BIN\0') + blob
(OUT/'macaw-study.glb').write_bytes(binary)

def project(point, yaw, pitch):
    x, y, z = point
    a, b = math.radians(yaw), math.radians(pitch)
    xx, zz = x*math.cos(a)+z*math.sin(a), -x*math.sin(a)+z*math.cos(a)
    return xx, y*math.cos(b)-zz*math.sin(b), y*math.sin(b)+zz*math.cos(b)

def draw_bird(cx, cy, scale, yaw, pitch, silhouette=False):
    polygons = []
    light = unit((-.4, 1, 1))
    for triangles in PARTS.values():
        for a, b, c, colour in triangles:
            points = [project(p, yaw, pitch) for p in (a,b,c)]
            normal = unit(cross(sub(b,a), sub(c,a)))
            shade = .67+.33*abs(dot(normal, light))
            fill = '#183b32' if silhouette else '#'+''.join(f'{max(0,min(255,round(v*shade))):02x}' for v in colour)
            coords = ' '.join(f'{cx+p[0]*scale:.2f},{cy-p[1]*scale:.2f}' for p in points)
            polygons.append((sum(p[2] for p in points)/3, f'<polygon points="{coords}" fill="{fill}"/>'))
    return ''.join(p[1] for p in sorted(polygons, key=lambda p:p[0]))

triangles = sum(len(t) for t in PARTS.values())
svg = ['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="820" viewBox="0 0 1200 820">', '<rect width="1200" height="820" fill="#f6f1e7"/>', '<style>text{font-family:Arial,sans-serif;fill:#183b32}.title{font-size:28px;font-weight:bold}.label{font-size:16px;font-weight:bold}.note{font-size:14px;fill:#52645b}</style>', '<text x="40" y="48" class="title">Tropical Creek · Blue-and-yellow macaw</text>', '<text x="40" y="77" class="note">Ara ararauna · original parametric mesh study · M0-03 decision evidence, not final M2-01 art</text>', '<rect x="32" y="104" width="555" height="538" rx="18" fill="#fffdf8"/>', '<rect x="605" y="104" width="563" height="538" rx="18" fill="#e7eee4"/>', '<text x="58" y="139" class="label">Three-quarter form</text>', '<text x="630" y="139" class="label">Side silhouette and tail proportion</text>']
def thumbnail_scale(yaw, pitch):
    ys = [project(p, yaw, pitch)[1] for faces in PARTS.values() for face in faces for p in face[:3]]
    return 48 / (max(ys)-min(ys))

svg += [draw_bird(280, 325, 325, -38, 15), draw_bird(870, 325, 325, -82, 8)]
svg += ['<text x="58" y="628" class="note">Blue wings · gold chest · green crown · white cheek · hooked bill</text>', '<text x="630" y="628" class="note">Separate head / jaw / wings / tail / feet pivots; no animation yet</text>', '<text x="40" y="684" class="label">Legibility study</text>', '<text x="40" y="711" class="note">48 px tall projected silhouettes; not a game-camera or touch test</text>', draw_bird(690, 716, thumbnail_scale(-38,15), -38, 15, True), draw_bird(760, 716, thumbnail_scale(-82,8), -82, 8, True)]
for i, key in enumerate(['blue','gold','green','ivory','beak']):
    colour = '#'+''.join(f'{v:02x}' for v in PALETTE[key])
    svg += [f'<rect x="{870+i*48}" y="676" width="36" height="36" rx="6" fill="{colour}"/>']
svg += [f'<text x="40" y="771" class="label">{triangles:,} triangles · 8 rigid mesh groups · 1 shared material · 0 textures · {len(binary):,} GLB bytes</text>', '<text x="40" y="800" class="note">Two animals will share geometry/materials. No third-party art, photo, mesh or font embedded. GPU/FPS and final quality gates remain open.</text>', '</svg>']
(OUT/'macaw-study.svg').write_text(''.join(svg)+'\n', encoding='utf-8')
(OUT/'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>MyZooTwin M0-03 original mesh study</title><body style="margin:0;background:#f6f1e7"><img src="macaw-study.svg" alt="Original blue-and-yellow macaw mesh study with front and side projections" style="display:block;width:100%;max-width:1200px"></body></html>\n', encoding='utf-8')
stats = {'status': 'M0-03 feasibility study; not final model, animation, WebGL or performance pass', 'species': 'Ara ararauna', 'triangles': triangles, 'rigid_mesh_groups': len(PARTS), 'materials': 1, 'textures': 0, 'animations': 0, 'glb_bytes': len(binary), 'parts': {n: len(t) for n,t in PARTS.items()}, 'sha256': hashlib.sha256(binary).hexdigest(), 'external_asset_inputs': []}
(OUT/'study-stats.json').write_text(json.dumps(stats, indent=2)+'\n', encoding='utf-8')
print(json.dumps(stats))
