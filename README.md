# MyZooTwin.com

An animal learning journal with a local, playable Tropical Creek Sanctuary at `/play`: build a habitat/path, care for two macaws, welcome visitors, earn virtual tickets and complete four missions. Progress uses versioned local storage. V1 retains its documented quality/signoff gates. The local Elephant Grove candidate adds Ayu and Nara, paid care, social behavior, bathing and four elephant missions in the same world. [Elephant checklist](docs/ELEPHANT_PROGRESS.md) and [release preparation](docs/ELEPHANT_RELEASE_PLAN.md) record verified scope; this candidate is not deployed.

## Development

```bash
npm ci
npm run dev
```

The committed lockfile fixes the installed dependency graph. Do not install or upgrade packages merely to run the existing local audit.

## Verification and build

```bash
npm test
npm run check
npm run build
```

The default build writes `dist/`. Preserve a running owner preview by using an isolated QA build/output instead. The current supported isolated procedure is in [docs/LOCAL_QA.md](docs/LOCAL_QA.md); milestone evidence distinguishes targeted integration checks from the generic browser-template verdict, physical devices and live production tests.

Existing main deployments are recorded in [homepage release evidence](docs/HOMEPAGE_LIVE_CLEANUP.md). Recheck current dashboard/runtime/source at release time; historical receipts are not current deployment proof. Set `PUBLIC_GA4_ID` only for the verified MyZooTwin stream/configuration. No release push/deployment is authorized by these development commands.

## Assets and audit

[Living requirements](docs/MYZOOTWIN_MASTER_PRD_V1.md), [progress](docs/MYZOOTWIN_PROGRESS.md), [asset provenance](docs/ASSET_MANIFEST.json). Original procedural game art/audio uses no downloaded models or recordings. The current journal hero/favicon are [original repo-native replacements](docs/M6-06_ORIGINAL_SITE_ASSETS.md); retired legacy rights and broader tooling/legal signoff are separate. Three.js's full MIT notice is in `public/licenses/three-MIT.txt` (Windows checkout may use CRLF). [Current Elephant audit](docs/ELEPHANT_HYGIENE.md) binds current assets and distribution. Do not publish dependency folders, QA fixtures or owner saves with the static website.
