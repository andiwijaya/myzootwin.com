/** Fictional game numbers, not real giraffe care or enclosure standards. */
export const GIRAFFE_LIMITS=Object.freeze({residents:3,habitats:1,resources:5,tiles:624,habitatCells:49,waypoints:128,foodStations:2,servicePorts:2});
export const GIRAFFE_PRICES=Object.freeze({grant:1850,habitat:700,'giraffe-browse':90,'giraffe-water':75,'giraffe-shade':90,'giraffe-enrichment':65,foodRefill:12,waterRefill:6,enrichmentRefill:4});
export const GIRAFFE_NEEDS=Object.freeze({hungerPerTick:.016,thirstPerTick:.02,energyPerTick:.01,enrichmentPerTick:.01,seekAt:35,foodRelief:44,waterRelief:50,actionTicks:30,restTicks:70,restEnergy:30,shadeRelief:35,speed:.04,bodyRadius:.36,turn:.12});
export const GIRAFFE_WELFARE=Object.freeze({nutrition:.25,hydration:.20,rest:.20,space:.15,social:.10,enrichment:.10});
export const GIRAFFE_MISSION_RULES=Object.freeze({GQ01:{coins:0,award:'giraffe-keeper' as const},GQ02:{coins:150,award:null},GQ03:{coins:0,award:'acacia-blooms' as const},GQ04:{coins:200,award:'giraffe-safari-banner' as const}});
