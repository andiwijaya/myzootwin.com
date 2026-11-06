> Engineering transcription from complete Library read, not a materialized original. Library identity retained in intake audit. Direct use authorized by parent after Windows helper incompatibility.

# MYZOOTWIN.COM — MASTER PRD: LION SAVANNA
## Ekspansi Kandang Singa Afrika | Incremental 3D Simulation Game | V1.0

**Tanggal:** 6 November 2026  
**Status:** READY FOR DOT HANDOFF — *planning only; no lion implementation or publication is claimed*  
**Produk:** [MyZooTwin.com](https://myzootwin.com/) / game [Play](https://myzootwin.com/play/)  
**Repository:** `andiwijaya/myzootwin.com`, branch `main` (GitHub read-only, latest observed `2aa836300304`, 2026-11-06 04:45 UTC)  
**Architect:** Bud | **Orchestrator:** Dot | **Implementation:** Codex  
**Player languages:** Bahasa Indonesia (default for new player-facing lion UI) / English  
**Naming:** `Lion Savanna` / `Savana Singa`; internally `lion-savanna` / `panthera-leo`  
**Scope:** a single integrated MyZooTwin 3D zoo, *not* a second game, website, or backend.

> **ENGINEERING IS THE ENGINE. GAMING IS THE EXPERIENCE.**
> **FUNCTIONALITY FIRST.** One small feature must work end-to-end and pass relevant tests before the next. Beautiful lions that just stand, loop animations, or emit revenue without authoritative simulation do **not** satisfy acceptance.
> **DOT 100% AUTONOMOUS** for routine research/engineering/coding/local QA/fixes/reports. Only escalate truly external blockers or decisions/authorizations Dot cannot provide. Publishing to production requires the separate owner authorization already mandated in MyZooTwin's current release plan; an instruction to *prepare a PRD* is not such authorization.

---

## 1. Strategic decision and scope

**Product vision:** Lion Savanna is MyZooTwin's third distinctive animal destination, growing the player's zoo from a Tropical Creek macaw aviary and Elephant Grove to a **savanna enclosure with a social pride of African lions**. The player unlocks land, constructs a credible-looking but game-scaled habitat, welcomes the pride, provides food/water/shade/behavioral enrichment, sees lions explore, rest, communicate and **roar from an elevated kopje**, earns visitor satisfaction/tickets and completes four missions. The simulator models meaningful **cause → state → behavior → result → feedback** at every step.

### Decisions locked for this expansion

| Topic | Locked design |
|---|---|
| Species | African lion, **Panthera leo**. Do not confuse with Asian lion or display questionable subspecies labels. |
| Pride | **3 fictional adult lions**: one male `Raka` (mane), two females `Sena` and `Tala`; no cubs or reproduction in this release. Names are world-specific defaults, stable in save. |
| Habitat | **7×7 gameplay tiles** inside a new savanna zone, with secure perimeter, walking lanes, shade/den, water, meat feeding stations, elevated rock/kopje, scent exploration, scratch/enrichment log. Tile area **does not represent approved real-world zoological enclosure dimensions**. |
| Signature moment | A lion **walks** to a reachable elevated rock, rests/lookouts and may **roar** (jaw, head, body, mane), with another lion optionally orienting to the call. Sounds optional/license-safe, never necessary for mission progress. |
| Core loop | **Unlock → Build → Welcome → Feed/Water → Rest/Enrich → Observe Pride → Welfare → Visitors/Economy → Mission → Return/Upgrade**. |
| Unlock | After **EH04 claimed**, not merely EH04 objective ready; existing Q01–Q04 and EH01–EH04 remain intact. A preview can show upcoming Lion Savanna before unlock. |
| Cash | Same imaginary **Zoo Coins**, one gate ticket/admission per visitor, new grant once on explicit claim, no revenue per enclosure view. |
| State | One canonical typed `ZooSaveV3`, strict lossless V2→V3 (and validated V1→V2→V3 for old users); same persistence backend and CAS. |
| Tech | Reuse existing Astro + TypeScript + Three.js, fixed 100ms simulation tick, one scene/RAF, session owner, economy/visitor/mission infrastructure; no engine rewrite. |
| Game UX | ID/EN, desktop and mobile portrait/landscape, no login/backend/IAP, no endless tutorial; art original procedural or independently licensed. |
| Development | Build/test locally, isolate QA/saves, report progress after each micro-feature, push/deploy at explicit release gate only. |

**IN:** new append-only land, one lion enclosure, three lion agents, 5–7 resources, exact core/FSM/welfare, visitor routing across three habitats, four lion quests, economy support and durable save, responsive/bilingual UI, deterministic tests, releases gates.

**OUT:** hunting prey (especially live prey), injury/death graphics, escape/attack gameplay, visitors entering lion enclosure, breeding, cubs, staff/vet simulation, training tricks/forced performances, microtransactions, dynamic weather/season engine, multiplayer, real zoological certification, total homepage replacement, a fourth species, new LLM/AI agent.

### 1.1 Source inspection — repo fact vs production fact

GitHub `main` inspection on 6 Nov 2026 found:

- `docs/ELEPHANT_PROGRESS.md`: **38/39 EH micro-features checked; EH6-06 release open**. `docs/ELEPHANT_RELEASE_PLAN.md` explicitly requires separate owner publication authorization. **Do not describe Elephant Grove as live** without checking its real deployment and target SHA.
- `docs/MYZOOTWIN_PROGRESS.md`: V1 historical **46/51**, five quality/evidence/signoff gates remain open; do not change these retroactively.
- `src/game/core/species.ts` currently supports macaw `ara-ararauna` and elephant `elephas-maximus`, with habitat/resource discriminants and two resident elephants. This is the extension point for lions; do not revert to V1 `SPECIES_ID` global for all animals.
- `src/game/core/zoo-state.ts`: typed `ZooSaveV2` extends V1 plus `elephantGrove` grant/missions. `src/game/core/runtime-state.ts`: macaw compatibility view backed by a shared runtime root. `src/game/persistence/elephant-backend.ts` uses IndexedDB **version 2** and a V2 checkpoint codec.
- `src/game/world/elephant-expansion.ts`: append-only expansion **12×10 → 12×18**, 216 tiles; existing scene anchor is `(6,5)` and old placement/path/scenery must not shift. `docs/ELEPHANT_TECHNICAL_CONTRACT.md` defines the anchoring contract.
- `src/game/visitors/graph.ts`: fair per-habitat visit selection based on actual admission receipts and reachability now exists. Extend it to **three** destinations, do not write a second visitor system.
- `src/game/missions/elephant-missions.ts`: separate EH missions with persisted proofs. Lion quests should follow that pattern in a new `lionSavanna` namespace, not expand Q01–Q04 to all species.
- Current base `PRICES.path` is **15 ZC/tile**; other Lion figures below are **proposed design values**, not existing code or live prices.

**Dependency/sequencing gate:** Dot may prepare Lion local work against the *verified V2 candidate*, but must establish an exact base commit. Do **not** stack unverified Lion V3 production deployment on top of a held Elephant V2 release or push without owner permission. The safest delivery order is: Elephant EH6-06 authorized and live-smoke-verified → freeze V2 backup/golden fixtures → incremental Lion work → separate V3 release. If the owner specifically authorizes overlapping development, isolate branch/working tree and rebase/check against real production; do not silently combine releases.

### 1.2 Completion definition

A lion habitat is **playable** when a player can build it from saved progress; independently watch three lions eat, drink, rest and interact based on actual resources; see at least one source-grounded scenic lookout/roar; attract actual visitors with correct admission accounting; complete mission proofs; cold reload without loss; and continue playing original macaws/elephants. A rendered diorama, scripted visual, or test fixture alone is **not complete**.

---

## 2. User experience and the golden journey

**Opening:** After EH04 is claimed, the existing Build menu announces **"Habitat baru terbuka: Savana Singa"** / "New habitat: Lion Savanna". Zoom/Fit provides a clear view of the newly unlocked savanna land. The player claims the one-time **Savanna Conservation Grant** only by an explicit click, sees the proposed 7×7 yellow-green construction outline, builds it, and connects a real visitor walkway. The zoo retains the macaw and elephant areas.

**Natural moments:** Raka investigates the highest rock, watches his surroundings, then gives an occasional roar; Sena follows scent enrichment; Tala drinks and rests in shade. The pride's need meters, behavior state and visitor experiences change for real reasons. The gameplay remains fun without rewarding player-induced animal distress or pressuring the lions to perform.

### 2.1 Golden acceptance episode — MUST be reproduced on exact built candidate

1. Load a **real V2-format fixture** with Q01–Q04 and EH01–EH04 claimed and two macaws/two elephants; capture money, RNG, tick, ledger/checkpoint, paths, original coordinates, resident identities, EH grants and awarded proofs.
2. Migrate **V2→V3 once**, verify original projections byte-equivalent/canonically equivalent as appropriate; ensure no automatic Lion grant or new resident. Also test one genuine V1-format save via **V1→V2→V3**.
3. Open the same `/play/` and view the original macaw/elephant habitats and new lion zone at proper fixed world positions. Existing elephant bath/social and macaw feed remain playable.
4. Check Lion Savanna locked for a save with EH04 only *ready*, unlocked for EH04 *claimed*. Claim one-time **1,800 ZC grant** by explicit action; second tap and second tab cannot duplicate it.
5. Preview 7×7 habitat in legal/illegal locations. Confirm creates a real priced enclosure and closed perimeter; Cancel, invalid overlap, insufficiency and stale preview are side-effect-free.
6. Build paths from the original gate to the lion viewing point. Disconnect one critical path and verify visitors cannot teleport to lions; restore reachability and confirm the UI updates.
7. Welcome Raka and then Sena/Tala via validated commands. Each is visible, clickable, uniquely identified and confined to lion habitat. No extra gajah/macaw appears.
8. Install two meat feeding stations (two access ports each), a water trough, shade/den; all three animals successfully seek/feed/drink/rest in a bounded deterministic scenario. Inventory and needs change at authoritative ticks, not render frames.
9. Empty food supply: food events stop, hunger/welfare worsen. Refill with a real paid operation: animals recover in valid time; no free instant score reset or duplicate debit.
10. Build a walkable **kopje/rock platform**, scent patch and scratch log. One lion reaches rock without climbing through walls, emits one proper `lion-roared` event with cooldown; another lion can react. Enrichment causes real behavior and welfare change; roar audio muted/off does not block event/quest.
11. Simulate visitors: a seeded run produces actual visits to macaw, elephant and lion when all are connected/populated. One gate admission → one paid ticket, no fee per habitat. Concealed/resting lion isn't falsely marked visible.
12. Complete **LQ01–LQ04** with authoritative evidence. Claim once, close/reopen/reload and verify quest, grant, resident, supplies, cash, clock, route, rewards and world all preserved.
13. Repeat at 1×/10× (equivalent ticks) and on at least desktop 1366×768, portrait 360×780, landscape 780×360, ID and EN. Fallback/loading/retry/close must not leak renderer or game state.
14. Run corrupt/unsupported save and concurrent writers: existing V2 save/backup remains untouched, no silent reset or old client downgrade. Regression V1 and Elephant suite is green.

**Golden journey is part of release gate**; no checkmark from expected behavior or mocked method calls. An E2E script is useful but must be supported by actual browser observations of built output.

---

## 3. World design and safety

### 3.1 Append-only Savanna Zone — proposed coordinate contract

- Current Elephant V2 grid (verify at implementation start): **12 wide × 18 high**; z=0..17 contains legacy Zoo+Elephant; old original 120 cells at z=0..9, appended Elephant 96 cells at z=10..17.
- **Proposed V3: 12×26** by appending **96 new land tiles** at `z=18..25`, preserving all indices/order and every existing cell/occupancy/path/habitat/resource. This is the smallest same-width rectangular region accommodating a large lion habitat and one pedestrian lane; Dot may tune before L1-02 if geometry fixtures disprove it, with documented alternatives and owner-independent justification.
- **Suggested lion habitat footprint:** `x=3..9, z=18..24` = **7×7**. Suggested outside visitor viewing spot `(2,21)`. Existing Elephant 6×6 example lies at x=3..8,z=11..16: they have a distinct zone with a buffer at z=17. The visitor connector is through x≈1..2; **actual route must be computed**, not assumed. Do not place barriers blocking the corridor at x=1 or 2.
- World mapping remains **fixed relative to original `(6,5)` scene anchor**. Rendered old scenery may **never** shift due to `world.height` increment. Ground slab centered appropriately; camera clamp uses actual combined bbox and world center, including 45° rotate.
- The new landscape includes dusty sand/grass color, original stylized acacia-like trees, smooth rock outcrop, sparse shrubs and den. Do not reuse copyright-protected film compositions. Artwork must be procedural or demonstrably licensed.
- All rocks/logs/fences visible to player must align with **authoritative collision and placement blockers**. Dynamic walkability must account for mane/body radius, slope/camera and animal turning. Use single world-to-grid and grid-to-world utility; no renderer-only passability.
- A lion never walks outside the habitat, into the creek, another habitat or visitor pathway. **Double separation** is visual/physics design inspiration; no claim it meets actual big-cat physical safety standards.
- New region **can only be built in the intended zone**, one Lion Savanna enclosure for this release; don't let big enclosures overwrite tropical creek geometry or Elephant Grove. No sold/repurchased unlimited loops.

### 3.2 Required facilities and physical rules

| Facility | Player action | Real gameplay contract |
|---|---|---|
| Fenced lion enclosure 7×7 | Build for ZC | Defines safe connected walkable polygon; actual occupancy; cannot place on blocked/scenery/creek/path cells |
| Two meat feeding stations | Build/refill | Carnivore meal stock is limited; each station has two independent safe access ports or deterministic queue; each of three lions must get real turns |
| Drinking trough | Build/refill | Water stock decreases on confirmed drinking; thirst recovers only on a complete drink action; multiple approach ports |
| Shade/quiet den | Build | Real shade/resting decision. Animal can withdraw from direct visitor view; cannot be punished merely for hiding |
| Elevated kopje | Build | Occupies valid space; lion can walk up a traversable ramp, perch/stand safely then optionally vocalize; no teleport or instant cliff climb |
| Scent enrichment | Build/service | Lion deliberately approaches, sniffs/explores; consumes finite scent charge or respects cooldown; supports cognition/enrichment score |
| Scratch log | Build/service optional | Lion scratches/rubs at real log location with cooldown; small welfare benefit, no per-frame reward |
| Visitor outside walkway | Build path tiles | Visitors must approach legal viewing cell on shared graph; never enter predator enclosure |

**Important:** No live prey or hunt-to-kill mechanic, no graphic blood/corpse/injury, no player-controlled lion attacks, no direct touching/feeding by visitors. Meal visuals can be stylized non-graphic feeding troughs. This is entertainment/education, **not a professional animal enclosure blueprint**.

### 3.3 Guest sightline, privacy and fairness

- Candidate viewing position is reachable from **original gate** by the actual walkable graph. Viewing coordinates are outside the predator enclosure; no gates that open for guests.
- Lions may hide in the den/shade; visibility score and visitor feedback should derive from what was actually observed or explain inability to see animals. It is okay for a lion to be out of view. Add short ID/EN message, e.g., "Singa sedang beristirahat di tempat teduh".
- Mission observing lions should be achievable within bounded legitimate gameplay despite natural rest/privacy. A calm/resting lion can be observed if it is visibly in view; roar is not the only visitor-visible event.
- Prior two-habitat round robin from `visitors/graph.ts` should generalize to N habitats with deterministic fairness, avoiding starvation of the farther lion destination and preserving existing journeys. Current ticket amount remains **one admission per new visitor**.

---

## 4. Resident model, authoritative lion behavior and welfare

### 4.1 Pride of three — stage it, do not ship fragments

- `Raka`: fictional adult male, broad stylized mane, medium-dark golden coat; distinctive body silhouette.
- `Sena`: fictional adult lioness, slightly warmer coat; more exploratory/scent-oriented preference.
- `Tala`: fictional adult lioness, paler coat; shade/rest preference. These preferences only affect animation choices, never deterministic starvation or unfair welfare.
- Social group defaults to **one familiar established pride**. The simulation does not model introduction or reproductive compatibility, and must not infer that mixing adult lions indiscriminately is appropriate in real facilities.
- **Functionality-first:** first finish a private **one-lion + food/water/save** playable vertical slice before introducing others or elaborate art. The **public release requires all three, no placeholder model**.

### 4.2 AI finite state machine

```text
Idle / Observe
   ↕
Wander / Patrol  →  SeekFood → Eat → Idle
                →  SeekWater → Drink → Idle
                →  SeekShade → Rest → Wake
                →  SeekKopje → ClimbRamp → Lookout → (Roar?) → Descend
                →  SeekScent → Sniff/Investigate → Idle
                →  SeekLog → Scratch → Idle
                →  ApproachCompanion → Nuzzle/HeadRub → Disperse
```

**State rules:**

1. One authoritative fixed tick (existing `TICK_MS=100`) drives needs/resource use, positions, events and cooldown; **not** animation clock/`Date.now()`/third-party AI. Three.js rigs interpolate snapshots only.
2. `currentBehavior`, `motion`, `position`, `waypoints`, `resourceTargetId`, `partnerId`, needs, rest/scent counters and cooldowns need either persisted serializable fields or deterministic re-initialization that cannot dupe reward, consume supplies twice or teleport across save/load.
3. Priority: critical needs/safety/blocked path > feeding/drinking > needed rest > enrichment/social > display/roar. Avoid oscillation with min action duration, cooldown and seeded RNG.
4. Lion naturally rests much of the time. **Do not artificially make a lion perpetually run or roar**. Deliver entertainment through expressive idle, ears/tail/look-around, natural short movement and next-action cues. A seeded guided first-care scenario should produce an observable lion behavior within **15–30 active seconds** after setup; roar itself can be occasional.
5. Rock ascent is **real grounded travel**, not abrupt Y teleport. Static terrain ramp/nav waypoint and collision/body envelope agree, and the player can visibly see why it reached the viewpoint.
6. A `lion-roared` event requires a valid lion currently occupying a valid lookout position in the configured behavioral phase, with cooldown, and only emits **once** for a real roar. Sound not required to emit event. Do not mint quest progress from key press, audio playback or 3D frame render.
7. Audio: default muted/browser-safe. Use **original synthesized or clearly licensed** sound if quality is acceptable; otherwise deliver strong visual mouth/chest motion and optional descriptive caption. Never scrape/download a commercial lion roar without permission. Respect reduced motion and mute.
8. Social behavior: optional head-rub/nuzzle/rest-nearby when two lions are reachable and free; partners reserve interaction and can opt out. Collisions, separation, stale partner state and reload interrupt cleanly. Do not simulate attacks/reproductive scenes.
9. Resource removed mid-seek, stock exhausted, habitat editing, paused speed, context lost, stale selection and lion reinitialization must all reject/abort/replan safely, not deadlock, free-teleport or double-charge.
10. Event/renderer ownership: existing frame loop, no second independent RAF/timer per lion. Share geometry/materials across lionesses, dispose once per owner, bounded particles for dust/roar cues.

### 4.3 Welfare formula — gameplay heuristic, not veterinary science

Proposed lion-specific score, subscores each in 0–100:

```text
lionWelfare =
  0.25 × Nutrition +
  0.15 × Hydration +
  0.20 × RestAndShelter +
  0.15 × SpaceAndMovementChoice +
  0.15 × Enrichment +
  0.10 × SocialComfort
```

- **These weights are proposed game-balancing constants only.** They are not real lion health metrics or professional feeding guidance. Keep in a per-species config and iterate based on gameplay evidence.
- Need values decay on fixed ticks with bounded min/max; avoid real-time wall-clock neglect when browser is closed. No offline loss without an explicit future feature.
- First action feedback should be immediate but realistic in game terms: resource refill does not instantly set hunger=100; a lion must actually reach/feed/drink/rest to recover.
- Good welfare increases visitor interest and satisfaction within bounded shared-economy rules. Poor welfare informs the player exactly what is missing and provides reachable recovery. Avoid irreversible sickness/death/money softlock.
- Social comfort is encouraged, but welfare shouldn't catastrophically collapse if one lion prefers solitude during a tick. Include choice, den privacy and independent feeding opportunities.
- Introductory ID tips: `Makanan menipis`, `Tempat teduh belum tersedia`, `Akses batu pandang terhalang`, `Enrichment perlu diisi ulang`. EN equivalents mandatory.

### 4.4 Scientific inspiration, not pseudo-certification

- Lions are social big cats that spend much time resting and communicate by roaring: San Diego Zoo, **[Lion species guide](https://animals.sandiegozoo.org/animals/lion)**.
- Purposeful space choice, elevated rocks, shade/privacy and enrichment are implemented in actual lion habitats: Lincoln Park Zoo, **[Pepper Family Wildlife Center](https://www.lpzoo.org/pressroom/pepper-family-wildlife-center/)** and **[The Science of Space](https://www.lpzoo.org/the-science-of-space-at-pepper-family-wildlife-center/)**.
- Scent, environmental, food and cognitive enrichment choices: Smithsonian National Zoo, **[Animal Enrichment](https://nationalzoo.si.edu/animals/animal-enrichment)** and **[Lion](https://nationalzoo.si.edu/animals/lion)**.
- Professional reference only (dated 2012; more recent guidance may supersede): AZA **[Lion Care Manual](https://assets.speakcdn.com/assets/2332/lion_care_manual_20121.pdf)**. **Game footprints, diets, spacing, welfare score and safety assumptions must not be called AZA/EAZA compliant.**

---

## 5. Economy, visitors, progression and missions

### 5.1 Once-only expansion unlock and grant

- Lion Savanna unlocks after **`EH04` explicitly claimed with valid matching proof** in current Elephant metadata. If Elephant is not yet in the client's production source, the lion catalog stays teaser-locked; no bypass and no silent auto-upgrade of the old V1 game.
- After unlock player can **Claim Savanna Conservation Grant: 1,800 ZC once**. Stable operation ID proposal `lion-savanna-grant-v1`, stored proof in V3 checkpoint+ledger (including compacted state). **Do not grant during migration, on view, or repeatedly after reload**.
- Quote/claim must commit durably via existing winning **IndexedDB revision+generation CAS** before UI reports success. Concurrent tab loses cleanly and may reload state, without optimistic duplicate cash.
- If owner chooses to rebalance later, migration must not retroactively change already claimed cash receipts. All monetary values are integer imaginary ZC.

### 5.2 Starting balance proposal — test before locking production

| Item | Starting ZC | Notes |
|---|---:|---|
| Lion enclosure 7×7 | 750 | One habitat max this phase |
| Meat feeding station | 90 × 2 | Four total safe approach ports / queues for three lions |
| Drinking trough | 70 | Water is physically consumed |
| Cool den / shade | 90 | Autonomous rest and shelter |
| Elevated lookout kopje | 160 | Walkable slope, behavioral roar anchor |
| Scent enrichment | 60 | Real service/charge/cooldown |
| Scratch log | 55 | Real enrichment state |
| Visitor walkway | **15 × 8** | Assumes connected Elephant-era graph; player routes may cost more |
| Initial service | **12 × 2 + 6** | Two food refills + water, verify actual V3 service rules |
| Initial upkeep reserve | 6 | Example three-habitat upkeep, tune to actual recurring calculation |
| **Example total** | **1,521 ZC** | Proposed fixture, not a live quote |
| **Grant budget** | **1,800 ZC** | Leaves 279 ZC in 8-path example |

`750 + 2×90 + 70 + 90 + 160 + 60 + 55 + 8×15 + 2×12 + 6 + 6 = 1,521`. Test **0-cash** eligible player with route variations including up to 12-path connector (extra 60) plus first care service; recoverable if unsuitable layout. Do not allow refunds to exceed actually paid attributable costs; no negative balance, fake rewards or stale price quotes.

### 5.3 Visitor economy — three habitats, ONE gate

- Reuse current `visitTargetsForState` / `selectVisitTarget` + shared entry admission/ledger. Add Lion only when the enclosure is legally viewable, connected and inhabited; a lion without reachability is not a valid paid-view target.
- Round robin or fair-weighted selection must yield **observable visits to all three** in a deterministic bounded run. Preserve journey target pinning even if new destinations become available; avoid teleport mid-journey and duplicate ticket claims.
- Ticket revenue remains **one admission per new visitor**, even if their future route supports several exhibits. No new separate "Lion Ticket" payment route or gift per roar.
- Attraction/welfare calculation should be bounded, with lion visibility/actual welfare causing visitor feedback. Do not increase admission rate simply by multiplying by number of habitats; this would distort existing V2 economics.
- Existing macaw Q03/Q04 and Elephant EH04 admission/viewing proof semantics must still hold. A prior visitor cannot be retroactively assigned to lions after route update.

### 5.4 Four independent Lion quests

| Quest | Required authoritative evidence | Reward (example) |
|---|---|---|
| **LQ01 — Welcome the Pride** | Real 7×7 lion habitat + outside connected walkway + all **three** named lions resident, non-overlapping valid positions | Badge `pride-founder` (noncash) |
| **LQ02 — Care for the Pride** | Each lion has actually eaten and drunk; all welfare ≥60 for **50 canonical ticks** while quest active | **+200 ZC once** |
| **LQ03 — Voice of the Savanna** | Genuine `lion-roared` event while on valid kopje **plus** one real `lion-investigated-scent` event | Decor unlock `savanna-wildflowers` (noncash) |
| **LQ04 — Visitors Love the Pride** | All three lions welfare ≥70 for **100 consecutive fixed ticks** and **three distinct paid visitors actually observed lions** | **+250 ZC once** + badge `savanna-guardian` |

Namespace as `lionSavanna.missions`, `LQ01`…`LQ04`, independent of Q and EH. Progress and rewards remain versioned and persisted; command and durable proof are exactly-once, including compaction/tab collisions. `currentId` is separate for Lion so Q/EH cannot be reset. Don't calculate quest from UI animation, R/FPS, or a sound event. Missed visible lion because it is sheltering must not count as a visitor observation.

### 5.5 Fun/retention without creating a chore

Show **one short next-action CTA** in lion info panel and a clear end-of-mission celebratory visual. A player entering with a completed Elephant save should be able to understand the first step within a few seconds. After basic setup, one interesting real action occurs within 15–30 seconds in a seeded guidance scenario; player may observe roaming, ear flicks, resting and social activity at any time. Short-term replay comes from caring for evolving needs, finding favorable facilities, watching a natural roar and improving visitor response—not daily login penalties, scarcity traps or forced ads.

---

## 6. Technical contracts — MUST reuse tested V2 machinery

### 6.1 Proposed type extension (illustrative, not blind patch)

```ts
// The existing V1 and V2 serialized data contracts must remain exact inputs.
type SpeciesId = 'ara-ararauna' | 'elephas-maximus' | 'panthera-leo';
type HabitatKind = 'macaw-aviary' | 'elephant-grove' | 'lion-savanna';
type LionResourceKind = 'lion-meat' | 'lion-water' | 'lion-den'
                      | 'lion-kopje' | 'lion-scent' | 'lion-scratch';

interface LionSavannaProgress {
  grant: null | { id: 'lion-savanna-grant-v1'; ledgerEntryId: string; tick: number; command: number };
  missions: { /* LQ01..LQ04 state + exact proof references + counters */ };
}

interface ZooSaveV3 extends Omit<ZooSaveV2, 'schemaVersion' | 'world' | 'animals'> {
  schemaVersion: 3;
  world: ZooWorldV3;             // All macaw, elephant AND lion habitats/resources
  animals: ZooAnimalV3[];       // 2 macaws, 2 elephants if present, 3 lions if welcomed
  lionSavanna: LionSavannaProgress;
}
```

**Architecture:** extend `src/game/core/species.ts`, `zoo-state.ts`, `runtime-state.ts`, `simulation.ts`, `world/elephant-expansion.ts`-adjacent logic, `world/build-habitat.ts`, rendering catalog, visitor graph, `persistence/save-v2.ts`, IndexedDB backend and game entry. Introduce lion domain modules in `src/game/animals/lions/`, `src/game/render3d/lion/`, `src/game/economy/lion-*.ts`, `src/game/missions/lion-*.ts` as needed, but avoid duplicate world, clock, ledger, route, autosave and audio owners.

**Discriminated union and dynamic capacities:** fixed V1 `Animal` remains macaw only, V2 `ElephantAnimal` remains unchanged, `LionAnimal` includes `speciesId='panthera-leo'`, stable `name` and valid `sex: 'male'|'female'`; lion ground motion is its own tagged state. Species filters must be present in Q02, EH welfare/social/mission logic, resource assignment and collision. `MAX_SAVE_CHARS`, entity limits, tile limits, checkpoint compaction and runtime are explicitly reevaluated with actual V3 save size; do not globally relax to unbounded values.

### 6.2 Persistence V3, backup, concurrency and rollback safety

1. **Validate before migrate.** Exact V1/V2 codecs remain supported as *input validators*, V2 cannot reinterpret a V3 save as V2. Migration is pure, copies original records and appends only region/species metadata. Project V3 state back to V2 and require all legacy fields/values equal, including ticks, RNG, money/ledger, selected entity references, visitor receipts, macaw/elephant needs, EH quests and grants, and visual/preferences state. No automatic lion grant or lion residents.
2. **Single database** IDB version **3** (assuming current version 2 remains). Keep existing original V1 backup. Make a distinguishable original **V2 backup** only once on first V2→V3 migration, transactionally. Protect backups across cold reload and never automatically restore them over a valid V3 save.
3. Existing generation+revision **CAS** remains sole write authority; prove multiple tabs, failed upgrade, VersionError on old code, quota failure, interrupted transaction, reset/Undo and future-scheme rejection. Stale commands never credit money or resurrect removed species. Avoid unguarded cross-tab optimistic local state.
4. **Rollback reality:** reverting deployment to the V2 binary after V3 DB upgrade can protect data bytes via version barrier but **will not allow old client to resume the V3 save**. Prepare a tested **forward-compatible V3 rollback** build/maintenance response or a fix-forward path. Never describe “just deploy old V2” as working rollback.
5. **Release dependency:** If Elephant V2 has not yet deployed, **do not launch Lion V3 directly without a separately reviewed combined migration+live verification plan and owner consent**. Do not use owner browser storage as an experiment.

### 6.3 Rendering and workload budget

- Original stylized low-poly rigs with convincing mane, lioness head and muscular silhouette, paws/tail, ears/blink, realistic-ish quadruped weight shift. No flat cubes/capsule placeholders in production. No asset scraped from games/movies/stock without commercial rights.
- Animal motions driven by authoritative transforms. Smooth 3D mesh interpolation of fixed tick, distance-based LOD, instantiate shared female geo/materials, reuse Three core. Control particles/dust/sound, no high frequency new allocations/geometry rebuild during RAF. Pause/close/context-loss fully disposes owned WebGL/Audio resources.
- Support visual tier `auto|low|high`, muted, reduced motion and original WebGL fallback. Low tier may simplify mane/fur and particles, but **does not change actual consumption/currency/welfare rules**. No support promise for unsupported mobile hardware.
- Performance **targets**, not evidence: mobile supported devices near ≥30 FPS, desktop near ≥60 FPS, a practical 15-minute active session without runaway memory, first-play and incremental bundle measured against Elephant V2, incremental gzip preferred <=750KB unless justified. Record device, viewport, browser, power state, actual measurement type and confidence; not a made-up “pass” from desktop viewport emulation.
- Avoid QA artifacts bloating repository; keep bounded receipts and original assets with provenance, do not delete old evidence without scoped audit/approval. Local tests/builds, not Github Actions minutes.

### 6.4 Security/privacy/ethics

- Keep game browser-local by default, no sign-in, no external API or new analytics unless explicitly reviewed; preserve website journal routes, sitemap and existing opt-in measurement behavior.
- Player data (saves, screenshots, private local QA) must never be committed or uploaded. Use disposable browser profiles/databases; original owner game state never modified for QA.
- No IAP, wildlife commerce, predatory monetization, violent predation or human-danger interactions. Render a fictional stylized zoo and short educational notes instead of pretending professional wildlife care standards.
- Asset and audio commercial-license proof must accompany any third-party media; copyright notice and security/privacy checkpoint cannot be assumed passed from technical tests alone.

---

## 7. Testing framework and acceptance gates

### 7.1 Minimum automated test matrix

| ID | Classification | Verified condition |
|---|---|---|
| LT-01 | Migration/white-box | V1→V2→V3 and V2→V3 preserve exact Q/EH/currency/tick/RNG/animal/visitor/ledger projections |
| LT-02 | Persistence | Old V2 writer cannot overwrite V3; future/unsupported content remains untouched with useful recovery warning |
| LT-03 | Concurrency | Grant double-click/2-tab CAS yields exactly one credit and one committed proof |
| LT-04 | World | All 216 old cells and object/camera/picking world coordinates preserved after append to 312 cells |
| LT-05 | Placement | Scenery/creek/overlap/visitor-path/gate invalids reject before debit or habitat commit |
| LT-06 | Build/edit | Valid 7×7 paid habitat, safe dependency guards, actual-cost refund, stale quote/Undo integrity |
| LT-07 | Food/water | Three lions actually consume and recover, stock limits, service fees, no monopoly/starvation deadlock |
| LT-08 | Locomotion | No fence escape, blocked-path teleport, mane/body collision, invalid waypoint or turn oscillation |
| LT-09 | Lookout | Roar requires physical kopje occupancy, active valid behavior, cooldown and once-only event |
| LT-10 | Enrichment | Scent and scratch are actual resource-seeking actions; progress/cooldown persists |
| LT-11 | Pride | Three residents unique/sex stable; nuzzle uses consistent partner positions and interruption recovery |
| LT-12 | Welfare | Input→behavior→need→welfare causes match truthful ID/EN panel reasons |
| LT-13 | Visitor routing | Macaw/elephant/lion all visited if eligible; disconnection gracefully excludes only unreachable habitat |
| LT-14 | Ticket/ledger | One ticket per gate admission, zero extra income per enclosure/roar, idempotent after compaction |
| LT-15 | Quests | LQ01–LQ04 evidence authentic and claim exactly once, Q/EH mission counters unchanged |
| LT-16 | Economic failure | Zero ZC/grant+quote/recovery scenario fully playable without infinite grant/refill |
| LT-17 | Save fault | Corrupt/oversize/foreign state and failed IDB transaction preserve originals/no auto-reset |
| LT-18 | Time | 1×/10× fixed-tick semantics, pause/background and reload produce deterministic equivalent state |
| LT-19 | Browsers | 1366×768, 360×780, 780×360, EN/ID, touch drag/pinch, keyboard, focus/modal |
| LT-20 | Resource lifecycle | WebGL loss/retry, close/reopen, renderer disposal, audio mute, reduced motion, one RAF |
| LT-21 | Soak | 15 active minutes and stress ticks, measured GPU/heap/CPU, bounded journal/visitor arrays |
| LT-22 | Safety/rights | Non-graphic feeding, no visitor access, no unlicensed assets or surprise external data flow |
| LT-23 | Regressions | All V1 and Elephant tests remain green, no journal routes/metadata/GA choice regressions |
| LT-24 | Production | Exact source/deployment identity, live app smoke, QA-profile isolation and V3-safe rollback plan |

### 7.2 Black-box, white-box and dead-code requirements

- **Black box:** Actual UI interactions/visible Three scene, full mission flow and real browser state across reload, route, mobile emulation, voice/mute behavior and failed interactions. A screenshot and inspector DOM alone do not prove consumption or saved financial receipts.
- **White box:** Type narrowing, pure engine/transaction/visitor/migration invariants, deterministic seeds, event idempotency, no double RAF, tests for state machines and lossless data projection, property/boundary tests for position/collision/caps.
- **Dead code & hygiene:** Dependency/source reachability, obsolete temporary V1/V2 adaptation paths, unused imports, unreleased assets, large prior QA files. **Never blindly delete shared legacy modules**; retain backups, tested code, provenance and public notices.
- **External device honesty:** Desktop viewport emulation is not physical Android/Edge/iOS or native hardware GPU/FPS. Record UNRUN for unsupported checks and don't mark them passed by assumption.

### 7.3 Release gates (all must pass unless owner explicitly adjusts scope)

A. Existing macaw and Elephant saved progression survives a real V2→V3 migration and cold Continue, with exact projection tests and backup.  
B. Three lions and resources work end-to-end without renderer-dependent logic; genuine behavioral `lion-roared` proof and final LQ claim.  
C. True visitor routing/ledger across three species and zero-cash recovery; no money duplication.  
D. Full native build, deterministic tests, 15-minute soak, mobile/desktop and both languages; old journal routes unchanged.  
E. Asset rights, privacy, source/QA hygiene, current owner release permission and V3-safe fallback/rollback plan.  
F. Approved **single** deployment observed and **live smoke** passed on disposable test profile; actual SHA/Pages deployment recorded. `LH6-06` remains unchecked until those observations occur.  

Inherited Elephant/V1 unrelated open evidence/signoff gates must remain visibly open unless actually completed; this scoped feature release does not invent global 100% certification.

---

## 8. Dot autonomy and handoff protocol

**Non-negotiable execution:** Dot decomposes and independently executes one smallest meaningful micro-feature end-to-end; calls Codex as needed, writes regression/unit/browser tests, fixes failures, confirms the functionality in source and UI, and marks checklist `[x]` only on verified evidence. It commits logical local checkpoints, retains existing media and player state, records concise status, and continues without repeated requests to owner. No manual testing/approval for each feature. Escalate only genuine blockers: needed credentials/2FA/new permissions, rights/consent/legal decision, contradictory product requirement, irreversible action, or separate owner authorization for publishing/production.

**Existing publication guard is authoritative:** The source Elephant task says its EH6-06 was not approved for deploy. Lion PRD preparation is **not** blanket authorization to publish Elephant or Lion. Do not force-push, rewrite history, reset saves, or turn on additional CI. Engineering can continue privately under an explicitly authorized development workflow, while all publication awaits the proper separate release decision.

### Required completion report after EVERY micro-feature

```text
MyZooTwin Lion Savanna — [LHx-yy] COMPLETE / PARTIAL / BLOCKED
Scope implemented: ...
Actual verification: tests N/N; browser/device observations; source/commit; evidence paths
Existing regressions: PASS / FAIL / UNRUN with reasons
Issues/known limitations: ...
Checklist progress: n/39 (xx.xx%)
Next independent micro-feature: LHx-zz
Deployment status: LOCAL ONLY / APPROVED RELEASE / LIVE VERIFIED
```

Never report completion percentages including unchecked items or claim production acceptance from local green tests. If a feature cannot complete safely, report `PARTIAL/BLOCKED`, preserve work, diagnose alternatives and only escalate the external blocker. After all local features pass, prepare the exact-candidate release report and await external publication authorization without a premature push.

### Master PRD and previous docs

Save this PRD in a distinct file `docs/MYZOOTWIN_LION_SAVANNA_PRD_V1.md` (or existing naming policy). Maintain a **separate living checklist** `docs/LION_SAVANNA_PROGRESS.md`. Do not overwrite `docs/MYZOOTWIN_MASTER_PRD_V1.md`, `docs/MYZOOTWIN_PROGRESS.md`, `docs/ELEPHANT_PROGRESS.md`, existing source references, past QC receipts, or owner saves. Re-read the actual repo HEAD and current production conditions before execution.

---

## 9. Scope creep prevention / future extensions (NOT V1)

Later and only after Lion Savanna playable: more habitat biomes, scalable zoo map zoning, keeper scheduling, veterinary events, repeated enrichment patterns, personality variety, optional safe reintroduction education, curated lion cub/breeding educational stories, audio ambience, weather/time-of-day art polish, cross-habitat visitor multi-stop experiences, voluntary animal facts, conservation education missions and shareable showcase. None is required to make the first Lion Savanna playable, and none justifies blocking a completed first end-to-end loop.


## 10. Living micro-feature checklist — **39** items, all initial `[ ]`

Each row is an implementation gate. Start unchecked; Dot alone marks `[x]` **after** the scoped source, tests and browser/verification evidence pass. Existing V1 46/51 and EH 38/39 counters are **not** added to this new 39-item denominator.


### LH0 — Audit, freeze, and measurable design

- [ ] **LH0-01** — Audit repo HEAD, real production deployment, Elephant release approval, current QA gates; record SHA and source/deployment difference.
  - **Acceptance:** Read-only source/live audit; EH6-06 status verified; no production mutation, no misleading live claim.
- [ ] **LH0-02** — Freeze golden V1/V2 existing saves and money/quest/visitor/animal projections; define ownership of QA profiles and backup.
  - **Acceptance:** Fixture hashes and cold-Continue equality tests reproduce pre-change behavior without touching owner saves.
- [ ] **LH0-03** — Finalize lion visual, social behavior and safety reference notes, independent procedural art and sound provenance.
  - **Acceptance:** Species brief verified; zero copyrighted character/asset assumptions; reference-based choices documented.
- [ ] **LH0-04** — Design append-only savanna grid, 7×7 placement, walkable kopje, budgets, deterministic seeded gameplay and perf baseline.
  - **Acceptance:** Pure fixture proves noncollision, reachable viewing, grant budget, camera/world anchoring and repeatability.

### LH1 — Shared world + species + persistence V3

- [ ] **LH1-01** — Add lion discriminants to shared species/habitat/resource, typed ground behaviors and source-bounded capacities.
  - **Acceptance:** Type-level negatives and macaw/elephant scoped regression; no elephant phase applied to lions.
- [ ] **LH1-02** — Append lion zone to the V2 12×18 world, preserve old tile order and fixed origin; extend camera/diorama safely.
  - **Acceptance:** Original 216 tiles, objects, world positions and rotated pick hits match; 312-cell world validated.
- [ ] **LH1-03** — Implement 7×7 placement previews, occupied/scenery/fence blocking, safe resident routes and accessible visitor viewing cell.
  - **Acceptance:** Invalid/overlap/water/gate/rock attempts cannot commit or debit; valid route via graph is reachable.
- [ ] **LH1-04** — Implement strict ZooSaveV3 and lossless V1→V2→V3, V2→V3 migrations with original backup and future-format guard.
  - **Acceptance:** Frozen V1 and V2 projections identical after migration; corruption/future schema rejected without reset.
- [ ] **LH1-05** — Upgrade single IndexedDB store to version-3 CAS writer and old-binary barrier; prove compaction and retry semantics.
  - **Acceptance:** Two-tab race gives one winning transaction; no grant double credit, lost updates or overwrite of existing V2.
- [ ] **LH1-06** — Connect V3 canonical game entry and safe in-memory reset/Continue/Undo with existing one RAF/fixed tick.
  - **Acceptance:** V1/V2-loaded game can resume, pause, save and cold reload; no parallel engine, doubled audio or ghost sessions.

### LH2 — First complete lion care loop

- [ ] **LH2-01** — Introduce Lion Savanna unlock after EH04 and one-time 1,800 ZC reserve grant, separately claimed.
  - **Acceptance:** Locked/eligible/claimed UI matches actual proofs; CAS and ledger idempotency across cold reload.
- [ ] **LH2-02** — Create real costed savanna enclosure, 7×7 fence, selection and live/ghost material state.
  - **Acceptance:** One validated habitat, one costed debit; cancel and invalid/stale command change nothing.
- [ ] **LH2-03** — Welcome one adult male lion (private interim slice), with real state, grounded roaming and saved identity.
  - **Acceptance:** One lion moves and remains in its own habitat across reload; no visual-only zoo animal.
- [ ] **LH2-04** — Add lion food and drinking stations and causal feed/drink/refill system using shared money engine.
  - **Acceptance:** First lion actually seeks/consumes stock, hunger/thirst change; empty supplies prevent phantom consumption.
- [ ] **LH2-05** — Welcome two adult females and coordinate service access/queue/collision and safe pride membership.
  - **Acceptance:** All three independently eat/drink and move; no deadlock, unfair starvation or cross-species assignments.
- [ ] **LH2-06** — Enable protected enclosure/facility edit/remove/Undo, real paid refunds and removal dependencies.
  - **Acceptance:** Cannot remove occupied habitat or active-care fixtures unsafely; atomic refund+Undo survives remount rules.

### LH3 — Lion art + real behavior + signature event

- [ ] **LH3-01** — Build original recognizable stylized male lion rig (mane, paws, ears, muzzle, tail) and selection.
  - **Acceptance:** Actual Three.js model visible at four angles, release-quality mobile silhouette and correct disposal.
- [ ] **LH3-02** — Build shared female lion rig with clear morphology, distinct palette/identity and locomotion compatibility.
  - **Acceptance:** Two female rigs remain identifiable, share safe geometry, no wrong-sex morph or mesh leak.
- [ ] **LH3-03** — Implement grounded walking, turning, slope/ramp/kopje approach, collision and deterministic waypoints.
  - **Acceptance:** Actual displacement drives foot motion; no clipping, fence escapes, NaN, teleport or idle walking.
- [ ] **LH3-04** — Implement lion resting/shade-seeking with safe privacy choices and fair per-lion rest access.
  - **Acceptance:** Lions autonomously rest; shade and den state change rest/welfare, hiding cannot fake viewing.
- [ ] **LH3-05** — Implement feeding/drinking animations tied strictly to FSM/resource stock and body/contact positions.
  - **Acceptance:** Eat/drink cannot trigger away from stations; stock decrements atomically, audio remains optional.
- [ ] **LH3-06** — Add elevated kopje viewpoint and iconic ROAR sequence with jaw/head/mane motion and optional licensed/original audio.
  - **Acceptance:** Lion reaches valid rock before roaring; one `lion-roared` event/cooldown, no sound required to persist quest.
- [ ] **LH3-07** — Add coordinated, optional affiliative lion social behavior (approach, nuzzle/head rub, synchronize rest).
  - **Acceptance:** Pair IDs and distances valid; each can avoid contact; interrupted actions resume safely after cold save.
- [ ] **LH3-08** — Add scent trail / scent post + scratch-log enrichment with investigation and replenishment/cooldowns.
  - **Acceptance:** Actual sniff/scratch behavior raises measured enrichment; empty/expired enrichment cannot grant fake points.

### LH4 — Consequences, zoo economy + quests

- [ ] **LH4-01** — Implement explainable lion welfare scoring with resource, space, shade/rest, enrichment and social causes.
  - **Acceptance:** UI and simulation agree on 0–100; starving/blocked/unrested scores worsen and correctly recover.
- [ ] **LH4-02** — Extend multi-habitat visitor destination fairness to macaw + elephant + lion with true sightline/viewing.
  - **Acceptance:** Seeded visits reach all three if eligible; one paid admission per visitor; lion-hide not falsely observed.
- [ ] **LH4-03** — Balance reserve/operating prices, periodic upkeep, attraction and cash recovery without passive exploits.
  - **Acceptance:** Zero-cash granted build journey succeeds within quoted layout; no overflow, duplicate ticket or softlock.
- [ ] **LH4-04** — Add LQ01–LQ04 real evidence-based lion missions, rewards and separate achievement namespace.
  - **Acceptance:** Real FSM/consumption/visitor evidence only; exactly-once claim, persisted rewards, Q and EH unchanged.
- [ ] **LH4-05** — Add recoverable shortage/low-cash and blocked-path guidance to keep the lion loop playable.
  - **Acceptance:** Useful next action shown without free infinite supplies, silent money mint or forced reset.

### LH5 — Discoverability, mobile and accessibility

- [ ] **LH5-01** — Ship small ID-first/EN localization, unlock cues, contextual onboarding and next-action hints.
  - **Acceptance:** Every new button/alert/quest localized; player can enter lion flow without long tutorial.
- [ ] **LH5-02** — Integrate responsive build/inspect/care/quest panels, camera focus and selection gestures.
  - **Acceptance:** 360×780/780×360/1366×768 tested; critical controls reachable, no tap-vs-drag accidental purchase.
- [ ] **LH5-03** — Respect mute/autoplay/reduced-motion/WebGL fallback/quality tier with owned GPU/audio lifecycle.
  - **Acceptance:** No unexpected audio; low-quality/reduced motion retains deterministic gameplay, no leaks after retries.
- [ ] **LH5-04** — Run complete game journey with V2 migration, 3 habitats, lion FSM, quests and cold Continue at 1×/10×.
  - **Acceptance:** Evidence-backed golden run, both locales and three viewports, exact state/ledger before/after.

### LH6 — Hardening, release and safe handoff

- [ ] **LH6-01** — White-box deterministic unit/property/regression tests for strict invariants and all species.
  - **Acceptance:** Old V1/EH test corpus still passes; new tests expose and fix invariant failures.
- [ ] **LH6-02** — Black-box native browser E2E including real 3D behavior, visitor reachability and keyboard/touch emulator.
  - **Acceptance:** No fake DOM-only pass; actual built source and controls checked; physical device only if available.
- [ ] **LH6-03** — Version-3 migration/fault-injection tests for CAS, quota, abort, corruption, malformed save and concurrency.
  - **Acceptance:** No data loss or format downgrade; failure modes recover safely or show explicit supported error.
- [ ] **LH6-04** — 15-minute active 1× soak and 10× fixed-tick/visit stress + GPU/heap/draw-call/payload measurements.
  - **Acceptance:** Stable state and bounded resources; no undocumented FPS claim; capture environment and methodology.
- [ ] **LH6-05** — Review dead code, asset rights, dependency/security/privacy, repo size and retained non-game routes.
  - **Acceptance:** Source-reachability evidence, no unlicensed audio/model, no large QA buildup or extra telemetry.
- [ ] **LH6-06** — Prepare release/rollback using V3-compatible target; publish only after explicit production approval.
  - **Acceptance:** Exact tested commit, owner permission, single safe deploy, live smoke and forward-compatible rollback evidenced.

**Progress formula:** `100 × verified checked LH items / 39`. Initial status **0/39 = 0%**. Any new work may append a separate future section without silently changing denominator of this approved V1 PRD.

---

## 11. References / provenance

- Repo facts: read-only connected GitHub repository `https://github.com/andiwijaya/myzootwin.com`, observed 2026-11-06; file anchors `docs/ELEPHANT_PROGRESS.md`, `docs/ELEPHANT_RELEASE_PLAN.md`, `docs/ELEPHANT_TECHNICAL_CONTRACT.md`, `src/game/core/species.ts`, `src/game/core/zoo-state.ts`, `src/game/visitors/graph.ts`. **Repo source and its release plan are not proof of current production.**
- San Diego Zoo lion biology and behavior: https://animals.sandiegozoo.org/animals/lion
- Smithsonian National Zoo lions: https://nationalzoo.si.edu/animals/lion
- Smithsonian animal enrichment: https://nationalzoo.si.edu/animals/animal-enrichment
- Lincoln Park Zoo lion habitat design: https://www.lpzoo.org/pressroom/pepper-family-wildlife-center/
- Lincoln Park Zoo lion space behavior: https://www.lpzoo.org/the-science-of-space-at-pepper-family-wildlife-center/
- AZA Lion Care Manual (2012; reference not an accreditation claim): https://assets.speakcdn.com/assets/2332/lion_care_manual_20121.pdf
