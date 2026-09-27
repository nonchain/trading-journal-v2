import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { setLocale } from '@/lib/i18n';
import type { Locale } from '@/lib/schemas';
import { journalRepo } from '@/lib/storage';

export function useLocale() {
  const { i18n } = useTranslation();
  const locale: Locale = i18n.language === 'en' ? 'en' : 'fa';

  const changeLocale = useCallback(async (next: Locale) => {
    await setLocale(next);
    await journalRepo.updateSettings({ locale: next });
  }, []);

  return { locale, changeLocale };
}
