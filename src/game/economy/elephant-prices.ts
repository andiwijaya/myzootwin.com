import {PRICES} from './prices.ts';
import {ELEPHANT_SUPPLIES} from '../animals/elephants/care-rules.ts';
/** Shared initial construction/grant contract. Runtime commands are implemented in EH2. */
export const ELEPHANT_PRICES=Object.freeze({habitat:650,'elephant-browse':80,'elephant-water':90,'elephant-pond':170,'elephant-shade':80,'elephant-log':60,grant:1400});

/** Example six-cell connector, both habitats already present; later recurring services are additional. */
export const ELEPHANT_STARTER_BUDGET=(()=>{const p=ELEPHANT_PRICES,paths=6,construction=p.habitat+2*p['elephant-browse']+p['elephant-water']+p['elephant-pond']+p['elephant-shade']+p['elephant-log'],supplies=2*ELEPHANT_SUPPLIES.browseRefill+ELEPHANT_SUPPLIES.waterRefill+ELEPHANT_SUPPLIES.pondRefill,upkeep=2*PRICES.maintenance,total=construction+paths*PRICES.path+supplies+upkeep;return Object.freeze({paths,construction,supplies,upkeep,total,reserve:p.grant-total});})();
