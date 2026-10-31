# MyZooTwin M0-01 audit checkpoint

Observation date: 2026-10-31 UTC. Status: **PARTIAL / BLOCKED**; verified V1 is **7/51**, from independently completed M0-02, M0-03, M0-04, M0-05, M0-06, M0-07 and M0-08 only. Scope: audit and documentation only.

## Repository and history

- Host: LAPTOP-P6FN41TC; verified checkout C:\\MyZooTwin (registered local project and git toplevel agree).
- Origin: https://github.com/andiwijaya/myzootwin.com.git. GitHub confirms public repository, default main, not archived; existing authorized CLI has read access. No credentials recorded.
- Baseline HEAD: f10d037e84ad504e8f70b4908d20375a11c08917 on main. Direct live ls-remote returned main as default and the same HEAD. Cached origin/main also equals it; ahead/behind 0/0 before this docs checkpoint.
- Initial git status was clean, including staged/unstaged/untracked. Read-only status used --no-optional-locks. Sandboxed status could not access the work tree; approved read-only execution outside the sandbox succeeded.
- Three commits on 2026-09-22: ad20f2b initial foundation; 8865af8 document production auto-deploy; f10d037 note dedicated analytics stream.
- Fifteen tracked baseline files. No applicable C:\\AGENTS.md, C:\\.agents/skills, repo AGENTS.md or repo .agents/skills found. No existing PRD, game engine, tests, GitHub workflow, _redirects, _headers, 404 page, wrangler config, or .openai hosting manifest found in baseline source.

## Stack and local commands

Astro static output, TypeScript strict, @astrojs/sitemap. Lockfile versions: Astro 5.18.2, TypeScript 5.9.3, @astrojs/check 0.9.10, @astrojs/sitemap 3.7.4. Package ranges: Astro ^5.2.0 and TypeScript ^5.7.2. No React/Three.js or backend in current dependencies. Local node_modules, .astro and dist already exist and are ignored; their presence is not proof of current build health.

Commands declared in package.json: npm run dev (astro dev), npm run check (astro check), npm run build (astro build), npm run preview (astro preview). No test script. None were run during M0-01 because this checkpoint changes documentation only. No installs, fetch/pull, builds, Actions, push or deploy performed.

## Live routing and SEO baseline

Public HTTP GET audit 2026-10-31 around 15:08-15:09 UTC; headers identify server cloudflare. Eight existing routes returned 200 with matching route canonical and route-specific title:

| URL path | Title |
|---|---|
| / | MyZooTwin - Explore. Discover. Understand Animals. |
| /about/ | About MyZooTwin - A curious animal learning journal |
| /animals/ | Animals - MyZooTwin |
| /wildlife/ | Into the wild - MyZooTwin |
| /pets/ | Life with pets - MyZooTwin |
| /learn/ | Learn something wild - MyZooTwin |
| /adventures/ | Field notes & adventures - MyZooTwin |
| /gear/ | Gear & field notes - MyZooTwin |

robots.txt, sitemap-index.xml and sitemap-0.xml returned 200. Sitemap lists exactly these eight URLs; robots allows crawling and points to sitemap-index.xml. Existing layout sets description, canonical, OG and Twitter title/description, lang=en and viewport. No social image metadata found in baseline source. Keep URLs, titles, canonical, journal content and sitemap membership stable.

**Critical routing observation:** GET /play returns 200 but its response body is byte-for-byte identical to the homepage and canonical is https://myzootwin.com/. It is a fallback response, not an implemented game route. Direct route reload/content checks in M0-04 must assert game-specific content and canonical, not status 200 alone. No redirect or Cloudflare configuration was changed.

## Cloudflare deployment facts and gaps (updated after existing CLI access found)

README says production builds automatically from main using Cloudflare Pages. astro.config.mjs site=https://myzootwin.com and output=static; README describes dist output. Live site responds through Cloudflare and has Cloudflare Insights. These facts do not establish the actual Pages project, repo binding, branch binding, build command, output setting, deployment SHA, preview policy or redirect rules.

Authenticated GitHub API reads: deployments endpoint empty; HEAD check-runs empty; combined commit statuses total_count=0/state=pending; Actions workflows total_count=0. No deployment identity can be recovered from those records. No existing wrangler executable or Cloudflare environment variable names were present in the task shell. No credential stores were scanned.

A dedicated background browser tab opened dash.cloudflare.com and redirected to /login. No login button, consent/grant, account creation or authentication was attempted. Tab closed after inspection.

Follow-up scoped lookup found an existing official Wrangler 4.145.0 installation in the npm npx cache (not in PATH or repo dependencies). No install/update occurred. Existing OAuth authentication was usable; no credential file or token contents were read by the agent, and no login/new grants were created. WRANGLER_SEND_METRICS=false was set for these read commands. An unrelated warning about missing K2 scopes was not acted on.

Supported CLI reads now verify:

- Pages project **myzootwin-com**, domains **myzootwin-com.pages.dev**, **myzootwin.com**, **www.myzootwin.com**, Git provider integration present.
- Production deployment list contains two main-branch deployments at source prefix **ad20f2b**: latest listed **5a755ea7-3513-41a8-8908-7dab1fa2b2cf** (https://5a755ea7.myzootwin-com.pages.dev), preceding **c3fd7754-64a8-40ee-8096-fd6f8fa7138a**. CLI reports relative status age, not an exact deployment timestamp or canonical pointer, so neither is invented.
- Prefix ad20f2b resolves unambiguously in local Git to **ad20f2b90fc110e5f8a886174b3ddb816070df7d**, the initial foundation commit. Diff to remote f10d037 is README-only (four added lines); do not claim production itself is deployed from f10d037.
- Read-only pages download config into an isolated task-workspace audit folder confirms **pages_build_output_dir=dist**, **compatibility_date=2026-09-22**, production environment variable name **PUBLIC_GA4_ID**, no root vars. Only names/selected non-sensitive fields were printed; downloaded config was not copied into application source or used to change project settings.

Commands used: wrangler whoami; pages project list (table and supported --json); pages deployment list --project-name myzootwin-com --environment production --json; pages download config myzootwin-com --cwd isolated-audit-folder. JSON list output exposes formatted display fields, not the full Pages project object. The downloaded configuration exposes runtime/output fields, not source/build settings.

**Remaining external configuration gap:** exact GitHub source-repository binding, dashboard build command/root directory, auto-deploy policy and canonical production deployment pointer are not exposed by the supported CLI read surfaces used. No credential extraction, custom authenticated API bypass or dashboard login was attempted. Keep M0-01 pending until a supported existing-authorized read route verifies these settings or the parent explicitly accepts the documented audit limit. This gap does not prevent independent public/local baseline capture; deployment remains gated.

## Analytics and privacy baseline

BaseLayout reads PUBLIC_GA4_ID and conditionally inserts gtag. Public HTML on all eight pages currently loads GA4 measurement ID G-08CW4H9R0K and static.cloudflareinsights.com beacon. Measurement ID is a public identifier, not a secret. README claims dedicated stream, but analytics property/stream ownership and Cloudflare env binding were not verified. No game telemetry exists. No privacy link or consent UI found in current homepage HTML; do not add new game analytics until privacy/consent requirements are reviewed. Preserve current behavior during the foundation work.

## Current content/assets/mobile

Current site is an English animal learning journal. Homepage has responsive editorial hero, four category cards and journal introduction; About describes the editorial project. Animals library and the five category pages are coming-soon content. No gameplay, persisted state, simulation, currency, missions, visitors, login or backend.

Active assets: public/images/myzootwin-beranda.png (3,001,357 bytes; declared 1024x1536); public/favicon.svg (328 bytes); Google Fonts DM Sans/Playfair Display referenced from CSS. Existing image is reusable media but rights/provenance are not yet established; preserve it and complete M0-03 asset/license inventory before commercial reuse assumptions.

Layout breakpoints include header/footer 820px/520px, homepage 900px/560px and About 650px. Navigation uses horizontal overflow on narrow screens. These are source observations, not mobile interaction passes. No screenshots, physical Android tests, device emulation or FPS measurements were performed in M0-01. M0-02 owns browser baseline and rollback plan; M0-08 owns performance baseline.

## Reuse and next steps

Reuse the existing Astro repository/build, static routing, visual identity/media when rights permit, journal pages, navigation, SEO and isolated existing analytics integration. Add a lazy-loaded /play module rather than replacing the whole site or introducing a second build/repository. Keep homepage emphasis unchanged until playable release readiness. Detailed proposed boundaries are in ARCHITECTURE.md.

Source packaging is resolved through the parent's explicitly authorized complete source-text transcription alternative (SOURCE_PROVENANCE.md); no native Library materialization success is claimed. Before M0-01 completion: resolve the remaining Cloudflare source/build/canonical-pointer verification gap above or obtain explicit parent acceptance of the documented audit limit. M0-02 baseline screenshots/browser smoke/rollback plan were independently completed without app or production changes; see M0-02_BASELINE.md. This does not close M0-01. M0-03 asset inventory/rights decisions/original macaw direction were also completed independently; see M0-03_ASSETS.md. M0-04 entry, M0-05 renderer, M0-06 core/save-codec, M0-07 QA and M0-08 measured foundation/hygiene baseline are complete; see their feature reports. Next feature is M1-01 small tropical diorama; M0-01 remains partial, the full M0 milestone is not claimed closed, and the external configuration gap/release gate remain pending. PRD test/runtime targets are requirements, not verified results. M7 remains deferred.
