<!--
TEXT TRANSCRIPTION / REQUIREMENTS HANDOFF
Source: MYZOOTWIN_DOT_HANDOFF(1).md
Library identity: libfile_0a86d11b4b2c8191923842b027a01294
Complete source-text alternative supplied by parent on 2026-10-31 after supported Library reads.
This is authored Markdown, not a byte-exact Library original or native materialized file.
No Library xattrs/version identity preservation is claimed. Original Library source remains unchanged.
Received HTML entities are retained in the text below. This source transcript is immutable; execution updates belong in ../MYZOOTWIN_MASTER_PRD_V1.md.
-->

# Dot Handoff — MyZooTwin.com V1

**Companion file:** `MYZOOTWIN_MASTER_PRD_V1.md`  
**Date:** 31 Oktober 2026  
**Mode:** Autonomous small end-to-end features; local-first testing; production safe.

Dot, gunakan `MYZOOTWIN_MASTER_PRD_V1.md` sebagai single source of truth dan kerjakan M0-01 terlebih dahulu.

**Mission:** Transform MyZooTwin.com from an animal learning journal into a **playable living zoo game**, while keeping existing content/URLs intact. Put the game on `/play`; only shift homepage emphasis after the game is functionally ready.

## Hard constraints

1. **Functionality first**. Jangan buat zoo 3D cantik yang tidak bisa dimainkan. First release must have a complete habitat→bird care→visitor→ticket→mission→save game loop.
2. **Smallest verified slice**. Satu task saja: implement → local build/test → browser visual E2E mobile &amp; desktop → fix → commit → update checklist `[x]` plus evidence → move to next.
3. **Start with repo audit.** Reuse existing stack, existing site, existing deployment wherever compatible. Confirm, don't guess.
4. **Golden species:** only one tropical bird species and 2 animals in Tropical Creek sanctuary initially; additional species only AFTER V1 stable. Model must be attractive enough, not a capsule placeholder.
5. **Performance first for mobiles:** responsive touch controls, low-poly scene, small assets, auto graphics options; measure at each milestone.
6. **No backend/login/IAP/multiplayer in V1**. Local progress with schema version and robust reload.
7. **Bilingual ID/EN** with UI switch and auto browser preference; content/mission/critical errors included.
8. **Full autonomy** except genuine blockers (credentials/2FA, licensing/legal, irreversible production changes). Do not ask PO for approval of each micro-feature.
9. **No wasted GitHub Actions minutes:** build/test locally; only push to production main at release gate; test deployed live after deployment.
10. **Hygiene:** keep repo manageable, remove generated/failed artifacts but protect valid reusable media and rollback. No duplicate simulation loops.

## First deliverable (M0-01)

Audit and report: repo location, framework, build/test commands, Cloudflare configuration, existing routes &amp; SEO risk, mobile considerations, active assets, existing analytics, candidate game-module architecture, key blockers. Do not delete or replace anything before verification.

## Reporting

At each feature completion, send: feature ID, what is implemented, test evidence, local commit hash, known issues, next ID, and **verified count / 51 percentage**. PRD checkboxes must match reality. Do not mark tests passed without running them.

**Exit target:** Complete M0–M6, test whole V1 locally, deploy once safe, test live on the real URL, and report. Only then give PO the live URL for personal playtest; defer M7.
