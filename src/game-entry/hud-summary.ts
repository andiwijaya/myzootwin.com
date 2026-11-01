export type HudTab = 'missions' | 'care' | 'visitors' | 'build';
export const HUD_TABS: readonly HudTab[] = ['missions', 'care', 'visitors', 'build'];
export const isHudTab = (value: unknown): value is HudTab => HUD_TABS.includes(value as HudTab);
export function nextHudTab(current: HudTab, key: string): HudTab | null {
    const i = HUD_TABS.indexOf(current);
    if (key === 'Home')
        return HUD_TABS[0];
    if (key === 'End')
        return HUD_TABS.at(-1)!;
    if (key === 'ArrowRight' || key === 'ArrowDown')
        return HUD_TABS[(i + 1) % HUD_TABS.length];
    if (key === 'ArrowLeft' || key === 'ArrowUp')
        return HUD_TABS[(i + HUD_TABS.length - 1) % HUD_TABS.length];
    return null;
}
export function welfareSummary(placed: number, birds: readonly {
    welfare: number;
}[]): number | null {
    if (placed === 0 || birds.length === 0)
        return null;
    return Math.round(birds.reduce((sum, b) => sum + b.welfare, 0) / birds.length);
}
export function coinSummary(value: number, locale: 'en' | 'id') {
    return new Intl.NumberFormat(locale, { notation: value >= 1000000 ? 'compact' : 'standard', maximumFractionDigits: value >= 1000000 ? 1 : 0 }).format(value) + ' ZC';
}
