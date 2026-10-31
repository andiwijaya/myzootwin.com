/** Losing an already-lost context is redundant and can emit a Three extension warning. */
export function releaseLiveContext(context:{isContextLost():boolean}|null,lose:()=>void){
  if(context&&!context.isContextLost())lose();
}
