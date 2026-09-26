import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDayKey, now } from '@/lib/date';
import { setLocale } from '@/lib/i18n';
import type { Locale, ThemeMode } from '@/lib/schemas';
import { journalRepo } from '@/lib/storage';
import { useTheme } from '@/lib/theme';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [locale, setLocaleState] = useState<Locale>(
    (i18n.language as Locale) || 'en',
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [clearOpen, setClearOpen] = useState(false);

  useEffect(() => {
    journalRepo.getSettings().then((s) => setLocaleState(s.locale));
  }, []);

  async function changeLocale(next: Locale) {
    setLocaleState(next);
    await journalRepo.updateSettings({ locale: next });
    await setLocale(next);
  }

  async function exportData() {
    try {
      const data = await journalRepo.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tv-journal-${formatDayKey(now())}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('settings.exportSuccess'));
    } catch {
      toast.error(t('toast.error'));
    }
  }

  async function importData(file: File) {
    try {
      const text = await file.text();
      await journalRepo.importAll(JSON.parse(text));
      const settings = await journalRepo.getSettings();
      await setLocale(settings.locale);
      setLocaleState(settings.locale);
      await setTheme(settings.theme);
      toast.success(t('settings.importSuccess'));
    } catch {
      toast.error(t('settings.importError'));
    }
  }

  async function clearAll() {
    try {
      await journalRepo.clearAll();
      setClearOpen(false);
      toast.success(t('settings.clearSuccess'));
    } catch {
      toast.error(t('toast.error'));
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.language')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={locale}
            onValueChange={(v) => changeLocale(v as Locale)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="fa">فارسی</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.theme')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={theme}
            onValueChange={(v) => setTheme(v as ThemeMode)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t('settings.themeLight')}</SelectItem>
              <SelectItem value="dark">{t('settings.themeDark')}</SelectItem>
              <SelectItem value="system">{t('settings.themeSystem')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportData}>
            {t('settings.export')}
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            {t('settings.import')}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importData(file);
              e.target.value = '';
            }}
          />

          <Dialog open={clearOpen} onOpenChange={setClearOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">{t('settings.clear')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('settings.clearConfirmTitle')}</DialogTitle>
                <DialogDescription>
                  {t('settings.clearConfirmDescription')}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setClearOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button variant="destructive" onClick={clearAll}>
                  {t('common.confirm')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
