import {entryMessages} from './locale.ts';
import {lionCopy} from './lion-copy.ts';
import {giraffeCopy} from './giraffe-copy.ts';
/** Shared species announcements cannot overwrite a newer habitat's accessible description. */
export function sharedWorldDescription(locale:'en'|'id',studio:boolean,giraffe:boolean,lion:boolean,elephant:boolean){
 return studio?entryMessages[locale].macawCanvas:giraffe?giraffeCopy[locale].canvas:lion?lionCopy[locale].canvas:entryMessages[locale][elephant?'previewElephantCanvas':'previewCanvas'];
}
