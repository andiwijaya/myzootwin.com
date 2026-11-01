import {mountGameEntry} from '../game-entry/game-entry';
const root=document.querySelector<HTMLElement>('[data-play-entry]');if(root&&root.dataset.enhanced!=='true')mountGameEntry(root);
