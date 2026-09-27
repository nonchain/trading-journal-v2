export const DASHBOARD_SECTIONS = [
  'overview',
  'trades',
  'statistics',
  'tags',
  'settings',
] as const;

export type DashboardSection = (typeof DASHBOARD_SECTIONS)[number];

export function sectionFromHash(hash: string): DashboardSection | null {
  const value = hash.replace(/^#/, '');
  return (DASHBOARD_SECTIONS as readonly string[]).includes(value)
    ? (value as DashboardSection)
    : null;
}

/** Opens the dashboard (options page) at a section, reusing an already open tab. */
export async function openDashboard(section?: DashboardSection): Promise<void> {
  const base = browser.runtime.getURL('/options.html');
  const url = section ? `${base}#${section}` : base;
  try {
    const tabs = await browser.tabs.query({});
    const existing = tabs.find((tab) => tab.url?.startsWith(base));
    if (existing?.id != null) {
      await browser.tabs.update(existing.id, section ? { url, active: true } : { active: true });
      if (existing.windowId != null) {
        await browser.windows.update(existing.windowId, { focused: true });
      }
    } else {
      await browser.tabs.create({ url });
    }
  } catch {
    await browser.runtime.openOptionsPage();
  }
}
