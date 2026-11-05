/** Tunable fictional game needs per100ms tick; not real elephant husbandry guidance. */
export const ELEPHANT_NEEDS=Object.freeze({hungerPerTick:.06,thirstPerTick:.08,seekAt:35,criticalAt:80,foodRelief:40,waterRelief:45,actionTicks:20,idleTicks:12});
export const ELEPHANT_WELFARE=Object.freeze({food:.25,water:.25,space:.20,shade:.10,enrichment:.10,social:.10,low:60});

/** Fictional bathing refresh; a wet physically reached source is required throughout. */
export const ELEPHANT_BATH=Object.freeze({batheTicks:18,sprayTicks:24,cooldownTicks:300,enrichment:24,energy:6,seekBelow:65});

/** Benefits require a completed physical visit, never mere placement or elapsed real time. */
export const ELEPHANT_ENRICHMENT=Object.freeze({restTicks:30,logTicks:24,logCooldownTicks:450,restEnergy:20,restShade:40,logRelief:28,shadeSeekBelow:50,energySeekBelow:45,logSeekBelow:75,shadeDecay:.01,energyDecay:.005,enrichmentDecay:.01});
