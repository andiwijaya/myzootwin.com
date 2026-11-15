import { Vector3, type Bone, type SkinnedMesh, type Quaternion } from 'three';
export type AnimalSpecies = 'zebra' | 'giraffe' | 'elephant' | 'lion' | 'macaw';
export type Bones = Map<string, Bone>;
type Pose = {
    mouth?: {
        x?: number;
        y: number;
        z: number;
    };
    [key: string]: unknown;
};
const cap = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const names = ['foreLeft', 'foreRight', 'hindLeft', 'hindRight'];
const n = (p: Pose, key: string, fallback = 0) => typeof p[key] === 'number' && Number.isFinite(p[key]) ? p[key] as number : fallback;
const list = (p: Pose, key: string) => Array.isArray(p[key]) ? p[key] as number[] : [];
/** Pure render articulation of the retained GLB skeleton. No clock or simulation mutation. */
export function applyAnimalPose(species: AnimalSpecies, mesh: SkinnedMesh, bones: Bones, p: Pose) {
    const bone = (name: string) => { const b = bones.get(name); if (!b)
        throw Error('Incomplete ' + species + ' GLB skeleton: ' + name); return b; };
    for (const b of bones.values()) {
        b.rotation.set(0, 0, 0);
        b.scale.set(1, 1, 1);
    }
    const rawDrop = n(p, 'bodyDrop'), drop = species === 'lion' && rawDrop <= -.16 ? -.245 : rawDrop;
    if (species === 'macaw') {
        bone('motion').position.y = n(p, 'lift');
        bone('body').position.y = .16 + n(p, 'bob');
        bone('body').rotation.x = n(p, 'bodyPitch');
        bone('head').rotation.set(n(p, 'headPitch'), n(p, 'headYaw'), 0);
        bone('jaw').rotation.x = n(p, 'jaw');
        bone('tail').rotation.x = n(p, 'tailPitch');
        bone('wingLeft').rotation.z = n(p, 'wingLeft', 1.4);
        bone('wingRight').rotation.z = n(p, 'wingRight', -1.4);
        bone('foreLeft').rotation.y = n(p, 'elbowLeft');
        bone('foreRight').rotation.y = n(p, 'elbowRight');
        for (const [i, name] of ['footLeft', 'footRight'].entries()) {
            const f = bone(name);
            f.position.y = n(p, i ? 'rightLift' : 'leftLift');
            f.position.z = .025 + n(p, i ? 'rightStep' : 'leftStep');
            f.rotation.x = n(p, 'footPitch');
            for (let k = 0; k < 4; k++)
                bone(name + 'Toe' + k).rotation.x = (k < 2 ? 1 : -1) * n(p, 'grip') * .66;
        }
        bone('eyelids').scale.setScalar(n(p, 'eyesClosed') > .5 ? 1 : .001);
    }
    else if (species === 'zebra') {
        bone('body').position.y = .94 + drop;
        let neck = n(p, 'neckPitch'), head = n(p, 'headPitch'), yaw = 0;
        if (p.mouth) {
            const l1 = Math.hypot(.45, .31), l2 = Math.hypot(-.145, .395), dy = p.mouth.y - (.94 + drop), dz = Math.hypot(p.mouth.x ?? 0, p.mouth.z - .15), d = cap(Math.hypot(dy, dz), Math.abs(l1 - l2) + 1e-6, l1 + l2 - 1e-6), bend = Math.acos(cap((d * d - l1 * l1 - l2 * l2) / (2 * l1 * l2), -1, 1)), first = Math.atan2(dz, dy) - Math.atan2(l2 * Math.sin(bend), l1 + l2 * Math.cos(bend));
            neck = first - Math.atan2(.31, .45);
            head = first + bend - Math.atan2(.395, -.145) - neck;
            yaw = Math.atan2(p.mouth.x ?? 0, p.mouth.z - .15);
        }
        bone('neck').rotation.set(neck, yaw, 0, 'YXZ');
        bone('head').rotation.x = head;
        bone('jaw').rotation.x = n(p, 'jaw');
        bone('tail').rotation.z = n(p, 'tail');
        for (const key of ['earLeft', 'earRight']) {
            bone(key).rotation.x = p.mouth ? -neck - head : 0;
            bone(key).rotation.z = n(p, key);
        }
        for (const name of names)
            bone(name).position.y = .87 + drop;
    }
    else if (species === 'giraffe') {
        const pitch = n(p, 'headPitch');
        let lower = 0, upper = 0;
        if (p.mouth) {
            const my = -.07 * Math.cos(pitch) - .397 * Math.sin(pitch), mz = -.07 * Math.sin(pitch) + .397 * Math.cos(pitch), dy = p.mouth.y - my - (1.5 + drop), dz = p.mouth.z - mz - .25, d = cap(Math.hypot(dy, dz), .05, 1.299), bend = Math.acos(cap((d * d - 2 * .65 * .65) / (2 * .65 * .65), -1, 1));
            lower = Math.atan2(dz, dy) - bend / 2;
            upper = bend;
        }
        bone('body').position.y = 1.3 + drop;
        bone('neckLower').rotation.x = lower;
        bone('neckUpper').rotation.x = upper;
        bone('head').rotation.set(pitch - lower - upper, n(p, 'headYaw'), 0);
        bone('jaw').rotation.x = n(p, 'jaw');
        bone('tongue').scale.z = .01 + cap(n(p, 'tongue'), 0, 1);
        bone('tail').rotation.z = n(p, 'tail');
        for (const name of names)
            bone(name).position.y = 1.25 + drop;
    }
    else if (species === 'lion') {
        bone('body').position.y = .4 + drop;
        bone('body').scale.set(1 + n(p, 'bodyBreath'), 1 + n(p, 'bodyBreath'), 1);
        bone('head').position.y = .19 + n(p, 'headDrop');
        bone('head').rotation.set(n(p, 'headPitch'), n(p, 'headYaw'), 0);
        bone('jaw').rotation.x = n(p, 'jaw');
        bone('tail').rotation.y = n(p, 'tail');
        for (const name of names)
            bone(name).position.y = .38 + drop;
    }
    else {
        const d = cap(drop, -.04, .04);
        bone('body').position.y = 1.05 + d;
        bone('body').scale.y = 1 + cap(n(p, 'breath'), -.012, .012);
        bone('head').rotation.set(cap(n(p, 'headPitch'), -.3, .3), cap(n(p, 'headYaw'), -.3, .3), 0);
        bone('earLeft').rotation.y = cap(n(p, 'earLeft'), -.45, .45);
        bone('earRight').rotation.y = cap(n(p, 'earRight'), -.45, .45);
        for (let i = 0; i < 8; i++)
            bone('trunk' + i).rotation.x = cap(list(p, 'trunk')[i] ?? 0, i ? -1.3 : -.65, i ? 1.3 : .65);
        bone('trunk0').rotation.order = 'YXZ';
        bone('trunk0').rotation.y = cap(n(p, 'trunkYaw'), -1.3, 1.3);
        bone('tail').rotation.set(cap(n(p, 'tailPitch'), -.5, .5), 0, cap(n(p, 'tail'), -.3, .3));
        for (const name of names)
            bone(name).position.y = .98 + d;
    }
    if (species !== 'macaw')
        stabilizeFeet(species, mesh, bones, { spread: n(p, 'spread'), rest: species === 'lion' && rawDrop <= -.16, scratchLift: species === 'lion' && rawDrop === 0 && n(p, 'headPitch') >= .3 && (list(p, 'legs')[0] ?? 0) < -.3 ? .11 + Math.max(0, -(list(p, 'legs')[0] ?? 0) - .3) * .12 : 0 });
    mesh.updateMatrixWorld(true);
    mesh.skeleton?.update();
}
const legContract = { zebra: { x: .16, z: [.24, -.34], y: .045, cycle: .80, lift: .065, suffix: 'Hoof' }, giraffe: { x: .18, z: [.30, -.34], y: .07, cycle: 1.15, lift: .08, suffix: 'Hoof' }, elephant: { x: .35, z: [.43, -.49], y: .17, cycle: .85, lift: .055, suffix: 'Foot' }, lion: { x: .13, z: [.19, -.21], y: .055, cycle: .50, lift: .055, suffix: 'Paw' } };
export interface Gait {
    distance?: number;
    moving?: boolean;
    trot?: boolean;
    spread?: number;
    rest?: boolean;
    scratchLift?: number;
    reverse?: boolean;
    strength?: number;
    targets?: readonly Vector3[];
    footRotations?: readonly Quaternion[];
    groundHeight?: (x:number,z:number)=>number;
}
export function sampleFootTargets(species: Exclude<AnimalSpecies, 'macaw'>, gait:Gait={}) {
    const spec=legContract[species],duty=gait.trot?.50:.65,step=spec.cycle*duty,offset=gait.trot?[0,.5,.5,0]:[0,.5,.25,.75],direction=gait.reverse?-1:1;
    return names.map((_,i)=>{
        const cycles=(gait.distance??0)/spec.cycle+offset[i]!,cycle=Math.floor(cycles),phase=((cycles%1)+1)%1,swing=phase>=duty,t=(phase-duty)/(1-duty),stride=gait.moving?(swing?-step/2+step*(t*t*(3-2*t)):step/2-spec.cycle*phase):0,lift=gait.moving&&swing?Math.sin(Math.PI*t)*spec.lift:0,scratch=i===0?gait.scratchLift??0:0,sign=(i%2?-1:1)*(species==='elephant'?-1:1);
        const strength=gait.strength??1;
        return {point:new Vector3(sign*spec.x+(i<2?sign*(gait.spread??0)*.45:0),spec.y+lift*strength+scratch,spec.z[i<2?0:1]!+.02+stride*direction*strength+(scratch?.12:0)+(gait.rest?(i<2?.16:-.055):0)),stance:(!gait.moving||!swing)&&scratch===0,phase,cycle,swingMix:Math.max(0,t),duration:spec.cycle,duty,lift:spec.lift*strength,baseZ:spec.z[i<2?0:1]!+.02,footY:spec.y,forwardPlant:step/2*direction*strength};
    });
}
/** Two-bone IK keeps stance soles on their fixed plane. Distance drives the gait. */
export function stabilizeFeet(species: Exclude<AnimalSpecies, 'macaw'>, mesh: SkinnedMesh, bones: Bones, gait: Gait = {}) {
    const spec = legContract[species], sampled=sampleFootTargets(species,gait);
    if (gait.moving) {
        const settle = species === 'giraffe' ? .075 : .065;
        bones.get('body')!.position.y -= settle;
        for (const name of names)
            bones.get(name)!.position.y -= settle;
    }
    for (let i = 0; i < 4; i++) {
        const name=names[i]!,hip=bones.get(name)!,knee=bones.get(name+'Knee')!,foot=bones.get(name+spec.suffix)!,target=(gait.targets?.[i]??sampled[i]!.point).clone(),a=knee.position.clone(),b=foot.position.clone(),l1=a.length(),l2=b.length(),delta=target.sub(hip.position),length=cap(delta.length(),Math.abs(l1-l2)+1e-5,l1+l2-1e-5),dir=delta.normalize(),along=(l1*l1-l2*l2+length*length)/(2*length),height=Math.sqrt(Math.max(0,l1*l1-along*along)),perp=new Vector3().crossVectors(dir,new Vector3(1,0,0)).normalize(),joint=dir.clone().multiplyScalar(along).addScaledVector(perp,height);
        hip.quaternion.setFromUnitVectors(a.clone().normalize(), joint.clone().normalize());
        const distal = dir.clone().multiplyScalar(length).sub(joint).applyQuaternion(hip.quaternion.clone().invert()).normalize();
        knee.quaternion.setFromUnitVectors(b.clone().normalize(), distal);
        foot.quaternion.copy(hip.quaternion).multiply(knee.quaternion).invert();if(gait.footRotations?.[i])foot.quaternion.multiply(gait.footRotations[i]!);
    }
    mesh.updateMatrixWorld(true);
    mesh.skeleton?.update();
}
export function boneContact(mesh: SkinnedMesh, bones: Bones, species: AnimalSpecies) { const definition = species === 'zebra' ? { bone: 'head', point: [0, -.145, .395] } : species === 'giraffe' ? { bone: 'head', point: [0, -.07, .397] } : species === 'lion' ? { bone: 'head', point: [0, -.09, .297] } : species === 'elephant' ? { bone: 'trunk7', point: [0, .0, .055] } : { bone: 'head', point: [0, .029, .235] }; mesh.updateMatrixWorld(true); return bones.get(definition.bone)!.localToWorld(new Vector3(...definition.point)).applyMatrix4(mesh.matrixWorld.clone().invert()); }
