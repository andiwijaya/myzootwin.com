import type {MacawClip} from './macaw-animation.ts';
export const MACAW_ANGLES=['quarter','front','side','back']as const;
export type MacawAngle=typeof MACAW_ANGLES[number];
export type StudioCommand='open'|'close'|'clip'|'angle'|'pause'|'habitat'|'detail';
export interface StudioView{active:boolean;habitat:boolean;clip:MacawClip;angle:MacawAngle;motionPaused:boolean;canHabitat:boolean;}
