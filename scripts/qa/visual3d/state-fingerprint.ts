/** Stable JSON object keys, exact array order and primitive values. No lossy rounding. */
export const canonicalState=(value:unknown)=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
export async function stateFingerprint(value:unknown){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonicalState(value))))).map(n=>n.toString(16).padStart(2,'0')).join('');}
