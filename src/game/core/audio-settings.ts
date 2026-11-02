export const AUDIO_SETTINGS_KEY = 'myzootwin.audio.preference.v1';
export function readMutedPreference(storage:Pick<Storage,'getItem'>|undefined):boolean|null {
  try { const data=JSON.parse(storage?.getItem(AUDIO_SETTINGS_KEY)??'null');return data?.schemaVersion===1&&typeof data.muted==='boolean'?data.muted:null; } catch {return null;}
}
export function saveMutedPreference(storage:Pick<Storage,'setItem'>|undefined,muted:boolean):boolean {
  if(!storage||typeof muted!=='boolean')return false;
  try{storage.setItem(AUDIO_SETTINGS_KEY,JSON.stringify({schemaVersion:1,muted}));return true;}catch{return false;}
}
