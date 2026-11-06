# Pride Care native picker stability

Owner reported a blinking mobile Pride Care facility combo box on6November2026. Baseline production was08048ca, Cloudflare deployment278c901a-9657-4fca-81b3-d72f08239743, confirmed successful by the current Cloudflare GitHub check for that exact commit. The initial in-progress check was superseded by a separate completed check127931362772 at13:55:51UTC; polling only the initial check does not establish current status.

The attached Library image libfile_6b82ba6d96bc8191a7cb751264f2c8ed resolved to373610.jpg,945x2048,266326bytes. Library metadata/OCR was readable and identified the Pride Care options. Pixels could not be inspected: the supported current transfer helper and one consumer-local retry both failed because Windows Python lacks os.setxattr. Neither destination exists. No storage URL was guessed and no helper was patched or bypassed.

The facility select's options and aria-label were assigned on every live Lion panel render, even when identical. Repeatedly replacing option text can invalidate an open native picker. Actual browser MutationObserver instrumentation on the real compiled select measured196 mutations in2507.8ms at360x780 (345px client width) while the selected value stayed lion-meat. This is a reproducible DOM-churn failure, not a claim of a physical-phone video or OS-specific reproduction.

The new syncLionFacilitySelect function writes aria-label, each option text and disabled state only when their values change. It retains the same select/options and selected value through unrelated simulation updates. Language changes still refresh labels/prices; pause/resume still changes disabled state. Gameplay, stock, money, migrations, schemas and actor behavior are unchanged.

Actual internal-browser green audit:0 mutations in2512.1ms at360x780, lion-water preserved and same control. EN landscape780x360 (765px client width):0 mutations in2515.2ms, lion-den preserved after ID-to-EN translation, command163 unchanged, state validation=true. The audit ran real1x simulation ticks on the isolated QA UUID database used for the earlier soak. It did not read or alter an owner's production save.

Focused regression27/27 passes, including500 repeated identical renders with no writes, language change preserving selection/option identity, one-time disabled transitions, existing editing/picking and renderer lifecycle checks. TypeScript has no diagnostics. The nine-page production build succeeds; the existing large-renderer-chunk warning remains. Final Astro result is retained with the receipts.

Receipts are under docs/qa/lion-picker. The temporary native MutationObserver audit belongs only to scripts/qa and is not shipped in the production entry. Physical Android/iOS testing remains UNRUN; the owner's original device should be checked after the hotfix reaches production.
