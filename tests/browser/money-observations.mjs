export const baseBalance=s=>s.economyGrants-s.economySpent+s.economyRefunds;
export const moneyConserved=s=>Number.isSafeInteger(s.currency)&&s.currency>=0&&s.currency===baseBalance(s)+s.ticketRevenue;
