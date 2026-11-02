# MyZooTwin.com

An animal learning journal with a local, playable Tropical Creek Sanctuary at `/play`: build a habitat/path, care for two macaws, welcome visitors, earn virtual tickets and complete four missions. Progress uses versioned local storage. V1 is still undergoing its documented quality/release gates.

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

Cloudflare Pages project/main deployments were observed during M0-01. Exact source binding, dashboard build/root settings and automatic-deployment policy remain partially unverified; this README is not deployment proof. Set `PUBLIC_GA4_ID` only for the verified MyZooTwin stream/configuration. No release push/deployment is authorized by these development commands.

## Assets and audit

[Living requirements](docs/MYZOOTWIN_MASTER_PRD_V1.md), [progress](docs/MYZOOTWIN_PROGRESS.md), [asset provenance](docs/ASSET_MANIFEST.json). Original procedural game art/audio uses no downloaded models or recordings. Existing journal hero/favicon rights remain unverified; repository presence is not a redistribution license. Three.js's exact MIT notice is in `public/licenses/three-MIT.txt`. Do not publish dependency folders, QA fixtures or owner saves with the static website.
