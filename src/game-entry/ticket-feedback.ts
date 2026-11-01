import type {TicketView} from '../game/economy/tickets.ts';
import {entryMessages,type EntryLocale} from './locale.ts';
export function renderTickets(root:HTMLElement,v:TicketView,locale:EntryLocale):void{
 const c=entryMessages[locale],balance=root.querySelector<HTMLElement>('[data-ticket-balance]'),status=root.querySelector('[data-ticket-status]'),last=root.querySelector('[data-ticket-last]'),note=root.querySelector('[data-ticket-note]');
 const text=c.ticketBalance.replace('{balance}',String(v.balance)).replace('{n}',String(v.admissions)).replace('{revenue}',String(v.revenue));
 if(balance){balance.dataset.coins=String(v.balance);balance.dataset.admissions=String(v.admissions);balance.dataset.revenue=String(v.revenue);if(balance.textContent!==text)balance.textContent=text;}
 const statusText=c[({closed:'ticketClosed',habitat:'ticketHabitat',animals:'ticketAnimals',capacity:'ticketCapacity',balance:'ticketLimit',ready:'ticketReady'}as const)[v.reason]].replace('{price}',String(v.price));if(status&&status.textContent!==statusText)status.textContent=statusText;
 const lastText=v.last?c.ticketLast.replace('{name}',c.visitorsName.replace('{id}',v.last.visitorId.replace('arrival-',''))).replace('{amount}',String(v.last.amount)):c.ticketNone;if(last&&last.textContent!==lastText)last.textContent=lastText;
 if(note&&note.textContent!==c.ticketSession)note.textContent=c.ticketSession;
}
