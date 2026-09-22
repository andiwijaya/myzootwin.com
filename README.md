# MyZooTwin.com

An independent, English-language animal learning journal for curious people who care about wildlife, pets, and the living world.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run check
npm run build
```

The static output is written to `dist/`. Set `PUBLIC_GA4_ID` only when the dedicated MyZooTwin GA4 web stream is confirmed.

Production deploys are built automatically from `main` by Cloudflare Pages.

Analytics is configured for the dedicated MyZooTwin web stream.
