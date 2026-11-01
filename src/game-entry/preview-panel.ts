import type {BirdsView,BirdCommand} from '../game/animals/autonomy.ts';
import type {StudioView,StudioCommand} from '../game/render3d/macaw/studio-contract.ts';
import type {EditView,RemovalQuote,EditTarget} from '../game/world/editing.ts';
import type {AccessSummary} from '../game/world/paths.ts';
import {sanctuarySessionFor} from '../game/core/session-state.ts';
import type { PlacementCommand, PlacementView } from '../game/world/placement-preview.ts';
import type { SceneIdentity } from '../game/render3d/scene-selection.ts';
import { presentSelection } from './selection-presentation.ts';
import type { CameraCommand } from '../game/render3d/camera-navigation.ts';
import { createPreviewController, type PreviewLoader, type PreviewState } from '../game/render3d/preview-controller';
import { entryMessages, type EntryLocale, type EntryMessage } from './locale';

export interface PreviewPanelOptions { loadRenderer?: PreviewLoader; }
const mounted = new WeakMap<HTMLElement, ReturnType<typeof createPanel>>();

function createPanel(root: HTMLElement, options: PreviewPanelOptions) {
  const panel = root.querySelector<HTMLElement>('[data-renderer-panel]');
  const illustration = root.querySelector<HTMLElement>('[data-preview-illustration]');
  const host = root.querySelector<HTMLElement>('[data-preview-stage]');
  const feedback = root.querySelector<HTMLElement>('[data-preview-feedback]');
  const title = root.querySelector<HTMLElement>('[data-preview-title]');
  const detail = root.querySelector<HTMLElement>('[data-preview-detail]');
  const caption = root.querySelector<HTMLElement>('[data-preview-caption]');
  const open = root.querySelector<HTMLButtonElement>('[data-preview-open]');
  const close = root.querySelector<HTMLButtonElement>('[data-preview-close]');
  const retry = root.querySelector<HTMLButtonElement>('[data-preview-retry]');
  const reload = root.querySelector<HTMLButtonElement>('[data-preview-reload]');
  if (!panel || !illustration || !host || !feedback || !title || !detail || !caption || !open || !close || !retry || !reload) throw new Error('Incomplete preview panel');
  let locale: EntryLocale = 'en';
  let disposed = false;
  let state: PreviewState = { status: 'closed' };
  const events = new AbortController();
  let selected:SceneIdentity|null=null;
  let studio:StudioView={active:false,habitat:false,clip:'perch',angle:'quarter',motionPaused:false,canHabitat:false};
  let birds:BirdsView={habitat:false,placed:0,birds:[]};
  let editView:EditView={canUndo:false,reason:null,result:null};
  let removal:RemovalQuote|null=null;
  let removalName='';
  const editDialog=root.querySelector<HTMLDialogElement>('[data-edit-dialog]');
  function renderEdit(){
    const copy=entryMessages[locale],ready=state.status==='ready';
    root.querySelector('[data-entry-text="editHint"]')?.replaceChildren(copy.editHint);
    const remove=root.querySelector<HTMLButtonElement>('[data-edit-remove]');
    if(remove){remove.hidden=!ready||studio.active||!selected||!['habitat','path'].includes(selected.kind);remove.textContent=copy.editRemove;}
    const undo=root.querySelector<HTMLButtonElement>('[data-edit-undo]');if(undo){undo.hidden=!ready||!editView.canUndo;undo.textContent=copy.editUndo;}
    const keys={missing:'editMissing',protected:'editProtected','in-use':'editInUse',stale:'editStale',funds:'editFunds',command:'editCommand'} as const;
    root.querySelector('[data-edit-status]')?.replaceChildren(editView.reason?copy[keys[editView.reason]]:editView.result?copy[editView.result==='removed'?'editRemoved':'editRestored']:'');
    root.querySelector('[data-edit-cancel]')?.replaceChildren(copy.editCancel);root.querySelector('[data-edit-confirm]')?.replaceChildren(copy.editConfirm);
    root.querySelector('#edit-dialog-title')?.replaceChildren(copy.editTitle);root.querySelector('#edit-dialog-description')?.replaceChildren(copy.editIntro);
    root.querySelector('[data-edit-object]')?.replaceChildren(removalName);
    root.querySelector('[data-edit-refund]')?.replaceChildren(copy.editRefund.replace('{n}',String(removal?.refund??0)));
  }
  const selectionPanel=root.querySelector<HTMLElement>('[data-scene-selection]');
  const selectionStatus=root.querySelector<HTMLOutputElement>('[data-selection-announcement]');
  function renderSelection() {
    renderEdit();
    if(!selectionPanel)return;
    selectionPanel.hidden=state.status!=='ready'||studio.active||!selected;
    const button=root.querySelector<HTMLButtonElement>('[data-clear-selection]');if(button)button.textContent=entryMessages[locale].selectionDismiss;
    if(selected&&state.status==='ready') {
      const view=presentSelection(selected,locale);
      root.querySelector('[data-selection-title]')?.replaceChildren(view.title);
      root.querySelector('[data-selection-location]')?.replaceChildren(view.location);
      root.querySelector('[data-selection-detail]')?.replaceChildren(view.detail);
      if(selectionStatus)selectionStatus.value=view.title;
    } else {
      for(const field of ['title','location','detail'])root.querySelector(`[data-selection-${field}]`)?.replaceChildren();
    }
  }
  let placement:PlacementView|null=null;
  let habitatCount=0;let access:AccessSummary|null=null;
  const placementTools=root.querySelector<HTMLElement>('[data-placement-tools]');
  function renderPlacement(){
    if(!placementTools)return;const copy=entryMessages[locale],active=Boolean(placement?.active),path=placement?.kind==='path';
    placementTools.hidden=state.status!=='ready'||studio.active;placementTools.dataset.valid=String(placement?.reason==='ready');
    const start=root.querySelector<HTMLButtonElement>('[data-placement-command="begin"]');if(start){start.hidden=active;start.textContent=copy.placementStart;}
    const pathStart=root.querySelector<HTMLButtonElement>('[data-placement-command="begin-path"]');if(pathStart){pathStart.hidden=active;pathStart.textContent=copy.pathStart;}
    root.querySelector('[data-access-status]')?.replaceChildren(copy[!access?.habitats?'accessNoHabitat':access.connected?'accessConnected':'accessDisconnected'].replace('{n}',String(access?.pathTiles??1)).replace('{r}',String(access?.routeCells??0)));
    if(placementTools)placementTools.dataset.connected=String(Boolean(access?.connected));
    const edit=root.querySelector<HTMLElement>('[data-placement-edit]');if(edit)edit.hidden=!active;
    for(const el of root.querySelectorAll<HTMLElement>('[data-placement-text]'))el.textContent=copy[path?(el.dataset.placementText==='placementTitle'?'pathTitle':'pathHint'):el.dataset.placementText as EntryMessage];
    for(const command of ['confirm','cancel','left','right','up','down'] as const){const button=root.querySelector<HTMLButtonElement>(`[data-placement-command="${command}"]`);if(!button)continue;const key=`placement${command[0].toUpperCase()}${command.slice(1)}` as EntryMessage;if(command==='confirm'||command==='cancel')button.textContent=copy[path?(command==='confirm'?'pathConfirm':'pathCancel'):key];else button.setAttribute('aria-label',copy[key]);if(command==='confirm')button.disabled=!active||placement?.reason!=='ready';}
    const reasonKey=`placement${(placement?.reason??'choose')[0].toUpperCase()}${(placement?.reason??'choose').slice(1)}` as EntryMessage;
    root.querySelector('[data-placement-reason]')?.replaceChildren(active?copy[path&&placement?.reason==='ready'?'pathReady':path&&placement?.reason==='path'?'pathAlready':reasonKey]:'');
    root.querySelector('.placement-arrows')?.setAttribute('aria-label',path?copy.pathTitle:copy.placementTitle);
    const anchor=placement?.proposal?.anchor;
    root.querySelector('[data-placement-location]')?.replaceChildren(active&&anchor?copy.placementLocation.replace('{x}',String(anchor.x+1)).replace('{z}',String(anchor.z+1)):'');
    const confirmed=root.querySelector<HTMLElement>('[data-placement-confirmed]');if(confirmed){confirmed.hidden=habitatCount===0||active;confirmed.textContent=copy.placementConfirmed;}
  }
  const cameraControls=root.querySelector<HTMLElement>('[data-camera-controls]');
  const zoomOutput=root.querySelector<HTMLOutputElement>('[data-camera-zoom]');
  function cameraState(zoom=Number(host?.dataset.cameraZoom??1)) {
    if(zoomOutput)zoomOutput.value=`${Math.round(zoom*100)}%`;
    for(const button of root.querySelectorAll<HTMLButtonElement>('[data-camera-command]'))button.disabled=state.status!=='ready'||(button.dataset.cameraCommand==='zoom-in'?zoom>=3:button.dataset.cameraCommand==='zoom-out'?zoom<=1:zoom===1);
  }

  function renderBirds(){
    const tools=root.querySelector<HTMLElement>('[data-bird-tools]');if(!tools)return;const copy=entryMessages[locale];tools.hidden=state.status!=='ready'||studio.active;
    for(const el of tools.querySelectorAll<HTMLElement>('[data-entry-text]'))el.textContent=copy[el.dataset.entryText as EntryMessage];
    const welcome=tools.querySelector<HTMLButtonElement>('[data-birds-command="welcome"]'),reserve=tools.querySelector<HTMLButtonElement>('[data-birds-command="reserve"]');
    if(welcome){welcome.hidden=birds.placed>0;welcome.disabled=!birds.habitat;welcome.textContent=copy.birdsWelcome;}if(reserve){reserve.hidden=birds.placed===0;reserve.textContent=copy.birdsReserve;}
    tools.querySelector('[data-birds-status]')?.replaceChildren(copy[birds.placed?'birdsPlaced':birds.habitat?'birdsWaiting':'birdsNeedHabitat']);
    const list=tools.querySelector('[data-birds-list]');if(list){list.replaceChildren();if(birds.placed)for(const [i,b]of birds.birds.entries()){const row=document.createElement('li');row.dataset.birdId=b.id;row.textContent=copy.birdName.replace('{n}',String(i+1))+' · '+copy[b.behavior==='wander'?'birdWander':b.behavior==='perch'?'birdPerch':'birdIdle'];list.append(row);}}
  }
  function renderStudio(){
    const copy=entryMessages[locale],ready=state.status==='ready',tools=root.querySelector<HTMLElement>('[data-macaw-tools]');if(!tools)return;
    tools.hidden=!ready;const controls=root.querySelector<HTMLElement>('[data-macaw-controls]');if(controls)controls.hidden=!studio.active;
    for(const button of tools.querySelectorAll<HTMLButtonElement>('[data-studio-command]')){const command=button.dataset.studioCommand as StudioCommand;const key=command==='pause'?(studio.motionPaused?'macawResume':'macawPause'):command==='open'?'macawOpen':command==='close'?'macawClose':command==='detail'?'macawDetail':'macawHabitat';button.textContent=copy[key];button.hidden=command==='open'?studio.active:command==='detail'?!studio.habitat:command==='habitat'?studio.habitat:false;if(command==='habitat')button.disabled=habitatCount===0;}
    for(const el of tools.querySelectorAll<HTMLElement>('[data-entry-text]'))el.textContent=copy[el.dataset.entryText as EntryMessage];
    for(const [selector,value]of [['[data-macaw-clip]',studio.clip],['[data-macaw-angle]',studio.angle]]){const select=root.querySelector<HTMLSelectElement>(selector);if(!select)continue;select.value=value;for(const option of select.options)option.textContent=copy[`macaw${option.value[0].toUpperCase()}${option.value.slice(1)}` as EntryMessage];}
    root.querySelector('[data-macaw-status]')?.replaceChildren(copy[studio.motionPaused?'macawPaused':'macawPlaying']);root.querySelector('[data-macaw-scale]')?.replaceChildren(studio.habitat?copy.macawScaleHint:habitatCount===0?copy.macawNeedHabitat:'');
    if(cameraControls)cameraControls.hidden=!ready||(studio.active&&!studio.habitat);
    host?.setAttribute('aria-label',copy[studio.active?'macawCanvas':'previewCanvas']);
    host?.setAttribute('aria-keyshortcuts',studio.active?(studio.habitat?'ArrowUp ArrowDown ArrowLeft ArrowRight Home Escape':'Escape'):'ArrowUp ArrowDown ArrowLeft ArrowRight Home Escape Enter');
    root.querySelector('[data-camera-help]')?.replaceChildren(copy[studio.active&&studio.habitat?'macawScaleHint':'cameraHelp']);
    if(caption)caption.textContent=copy[studio.active?'macawSubtitle':state.status==='ready'||state.status==='loading'?'previewCaption':'artCaption'];
    renderBirds();
    if(ready){if(title)title.textContent=copy[studio.active?'macawTitle':'previewReady'];if(detail)detail.textContent=copy[studio.active?'macawSubtitle':'previewReadyDetail'];}
  }

  function render(next: PreviewState) {
    const previous = state.status;
    state = next;
    if (!panel || !illustration || !host || !feedback || !title || !detail || !caption || !open || !close || !retry || !reload) return;
    const copy = entryMessages[locale];
    panel.lang = locale;
    if(next.status!=='ready'){studio={...studio,active:false,habitat:false};selected=null;placement=null;habitatCount=0;access=null;editView={canUndo:false,reason:null,result:null};removal=null;if(editDialog?.open)editDialog.close();}
    renderPlacement();
    renderSelection();
    if(cameraControls){cameraControls.hidden=next.status!=='ready';cameraControls.setAttribute('aria-label',copy.cameraControls);}
    root.querySelector('[data-camera-help]')?.replaceChildren(copy.cameraHelp);
    for(const button of root.querySelectorAll<HTMLButtonElement>('[data-camera-command]')) {
      const command=button.dataset.cameraCommand;
      if(command==='reset')button.textContent=copy.cameraReset;
      button.setAttribute('aria-label',copy[command==='zoom-in'?'cameraZoomIn':command==='zoom-out'?'cameraZoomOut':'cameraReset']);
    }
    cameraState();
    const failed = next.status === 'unsupported' || next.status === 'error';
    panel.dataset.rendererState = next.status;
    illustration.hidden = next.status === 'loading' || next.status === 'ready';
    host.hidden = next.status !== 'loading' && next.status !== 'ready';
    host.setAttribute('aria-label', copy.previewCanvas);
    host.setAttribute('aria-busy', String(next.status === 'loading'));
    feedback.hidden = next.status === 'closed';
    feedback.setAttribute('role', failed ? 'alert' : 'status');
    open.hidden = next.status !== 'closed';
    open.disabled = false;
    open.textContent = copy.previewOpen;
    close.hidden = next.status === 'closed';
    close.textContent = copy[failed ? 'previewBack' : 'previewClose'];
    retry.hidden = !failed || (next.status === 'error' && next.reason === 'load');
    retry.textContent = copy.previewRetry;
    reload.hidden = next.status !== 'error' || next.reason !== 'load';
    reload.textContent = copy.previewReload;
    caption.textContent = copy[next.status === 'loading' || next.status === 'ready' ? 'previewCaption' : 'artCaption'];
    let titleKey: EntryMessage = 'previewLoading';
    let detailKey: EntryMessage = 'previewLoadingDetail';
    if (next.status === 'ready') { titleKey = 'previewReady'; detailKey = 'previewReadyDetail'; }
    if (next.status === 'unsupported') { titleKey = 'previewUnsupported'; detailKey = 'previewUnsupportedDetail'; }
    if (next.status === 'error') {
      titleKey = next.reason === 'context-lost' ? 'previewLost' : next.reason === 'load' ? 'previewLoadError' : 'previewError';
      detailKey = next.reason === 'load' ? 'previewReloadDetail' : 'previewErrorDetail';
    }
    title.textContent = copy[titleKey];
    detail.textContent = copy[detailKey];
    renderStudio();
    if (previous !== next.status && next.status !== 'closed' && !root.querySelector('dialog[open]')) {
      (failed ? next.status === 'error' && next.reason === 'load' ? reload : retry : close).focus();
    }
  }

  const load: PreviewLoader = options.loadRenderer ?? (async () => {
    const module = await import('../game/render3d/foundation-scene');
    return (onFailure) => module.mountFoundationScene(host, onFailure,{stateStore:sanctuarySessionFor(root)});
  });
  const controller = createPreviewController(load, render);
  host.addEventListener('scene-birds-change',event=>{birds=(event as CustomEvent<BirdsView>).detail;renderBirds();},{signal:events.signal});
  for(const button of root.querySelectorAll<HTMLButtonElement>('[data-birds-command]'))button.addEventListener('click',()=>{controller.birds(button.dataset.birdsCommand as BirdCommand);host.focus({preventScroll:true});host.scrollIntoView({block:'nearest',behavior:'instant'});},{signal:events.signal});
  host.addEventListener('scene-studio-change' ,event=>{studio=(event as CustomEvent<StudioView>).detail;renderPlacement();renderSelection();renderStudio();},{signal:events.signal});
  for(const button of root.querySelectorAll<HTMLButtonElement>('[data-studio-command]'))button.addEventListener('click',()=>{const command=button.dataset.studioCommand as StudioCommand;controller.studio(command);host.focus({preventScroll:true});if(command!=='pause')host.scrollIntoView({block:'nearest',behavior:'instant'});},{signal:events.signal});
  root.querySelector<HTMLSelectElement>('[data-macaw-clip]')?.addEventListener('change',event=>{controller.studio('clip',(event.target as HTMLSelectElement).value);host.scrollIntoView({block:'nearest',behavior:'instant'});},{signal:events.signal});
  root.querySelector<HTMLSelectElement>('[data-macaw-angle]')?.addEventListener('change',event=>{controller.studio('angle',(event.target as HTMLSelectElement).value);host.scrollIntoView({block:'nearest',behavior:'instant'});},{signal:events.signal});
  root.querySelector('[data-edit-remove]')?.addEventListener('click',()=>{
    if(!selected||removal||!editDialog)return;
    const target:EditTarget=selected.kind==='habitat'?{kind:'habitat',id:selected.id}:{kind:'path',cell:{...selected.cell}};
    const result=controller.quoteRemoval(target);if(!result)return;
    if(!result.ok){editView={...editView,reason:result.reason,result:null};renderEdit();return;}
    controller.placement('cancel');removal=result.quote;removalName=presentSelection(selected,locale).title;renderEdit();
    editDialog.showModal();controller.setPaused(true);root.querySelector<HTMLElement>('[data-edit-cancel]')?.focus();
  },{signal:events.signal});
  function dismissRemoval(){removal=null;if(editDialog?.open)editDialog.close();controller.setPaused(false);if(state.status==='ready')host?.focus({preventScroll:true});}
  root.querySelector('[data-edit-cancel]')?.addEventListener('click',dismissRemoval,{signal:events.signal});
  root.querySelector('[data-edit-confirm]')?.addEventListener('click',()=>{const quote=removal;if(!quote)return;dismissRemoval();controller.edit('remove',quote);},{signal:events.signal});
  editDialog?.addEventListener('close',()=>{removal=null;controller.setPaused(false);},{signal:events.signal});
  root.querySelector('[data-edit-undo]')?.addEventListener('click',()=>{controller.edit('undo');host?.focus({preventScroll:true});},{signal:events.signal});
  host.addEventListener('scene-edit-change',event=>{editView=(event as CustomEvent<EditView>).detail;renderEdit();},{signal:events.signal});
  host.addEventListener('scene-selection-change' ,event=>{const had=Boolean(selected);selected=(event as CustomEvent<SceneIdentity|null>).detail;renderSelection();if(!selected&&had&&selectionStatus)selectionStatus.value=entryMessages[locale].selectionCleared;},{signal:events.signal});
  host.addEventListener('scene-access-change',event=>{access=(event as CustomEvent<AccessSummary>).detail;renderPlacement();},{signal:events.signal});
  host.addEventListener('scene-habitat-change',event=>{habitatCount=(event as CustomEvent<{count:number}>).detail.count;renderPlacement();renderStudio();},{signal:events.signal});
  host.addEventListener('scene-placement-change',event=>{placement=(event as CustomEvent<PlacementView>).detail;renderPlacement();},{signal:events.signal});
  for(const button of root.querySelectorAll<HTMLButtonElement>('[data-placement-command]'))button.addEventListener('click',()=>{const command=button.dataset.placementCommand as PlacementCommand;controller.placement(command,placement?.revision);if(command==='begin'||command==='begin-path'||command==='cancel'||command==='confirm')host.focus({preventScroll:true});},{signal:events.signal});
  placementTools?.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();controller.placement('cancel');host.focus({preventScroll:true});}},{signal:events.signal});
  const dismiss=()=>{controller.clearSelection();host.focus({preventScroll:true});};
  root.querySelector('[data-clear-selection]')?.addEventListener('click',dismiss,{signal:events.signal});
  selectionPanel?.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();dismiss();}},{signal:events.signal});
  host.addEventListener('camera-view-change',()=>cameraState(),{signal:events.signal});
  for(const button of root.querySelectorAll<HTMLButtonElement>('[data-camera-command]'))button.addEventListener('click',()=>controller.camera(button.dataset.cameraCommand as CameraCommand),{signal:events.signal});
  open.addEventListener('click', () => { void controller.open(); }, { signal: events.signal });
  retry.addEventListener('click', () => { void controller.open(); }, { signal: events.signal });
  close.addEventListener('click', () => { controller.close(); open.focus(); }, { signal: events.signal });
  reload.addEventListener('click', () => window.location.reload(), { signal: events.signal });
  // Close GPU resources on navigation while keeping entry controls usable in BFCache.
  window.addEventListener('pagehide', () => controller.close(), { signal: events.signal });

  return {
    setLocale(value: EntryLocale) { if (!disposed) { locale = value; render(state); } },
    setPaused(value: boolean) { if (!disposed) controller.setPaused(value); },
    close: () => { if (!disposed) controller.close(); },
    dispose() { if (disposed) return; disposed = true; controller.dispose();if(editDialog?.open)editDialog.close(); events.abort(); mounted.delete(root); },
    inspect: () => ({ state: controller.getState(), session: controller.inspectSession() }),
  };
}

export function mountPreviewPanel(root: HTMLElement, options: PreviewPanelOptions = {}) {
  mounted.get(root)?.dispose();
  const handle = createPanel(root, options);
  mounted.set(root, handle);
  return handle;
}
