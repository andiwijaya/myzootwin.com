# M5-04 - Responsive sanctuary HUD and safe input

**COMPLETE, V1 38/51 (74.51%), M5 4/7.** Local implementation `5be6cd84362caac65f16dce02a4f125e25468765`. Production is unchanged. The eight journal URLs, real /play route, content, SEO, analytics, dependencies, assets, save schema and authoritative game rules are preserved.

## Player behavior

The actual game now keeps its world beside a scrolling tool rail on desktop/landscape and above the rail on portrait. Four accessible tabs expose Missions, Care, Guests and Build. The compact top bar reads real coins, mean placed-bird welfare, current guests, mission and simulation speed; exact money remains available to assistive text/title when a large balance uses a compact display. No display-only economy or fake progress was introduced.

Existing language, Help, speed, reset/restore, Close and license controls live in one bounded scrolling Options disclosure. Save status stays visible; its 44 px disclosure reveals checkpoint metadata. Critical save errors, Retry/Reload/Continue and Resume remain outside the disabled gameplay body. Manual pause leaves information/tabs readable while mutation fieldsets and world input are disabled. Continue, conflict, unreadable-save and replacement holds retain the stronger gameplay gate. Existing ID/EN controls work here; full localization acceptance remains M5-05.

One scoped HUD observer/resize observer and abortable listeners reuse existing scene events. No new simulation or RAF loop was added. Tool focus reveals the correct tab and scrolls its own pane. Roving Home/End/arrows and PageDown/PageUp keep the world visible; text/select editing keys keep their normal meaning. Held-pointer focus never moves its target before pointer-up; pointer actions align after click. Opening Options, changing tabs, cancelling pointers and actual viewport resize release stale world input. A 60 ms resize debounce is cancelled on disposal; acceptance waits for the actual new dimensions/settled geometry rather than reading the API's immediate old frame.

## Final verification

Final run `20261101T225427Z-898c4bd8`, source `7cc3c9b94b841914f76fe9fcc5577bb267c26b2fa56d4337039859dbae4d509e`, build `79b68f2fbd334ebcc0c4faaee601256427728e2e9507b37019c1e0593e44d352`. Commands from C:\MyZooTwin:

```powershell
node scripts/qa/qa.mjs local
node scripts/qa/qa.mjs serve
node scripts/qa/payload.mjs
node scripts/qa/qa.mjs verify 20261101T225427Z-898c4bd8
```

- **438 unit/integration tests**, including 5 meaningful HUD summary/keyboard/pointer/lifecycle tests; **167 checked Astro files**, zero errors/warnings/hints; **9 route/canonical/sitemap regressions** pass. The six-case supported-browser receipt independently verifies PASS against the final unchanged source/build.
- **57 HUD cases**,19 per 1366x768, 360x780 and 780x360: actual-IDB Continue, exact summaries, tabs, keyboard scope, held pointer/focus order, contained panel scrolling, menu dismissal, selection/care focus, dialog Cancel, ID/EN, save details, paused read-only panels, exact reload, restart/restore, injected context loss, Close/remount and zero export requests. Starting full-game saves, injected pointer/key/context events are clearly labelled; they are separate from native product actions.
- **129 storage regressions** on final source:48 restart,54 recovery and27 autosave cases. Routine fixtures disable downloads and assert zero exports. The additional portrait recovery-dialog image uses an explicitly owned damaged-save fixture and does not export anything.
- **Three native fresh product loops**, desktop EN, portrait ID and landscape ID, use actual controls on a verified-empty own4342 origin: free preview/Cancel and tab cancellation, real habitat plus five connecting path tiles, two birds, feeder/water/refill/perches, actual paid visitors, Q01-Q04 and all rewards. Each recorded loop finishes at 975 ZC with 60 mission coins, true unlocks/badge and real consumption; balance reconciles to 1500 plus cashflow net. Each actual reload/Continue restores all six visible state groups and saved tick exactly. Native interactions were repeated after the final source gate, even though the last fixture-only correction leaves the product build byte-identical to G8.
- Native Home/End/arrows preserve selected tab and focus. PageDown moves only the Care scroller from 0 to 588 while document scrollY stays 80. Real Options Escape returns focus to its summary; save details and actual care-removal Cancel remain reachable. Desktop reset Escape/Cancel leaves progress unchanged; confirmed reset/reload yields 1500 ZC, 0 missions, 0 placed birds, tick 0 and 1x. Confirmed restore recovers the full original checkpoint exactly. Only isolated QA game data was reset.
- **16 settled layout combinations** cover EN and ID at 1366x768, 1920x1080, 360x780, 390x844, 320x568, 780x360, 844x390 and 768x1024. No horizontal document overflow, world/tab overlap, clipped main frame or offscreen Options menu in the measured normal/paused states. Native care/reset and labelled recovery dialogs fit their measured viewports. Actual viewport rotation releases an explicitly synthetic held touch without picking, spending or changing the camera; no physical-touch claim.
- Native WebGL pause/resume, injected context loss/retry and 3 true paused unmount/remounts retain **117 authoritative fields**. One session/subscriber/RAF maximum; disposal leaves 0 canvas/RAF/GPU resources/subscribers and 0 cleanup errors. Full app HUD cleanup is separately covered by the19-case fixtures and native entry/navigation. Uncapped native warn/error console reads are empty; expected injected-context logs are kept separately.
- Actual journal navigation, Back/Forward and direct reload show correct /animals/ and /play/ canonicals and 0 stale canvas. Owned QA tabs close, viewport resets and named loopback previews stop with their ports verified free.

See [final audit](qa/m5-04/independent-audit.json), [source-bound browser receipt](qa/m5-04/browser-receipt.json), [native/fixture/layout trace](qa/m5-04/hud-matrix.json), [final local run](qa/m5-04/final-run.json) and [screenshots](qa/m5-04/screens/).

## Payload and resource observations

| Observation | M5-03 | M5-04 | Change |
|---|---:|---:|---:|
| Built shell raw bytes |314,726|339,980|+25,254|
| First preview graph raw bytes |948,372|973,664|+25,292|
| First preview gzip-level9 estimate |252,656|257,577|+4,921|
| Lazy renderer raw bytes |633,646|633,684|+38|

The same labelled healthy two-bird scene remains 23 geometries, 21 owned materials, 1 texture, 7 programs, 42 draw calls and 11,996 submitted triangles; the two bird models account for 6,360 triangles. Those counts are unchanged from M5-03. The larger desktop world viewport can cost more pixels; this is not an FPS improvement claim. The existing approximately 634 KB lazy-chunk warning remains M6 profiling work. No assets/dependencies were added. File/gzip measurements exclude remote Google Fonts and do not measure actual transfer, first-interaction latency, presentedFPS, GPU time or retained memory. Callback/CPU observations in raw evidence are explicitly not presentationFPS.

## Evidence, findings and limits

Candidate receipts preserve actual initial sticky-header overlap, negative menu edge, frame margin, toolbar focus, keyboard scroll chaining and the native first-click focus race. These were fixed and verified on the final product. A synthetic focus probe originally included browser default focus scrolling; its corrected preventScroll call isolates the app handler. Candidate7's Vite hot refresh cleared unharvested fixture outputs after a source edit; those results remain partial/unverified. Earlier candidates are never relabelled as final. Every run uses a separate immutable evidence-writer object/folder. A packaging-only prior-payload filename error was corrected without changing product source or proof bytes.

Five original JPEG screenshots, raw receipts and CRC/every-entry SHA verified archives remain bounded. Three generated runs are retained after only named owned .qa/runs pruning. Original source-text requirements/Library references, valid media, original/native saves, earlier receipts and rollback history remain intact. Git's final implementation diff also reports **four nonblocking whitespace-only findings** on blank lines in the restructured Astro markup (11,13,14,157); this formatting check is recorded as WARN, not falsely passed. No P0/P1 functional issue was observed in this slice. The validated source is preserved without an unrelated formatting pass. Three raw preview logs also retain their original terminal blank line; the complete docs diff check reports those exact EOF warnings. The prose/structured-doc check excludes only those three immutable raw captures and passes. Raw bytes are independently hashed, not trimmed. A post-commit byte check found auto-CRLF normalization in generated metadata. The narrow `docs/qa/m5-04/** -text` Git attribute now preserves exact evidence bytes; final Git blobs are checked against every manifest entry. The final prose whitespace check covers the changed Markdown and attribute file; raw evidence uses byte/schema/CRC checks instead of formatting. Game source/build remain unchanged.

Physical Android/iOS/Safari/native touch, native backgrounding, whole browser-process restart, presentedFPS/GPU/network/remote fonts/full 15-minute populated soak, unaided-human testing and live production remain UNRUN. This is viewport plus native desktop-browser evidence, not physical-device certification. M0-01 external Cloudflare configuration and M4-07 recording remain partial and unchecked. Actual recovery download remains BLOCKED/UNRUN after the owner's earlier cancellation; no retry, alternative download route or new permission was attempted. No push, deploy, Actions, login or access change.

Next: **M5-05**, audit and complete all game UI/mission/tutorial/error/title/aria ID/EN and saved language preference. Hard stop remains **2026-11-02 01:00 UTC /08:00 WIB**, with no automatic resume after it.
