import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OverviewPage } from '@/components/dashboard/overview-page';
import { SettingsPage } from '@/components/dashboard/settings-page';
import { StatisticsPage } from '@/components/dashboard/statistics-page';
import { TagsPage } from '@/components/dashboard/tags-page';
import { TradesPage } from '@/components/dashboard/trades-page';
import { TradeForm } from '@/components/trades/trade-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from '@/components/ui/toaster';
import { useJournal } from '@/hooks/use-journal';
import { journalRepo } from '@/lib/storage';
import { cn } from '@/lib/utils';
import type { TradeFormValues } from '@/lib/types';

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

  async function handleCreate(values: TradeFormValues) {
    try {
      await journalRepo.create(values);
      toast.success(t('toast.created'));
      setFormOpen(false);
      refresh();
    } catch {
      toast.error(t('toast.error'));
    }
  }

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
          <div className="ms-auto">
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Icon name="add-line" />
              {t('trades.newTrade')}
            </Button>
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('trades.newTrade')}</DialogTitle>
          </DialogHeader>
          <TradeForm
            setups={setups}
            emotions={emotions}
            onCancel={() => setFormOpen(false)}
            onSubmit={handleCreate}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
