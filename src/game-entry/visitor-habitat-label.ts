import type{HabitatKind}from'../game/core/species.ts';
import{entryMessages,type EntryLocale}from'./locale.ts';
import{giraffeCopy}from'./giraffe-copy.ts';import{zebraConstructionCopy}from'./zebra-copy.ts';
/** One exhaustive species mapping for attraction, pinned destinations and immutable
 * per-visit feedback. Unknown future kinds must be added explicitly. */
export function visitorHabitatLabel(kind:HabitatKind,locale:EntryLocale):string{const c=entryMessages[locale],labels:Record<HabitatKind,string>={'macaw-aviary':c.visitorTargetMacaw,'elephant-grove':c.visitorTargetElephant,'lion-savanna':c.visitorTargetLion,'giraffe-plains':giraffeCopy[locale].title,'zebra-grasslands':zebraConstructionCopy[locale].title};return labels[kind];}
