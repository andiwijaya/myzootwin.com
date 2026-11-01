import { createInitialState } from '../../src/game/core/initial-state.ts';

export function populated() {
  const s=createInitialState(17);
  const cells=[{x:3,z:3},{x:4,z:3},{x:3,z:4},{x:4,z:4}];
  s.world.habitats.push({id:'habitat-1',cells,viewingCell:{x:2,z:3}});
  const path=[{x:1,z:8},{x:1,z:7},{x:1,z:6},{x:1,z:5},{x:1,z:4},{x:1,z:3},{x:2,z:3}];
  for(const t of s.world.tiles) {
    if(cells.some(p=>p.x===t.cell.x&&p.z===t.cell.z))t.occupantId='habitat-1';
    if(path.some(p=>p.x===t.cell.x&&p.z===t.cell.z))t.path=true;
  }
  s.world.resources.push({id:'feeder-1',kind:'food',habitatId:'habitat-1',cell:{x:3,z:3},stock:5,capacity:10,revision:0,portions:[3,2]});
  s.animals.forEach((a,i)=>{a.habitatId='habitat-1';a.position={x:3.2+i,z:3.4};a.habitatFit=80;});
  s.animals[0].currentBehavior='seek-food';s.animals[0].target={x:3.5,z:3.5};s.animals[0].targetResourceId='feeder-1';
  s.currency=1530;
  s.ledger.push({id:'ledger-ticket-1',operationId:'admit-visitor-1',kind:'ticket',amount:10,balanceAfter:1510,tick:0,relatedId:'admission-1'});
  s.admissions.push({id:'admission-1',visitorId:'visitor-1',tick:0,ledgerEntryId:'ledger-ticket-1'});
  s.visitors.push({id:'visitor-1',position:{x:1.5,z:8.5},route:path,routeIndex:0,phase:'entering',satisfaction:80,admissionId:'admission-1',arrival:null,journey:null,experience:null});
  s.missions.completedIds=['Q01'];s.missions.currentId='Q02';s.missions.objectives.habitatConnected=true;
  s.missions.rewards.push({missionId:'Q01',ledgerEntryId:'ledger-reward-1'});
  s.ledger.push({id:'ledger-reward-1',operationId:'claim-q01',kind:'reward',amount:20,balanceAfter:1530,tick:0,relatedId:'Q01'});
  return s;
}
