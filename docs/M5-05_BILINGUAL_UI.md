# M5-05 - Complete ID/EN game copy and persistent language choice

**COMPLETE: V1 39/51 (76.47%), M5 5/7.** Implementation `5b4b21cc46a4dd3482d0d15c4327cce555b6fe7e`, local only. Journal content/URLs/SEO/analytics, game rules, save schema, assets and dependencies are unchanged. M5-06 is not started.

## Result

The audit covers 382 entry messages and 196 panel messages in 10 paired dictionaries. ID/EN key sets, nonempty values and named placeholder contracts match. Indonesian care/mission/economy/recovery language now uses kesejahteraan, rentang, pencapaian, lencana, pengembalian, tempat pakan, titik simpan and simpanan instead of mixed English labels. Neutral names/numeric templates such as Zoo Coins, habitat, mission IDs and proper species/world names intentionally remain. Obsolete claims that autosave/visitor gameplay are future work were replaced with current truthful copy.

One cached presentation formatter supplies localized grouped money, numeric substitutions and fixed decimal simulation timers (EN 30.0, ID 30,0). Checkpoint seconds use clear ID units. Formatting never feeds back into stored IDs, raw data attributes, arithmetic or simulation. Existing localized time-of-day formatting is retained. Dynamic accessible names now update on both language selectors, restart controls and declarative game aria hooks; page title, description, mission/error/HUD/help text follows the current locale.

An explicit manual language choice now takes precedence over an older saved game's language, including a choice made while asynchronous loading is in flight. Without a manual choice, an existing valid game preference is restored; a fresh game follows browser id-prefix or English otherwise. Manual selection is saved in the existing versioned entry namespace and in active game preferences through the existing controller. Continue remains paused and adds no offline time. Recovery/restart use the same preference rule. No gameplay commands, economy, mission eligibility or core clock rules were changed.

The app's internal mount options can supply isolated preference storage/browser-language input for labelled tests. Production defaults still use browser localStorage and navigator.language. Older HUD/storage fixtures now explicitly isolate entry preferences rather than contaminating one another through shared-origin localStorage. The new language fixture uses its own persistent preference Map and bounded owned IndexedDB databases. This is not a hidden product URL or an alternate browser driver.

## Verification

Final run `20261101T233501Z-11e5d1e5`, source `bf989197c795ed935bb5d57668983d1ff19c0f4d00dc42125a674867afa91528`, build `6ef8b618b7a6ecd16c027c8df480c640004fd846daa8e58c83cdb52c2dac6189`. Local commands:

```powershell
node --experimental-strip-types --test tests/localization.test.mjs tests/entry-preferences.test.mjs
node scripts/qa/qa.mjs local
node scripts/qa/qa.mjs serve
node scripts/qa/payload.mjs
node scripts/qa/qa.mjs verify 20261101T233501Z-11e5d1e5
```

- **443 unit/integration tests**, including 5 new translation/format/preference/aria tests; the targeted 13-test run also passed. **170 checked files**, zero errors/warnings/hints; build and 9 route/canonical/sitemap regressions pass.
- **39 language cases**,13 per desktop 1366x768, portrait 360x780 and landscape 780x360. They cover explicitly injected ID/non-ID defaults, manual choice across remount, an old English game with latest ID choice, paused Continue/no offline ticks, all aria hooks/title/description, ID/EN decimals/checkpoints/live relabels, unavailable storage, unknown future format, corrupt-save review/Cancel, quota rejection and actual competing owned-IDB writer conflicts in both languages. Originals remain unchanged on rejection/Cancel. Exports are disabled and report 0.
- **57 prior HUD and 129 storage browser cases** pass on the final source (48 restart,54 recovery,27 autosave). Together with the language cases this is 225 labelled browser cases. Existing source/receipt checks distinguish fixtures from actual native product interaction.
- **Native actual product**, verified-empty4343 QA origin: full desktop EN, portrait ID and landscape ID Q01-Q04 build/care/visitor/ticket flows, all finishing 975 ZC with 60 mission reward coins. Portrait/landscape reload/Continue restore the same six visible state groups and saved tick exactly. From the completed English game, actual Close -> Settings -> ID -> reload -> Continue keeps ID despite the old English save, while coins/missions/world/cashflow/speed and saved tick stay unchanged. Actual ID Help/settings and keyboard controls work. No unrelated save was reset.
- **16 settled size/language observations**, EN/ID at 1366x768, 1920x1080, 360x780, 390x844, 320x568, 780x360, 844x390 and 768x1024. Longer translated menus/dialogs fit measured bounds, with no horizontal overflow or clipped normal/paused game frame. Native ID keyboard Home/End and panel PageDown preserve world position.
- Native WebGL pause/resume, explicitly injected healthy starting state/context loss, retry and 3 true paused remounts preserve 117 authoritative fields; max 1 session/RAF, zero released resources/subscribers/canvas/RAF/cleanup errors. An extra isolated preview-controller error image deliberately retains its English fixture shell while demonstrating ID error/retry copy; it is not presented as a complete ID product screenshot. Full app copy is verified by the language fixture and native product images.
- Native warning/error console reads are empty and uncapped; injected context warnings are recorded separately. Actual journal navigation/Back/Forward/reload keeps correct canonicals and no stale canvas. Owned tabs/servers close, viewport resets and ports4321/4322/4343 are free.

Automatic ID/non-ID defaults are proven by unit tests and an explicitly injected app browser-language argument. Native IAB English default is observed. No browser/OS language was changed, and viewport or injected events are not physical Android/native-touch proof.

## Payload and evidence

Built shell 341,468 raw bytes; first preview graph 975,152 raw /257,981 gzip-level9 estimate. Both raw graphs add 1,488 bytes and the gzip estimate adds 404 bytes versus M5-04. Lazy renderer 633,684 bytes is unchanged. Existing chunk warning remains M6 profiling work. These figures exclude remote fonts and do not claim network/first-interaction/FPS/GPU or leak performance.

The intermediate word edit briefly altered six named placeholders; the audit caught them before the gate, identifiers were restored and all final contracts pass. One concurrent native Run input timed out after execution; disabled control/RUNNING output proved it had started, so it was not clicked again. Its final PASS result was harvested. No rejected or partial result was relabelled as a pass. Separate immutable writer objects/folders keep the M5-04 and M5-05 receipts distinct.

The four M5-04 blank-line whitespace findings are now fixed; the source git diff check passes. Raw captured logs retain their bytes/terminal blank lines and use manifest/schema/CRC checks rather than prose formatting. The evidence-only -text Git rule covers M5-05 before staging, preventing EOL normalization. Five JPEGs and bounded original receipts are retained; only the exact oldest owned ignored run was archived/CRC/SHA verified before pruning to 3 generated runs. Requirements/source transcriptions, valid media, earlier receipts/native saves and rollback history remain intact.

See [audit](qa/m5-05/independent-audit.json), [final local/browser result](qa/m5-05/final-run.json), [actual language/native matrix](qa/m5-05/language-matrix.json), [dictionary audit](qa/m5-05/dictionary-audit.json) and [screenshots](qa/m5-05/screens/).

## Remaining boundaries

The existing English journal and its global navigation are preserved; this feature localizes the actual game scope. M0-01 exact external Cloudflare configuration and M4-07 recording remain partial/unchecked. Physical devices/native touch, native background, whole browser-process restart, presentedFPS/GPU/network/full15-minute populated soak, unaided-human testing and live production remain UNRUN. The optional recovery download remains BLOCKED/UNRUN after the owner's earlier cancellation: no export/download retry, alternate route or new permission prompt. No push, deploy, Actions, login or access changes.

Next **M5-06**, functional Help/settings/mute/reduced-motion/quality coverage, only after parent dispatch. Hard stop remains **2026-11-02 01:00 UTC /08:00 WIB**; save a truthful checkpoint and stop before it, with no automatic resume.
