/** Fictional tile geometry and balancing, never real enclosure/care guidance. Grant remains proposed until Z2-06. */
export const ZEBRA_LIMITS=Object.freeze({residents:4,habitats:1,resources:5,tiles:624,habitatCells:64,waypoints:192,foodStations:2,servicePorts:2});
export const ZEBRA_PRICES=Object.freeze({grant:1700,habitat:700,'zebra-graze':90,'zebra-water':75,'zebra-shade':90,'zebra-enrichment':65,foodRefill:12,waterRefill:6,enrichmentRefill:4});
export const ZEBRA_GROUND=Object.freeze({margin:.85,propClearance:.82,separation:1.3,speed:.045,trotSpeed:.075,turn:.14,seekTimeout:600});
/** Fictional fixed-tick appetite, not real feeding or husbandry guidance. */
export const ZEBRA_NEEDS=Object.freeze({hungerPerTick:.018,seekAt:35,foodRelief:40,grazeTicks:24,headLowerTicks:4,feedReach:.7,feedHeight:.20,maxFeedApproach:1});
export const ZEBRA_MISSION_RULES=Object.freeze({ZQ01:{coins:0,award:'grassland-founder' as const},ZQ02:{coins:150,award:null},ZQ03:{coins:0,award:'striped-meadow' as const},ZQ04:{coins:200,award:'zebra-keeper' as const},comfortableTicks:50,thrivingTicks:100,viewers:3});
