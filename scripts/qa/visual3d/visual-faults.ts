/** Explicit QA-only factory seams; never a browser/OS capability claim. */
export function createQaVisualFaults(params:URLSearchParams){
 const contextMode=params.get('qaContext'),audioMode=params.get('qaAudio');
 if(contextMode!==null&&contextMode!=='null-once')throw Error('Unsupported QA context fault');
 if(audioMode!==null&&audioMode!=='throw-once')throw Error('Unsupported QA audio fault');
 let contextAttempts=0,contextNulls=0,audioAttempts=0,audioThrows=0;
 return{
  contextFactory:contextMode?(canvas:HTMLCanvasElement)=>{contextAttempts++;if(contextAttempts===1){contextNulls++;return null;}return canvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'low-power'});}:undefined,
  audioFactory:audioMode?()=>{audioAttempts++;if(audioAttempts===1){audioThrows++;throw Error('EXPLICIT QA audio factory failure');}return new AudioContext({latencyHint:'playback'});}:undefined,
  inspect:()=>({contextMode:contextMode??'native',contextAttempts,contextNulls,audioMode:audioMode??'native',audioAttempts,audioThrows,scope:'EXPLICIT QA first-factory fault through original production seams. Subsequent attempt uses actual browser WebGL/WebAudio. No hardware/OS unsupported or native autoplay-denial claim.'}),
 };
}
