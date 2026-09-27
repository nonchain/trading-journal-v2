import { useEffect, useState, type ReactNode } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { AccountsProvider } from '@/components/accounts/accounts-provider';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { registerAppFonts } from '@/lib/fonts';
import { initI18n, i18n } from '@/lib/i18n';
import { journalRepo } from '@/lib/storage';
import { applyTheme } from '@/lib/theme';

function ToastHost() {
  const { i18n: i18nInstance } = useTranslation();
  const rtl = i18nInstance.language === 'fa';
  return <Toaster rtl={rtl} />;
}

function ScopedLocale({ children }: { children: ReactNode }) {
  const { i18n: i18nInstance } = useTranslation();
  const locale = i18nInstance.language === 'en' ? 'en' : 'fa';
  return (
    <div lang={locale} dir={locale === 'fa' ? 'rtl' : 'ltr'}>
      {children}
    </div>
  );
}

export function AppProviders({
  children,
  compact,
  scoped,
}: {
  children: ReactNode;
  compact?: boolean;
  /** Rendering inside a host page: keep lang/dir on our own root, not `<html>`. */
  scoped?: boolean;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    registerAppFonts();
    let alive = true;
    (async () => {
      const settings = await journalRepo.getSettings();
      await initI18n(settings.locale, { scoped });
      applyTheme(settings.theme);
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [scoped]);

  if (!ready) {
    return (
      <div className={compact ? 'p-3 space-y-2' : 'p-6 space-y-3'}>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const content = (
    <AccountsProvider>
      {children}
      <ToastHost />
    </AccountsProvider>
  );

  return (
    <I18nextProvider i18n={i18n}>
      <TooltipProvider delayDuration={200}>
        {scoped ? <ScopedLocale>{content}</ScopedLocale> : content}
      </TooltipProvider>
    </I18nextProvider>
  );
}
