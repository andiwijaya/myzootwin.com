import{createSimulation}from'../../src/game/core/simulation.ts';import{parseSave,serializeSave}from'../../src/game/persistence/save-v1.ts';import{careMissionFixture}from'./care-mission-dom-scenarios.mjs';
/** Whole valid starting fixture, created by real core commands before browser play. */
export function lowWelfareCareFixture(){
 const sim=createSimulation(careMissionFixture('partial')),check=(value,label)=>{if(!value)throw Error('Fixture command failed '+label);};
 for(const kind of['food','water'])check(sim[kind]('remove',sim[kind+'View']().revision,sim.commandRevision()).ok,'remove '+kind);
 for(let i=0;i<2400;i++)sim.advance(100);
 check(sim.birds('reserve'),'reserve after real depletion');
 for(const kind of['food','water'])check(sim[kind]('place',sim[kind+'View']().revision,sim.commandRevision()).ok,'replace '+kind);
 for(const kind of['food','water'])check(sim[kind]('refill',sim[kind+'View']().revision,sim.commandRevision()).ok,'refill '+kind);
 check(sim.birds('welcome'),'welcome after equipment');
 const view=sim.missionView();if(view.currentId!=='Q02'||view.care.next!=='observe'||view.rows[1].status==='ready')throw Error('Invalid low-welfare Q02 fixture '+JSON.stringify(view.care));
 const parsed=parseSave(serializeSave(sim.snapshot()));sim.dispose();if(!parsed.ok)throw Error('Invalid serialized usability fixture');return parsed.value;
}

export function missingFoodCareFixture(){const sim=createSimulation(lowWelfareCareFixture());if(!sim.food('remove',sim.foodView().revision,sim.commandRevision()).ok)throw Error('Missing-food fixture removal failed');const parsed=parseSave(serializeSave(sim.snapshot()));sim.dispose();if(!parsed.ok)throw Error('Invalid missing-food fixture');return parsed.value;}

export function depletedFoodCareFixture(){const sim=createSimulation(lowWelfareCareFixture());for(let i=0;i<5000&&sim.foodView().stock>0;i++)sim.advance(100);if(!sim.foodView().exists||sim.foodView().stock!==0||sim.missionView().care.next!=='food')throw Error('Invalid depleted existing feeder fixture');const parsed=parseSave(serializeSave(sim.snapshot()));sim.dispose();if(!parsed.ok)throw Error('Invalid depleted feeder save');return parsed.value;}
