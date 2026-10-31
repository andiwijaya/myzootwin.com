/** Recorder owns verdict and ID; observations cannot overwrite them. */
export const passedScenario=(id,observations)=>({...observations,id,status:'PASS'});
