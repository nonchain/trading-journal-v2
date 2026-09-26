import { useEffect, useState, type ReactNode } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { initI18n, i18n } from '@/lib/i18n';
import { journalRepo } from '@/lib/storage';
import { applyTheme } from '@/lib/theme';

function ToastHost() {
  const { i18n: i18nInstance } = useTranslation();
  const rtl = i18nInstance.language === 'fa';
  return <Toaster rtl={rtl} />;
}

export function AppProviders({
  children,
  compact,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const settings = await journalRepo.getSettings();
      await initI18n(settings.locale);
      applyTheme(settings.theme);
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className={compact ? 'p-3 space-y-2' : 'p-6 space-y-3'}>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <TooltipProvider delayDuration={200}>
        {children}
        <ToastHost />
      </TooltipProvider>
    </I18nextProvider>
  );
}
