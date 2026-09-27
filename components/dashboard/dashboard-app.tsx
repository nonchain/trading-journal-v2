import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageMenu, ThemeMenu } from '@/components/dashboard/navbar-preferences';
import { OverviewPage } from '@/components/dashboard/overview-page';
import { SettingsPage } from '@/components/dashboard/settings-page';
import { StatisticsPage } from '@/components/dashboard/statistics-page';
import { TagsPage } from '@/components/dashboard/tags-page';
import { TradesPage } from '@/components/dashboard/trades-page';
import { NewTradeButton } from '@/components/trades/trade-form-dialog';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useJournal } from '@/hooks/use-journal';
import { cn } from '@/lib/utils';

type Section = 'overview' | 'trades' | 'statistics' | 'tags' | 'settings';

const navItems: Array<{ id: Section; icon: string; labelKey: string }> = [
  { id: 'overview', icon: 'dashboard-line', labelKey: 'nav.overview' },
  { id: 'trades', icon: 'book-open-line', labelKey: 'nav.trades' },
  { id: 'statistics', icon: 'bar-chart-2-line', labelKey: 'nav.statistics' },
  { id: 'tags', icon: 'price-tag-3-line', labelKey: 'nav.tags' },
  { id: 'settings', icon: 'settings-3-line', labelKey: 'nav.settings' },
];

function NavList({
  section,
  onSelect,
}: {
  section: Section;
  onSelect: (s: Section) => void;
}) {
  const { t } = useTranslation();
  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const active = section === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-primary/15 text-primary font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Icon name={item.icon} />
            {t(item.labelKey)}
          </button>
        );
      })}
    </nav>
  );
}

export function DashboardApp() {
  const { t } = useTranslation();
  const { trades, setups, emotions, stats, loading, refresh } = useJournal();
  const [section, setSection] = useState<Section>('overview');
  const [formOpen, setFormOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const title =
    section === 'overview'
      ? t('overview.title')
      : section === 'trades'
        ? t('trades.title')
        : section === 'statistics'
          ? t('stats.title')
          : section === 'tags'
            ? t('tags.title')
            : t('settings.title');

  return (
    <div className="flex min-h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <aside className="hidden w-60 shrink-0 border-e bg-card/60 p-4 backdrop-blur md:block">
        <div className="mb-6 px-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            TradingView
          </p>
          <h1 className="text-lg font-semibold tracking-tight">{t('app.name')}</h1>
        </div>
        <NavList
          section={section}
          onSelect={(s) => {
            setSection(s);
          }}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/80 px-4 py-3 backdrop-blur">
          <Sheet open={mobileNav} onOpenChange={setMobileNav}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Icon name="menu-line" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle>{t('app.name')}</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <NavList
                  section={section}
                  onSelect={(s) => {
                    setSection(s);
                    setMobileNav(false);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <div className="ms-auto flex items-center gap-1">
            <LanguageMenu />
            <ThemeMenu />
            <NewTradeButton
              className="ms-1"
              open={formOpen}
              onOpenChange={setFormOpen}
              setups={setups}
              emotions={emotions}
              onSaved={refresh}
            />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {section === 'overview' && (
            <OverviewPage
              stats={stats}
              loading={loading}
              onNewTrade={() => setFormOpen(true)}
            />
          )}
          {section === 'trades' && (
            <TradesPage
              trades={trades}
              setups={setups}
              emotions={emotions}
              onChanged={refresh}
            />
          )}
          {section === 'statistics' && (
            <StatisticsPage stats={stats} loading={loading} />
          )}
          {section === 'tags' && (
            <TagsPage
              setups={setups}
              emotions={emotions}
              onChanged={refresh}
            />
          )}
          {section === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}
