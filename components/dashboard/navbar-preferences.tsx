import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { useLocale } from '@/hooks/use-locale';
import type { Locale, ThemeMode } from '@/lib/schemas';
import { useTheme } from '@/lib/theme';

const languages: Array<{ value: Locale; label: string }> = [
  { value: 'fa', label: 'فارسی' },
  { value: 'en', label: 'English' },
];

const themes: Array<{ value: ThemeMode; icon: string; labelKey: string }> = [
  { value: 'light', icon: 'sun-line', labelKey: 'settings.themeLight' },
  { value: 'dark', icon: 'moon-line', labelKey: 'settings.themeDark' },
  { value: 'system', icon: 'computer-line', labelKey: 'settings.themeSystem' },
];

export function LanguageMenu() {
  const { t } = useTranslation();
  const { locale, changeLocale } = useLocale();

  return (
    <DropdownMenu dir={locale === 'fa' ? 'rtl' : 'ltr'}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t('settings.language')}>
          <Icon name="ri-global-line" />
          <span className="uppercase">{locale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('settings.language')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(v) => changeLocale(v as Locale)}
        >
          {languages.map((lang) => (
            <DropdownMenuRadioItem key={lang.value} value={lang.value}>
              {lang.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ThemeMenu() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { theme, setTheme } = useTheme();
  const currentIcon =
    themes.find((item) => item.value === theme)?.icon ?? 'moon-line';

  return (
    <DropdownMenu dir={locale === 'fa' ? 'rtl' : 'ltr'}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('settings.theme')}>
          <Icon name={currentIcon} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('settings.theme')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(v) => setTheme(v as ThemeMode)}
        >
          {themes.map((item) => (
            <DropdownMenuRadioItem key={item.value} value={item.value}>
              <Icon name={item.icon} />
              {t(item.labelKey)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
