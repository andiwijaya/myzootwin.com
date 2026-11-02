from pathlib import Path
import json,hashlib
root=Path(r'C:\MyZooTwin');out=Path(r'C:\Users\andi_\Documents\Codex\2026-10-31\task\m6-05-audit')
scene=root/'src/game/render3d/foundation-scene.ts';text=scene.read_text();old='Fixed-tick world with two autonomous macaws. Care is playable; entrance arrivals are bounded. Habitat visits, economy and durable saves remain later features.';assert old in text;text=text.replace(old,'Fixed-tick sanctuary with two autonomous macaws, topology-based visits and authoritative economy. Session state integrates with the versioned durable save controller.');scene.write_text(text)
path=root/'docs/ASSET_MANIFEST.json';m=json.loads(path.read_text());oldManifest=hashlib.sha256(path.read_bytes()).hexdigest();history=[]
def refresh(x,pointer=''):
 if isinstance(x,dict):
  name=x.get('path');old=x.get('sha256');p=root/(name or'_none_')
  if isinstance(name,str) and old and p.is_file():
   data=p.read_bytes();actual=hashlib.sha256(data).hexdigest()
   if old!=actual:
    history.append({'jsonPointer':pointer,'path':name,'previousHash':old,'previousBytes':x.get('bytes'),'scope':'Historical creation snapshot; retained, not current-file verification'})
    x['sha256']=actual
    if 'bytes'in x:x['bytes']=len(data)
    x['hash_checked_at']='2026-11-02'
  for k,v in list(x.items()):refresh(v,pointer+'/'+k)
 elif isinstance(x,list):
  for i,v in enumerate(x):refresh(v,pointer+'/'+str(i))
refresh(m)
m['assets'].append({'id':'original_procedural_ambience_m5_06','path':'src/game/audio/ambience.ts','bytes':(root/'src/game/audio/ambience.ts').stat().st_size,'sha256':hashlib.sha256((root/'src/game/audio/ambience.ts').read_bytes()).hexdigest(),'origin':'Original repository-authored seeded creek noise and four synthesized bird-like chirps; no external samples or recordings','rights_status':'original_project_work_no_external_asset_inputs','attribution':'MyZooTwin original task-authored code; no repository-wide open-source or public asset license assigned','external_asset_inputs':[],'generated_pcm_seconds':8,'sample_rate':22050,'source_download_bytes':0,'runtime_audio_buffer_bytes':705600,'activation':'Optional, initially muted, explicit user gesture; no microphone or camera','evidence':'M5-06_SETTINGS.md and M6-02_MEMORY_PAYLOAD.md; physical speaker audibility not certified'})
current=[]
for p in sorted((root/'src/game/render3d').rglob('*.ts')):
 current.append({'path':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'role':'Original project renderer/model/motion/input code; uses separately licensed Three.js API'})
public=[]
for p in sorted((root/'public').rglob('*')):
 if p.is_file():public.append({'path':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
m['historical_hash_observations']=history
m['audit_2026_11_02']={'scope':'M6-05 current asset/source inventory. Earlier creation budgets/feature claims remain historical and are superseded by dated milestone reports. Current file hashes do not by themselves establish rights.','previous_manifest_sha256':oldManifest,'baseline_commit':'e6023d75e2cfb98cdbc48eabeab16592dec012d4','current_renderer_sources':current,'public_files':public,'historical_hashes_refreshed':len(history),'original_audio_now_implemented':'original_procedural_ambience_m5_06','environment_plan_now_implemented':'tropical_creek_m1_01 and later world/gameplay reports','legacy_rights_unresolved':['journal_hero','site_favicon'],'legacy_policy':'Retain existing journal/site use and exact original bytes; no new export-pack rights, no assertion of ownership from repository presence. Release/privacy/legal review must retain this gap.','installed_dependencies_audited':369,'effective_zod_to_ts_license':'MIT based on installed LICENSE despite missing package.json license field','client_third_party':'Final Rollup emitted client modules identify Three.js only; full local MIT notice byte-matches public/licenses/three-MIT.txt. Sharp/native build tools are not browser artifacts.','dependency_report':'qa/m6-05/dependencies.json','commercial_rights_clearance':'NOT a legal sign-off or permission for new licensing agreements; no new agreements/downloaded media'}
m['scope']='Living asset provenance inventory through M6-05; historical creation measurements retained with current hash observations and explicit unresolved legacy rights.'
m['installed_dependency_license_inventory_complete']=True
m['full_transitive_license_audit_complete']=False
m['transitive_license_audit_limit']='All369 installed packages inventoried with package/license metadata and local notices.13 packages lack a standalone notice file; full source/native-package redistribution notice clearance is not claimed. Only Three.js is present in measured client chunks and its exact MIT notice is retained.'
m['performance_note']='Current first-party first-play graph is approximately1MB raw and below20MB distribution design budget; exact final measurements in M6-02/M6-05 reports. External Google Fonts/network excluded; physical Android/presentedFPS and M6-01 GPU attribution remain unverified.'
path.write_text(json.dumps(m,indent=2)+'\n',encoding='utf-8')
readme=root/'README.md';readme.write_text('''# MyZooTwin.com

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
''',encoding='utf-8')
runner=root/'scripts/qa/settings-isolated.mjs';t=runner.read_text();assert "'whitebox-m6-04'].includes(scope)"in t;runner.write_text(t.replace("'whitebox-m6-04'].includes(scope)","'whitebox-m6-04','hygiene-m6-05'].includes(scope)"))
receipt=json.loads((out/'build-archive.json').read_text());assert all(not(root/'.qa/builds'/x).exists()for x in receipt['removeExactly']);receipt['status']='REMOVED_AFTER_VERIFIED_ARCHIVE';receipt['removalVerification']='Eight exact directories absent; native PowerShell resolved-path, no-reparse and in-use checks. An initial Split-Path parameter-set preflight failed before any removal; corrected Directory.GetParent check completed safely.';(out/'build-archive.json').write_text(json.dumps(receipt,indent=2)+'\n')
(out/'manifest-changes.json').write_text(json.dumps({'previousManifestSHA256':oldManifest,'refreshedHistoricalRecords':history,'newAudioAsset':'original_procedural_ambience_m5_06','legacyHeroAndFaviconBytesUnchanged':True,'rightsNotInferredFromHashes':True},indent=2)+'\n')
print(json.dumps({'historicalHashesRefreshed':len(history),'currentRendererFiles':len(current),'publicFiles':len(public),'assetEntries':len(m['assets'])}))
