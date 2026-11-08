import {entryMessages} from './locale.ts';
import {lionCopy} from './lion-copy.ts';
import {giraffeCopy} from './giraffe-copy.ts';
import {zebraAccessCopy} from './zebra-access-panel.ts';
/** Shared species announcements cannot overwrite a newer habitat's accessible description. */
export function sharedWorldDescription(locale:'en'|'id',studio:boolean,giraffe:boolean,lion:boolean,elephant:boolean,zebra=false){
 return studio?entryMessages[locale].macawCanvas:zebra?zebraAccessCopy[locale].canvas:giraffe?giraffeCopy[locale].canvas:lion?lionCopy[locale].canvas:entryMessages[locale][elephant?'previewElephantCanvas':'previewCanvas'];
}
