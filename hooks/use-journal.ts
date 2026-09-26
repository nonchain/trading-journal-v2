import { useCallback, useEffect, useState } from 'react';
import { journalRepo } from '@/lib/storage';
import type { EmotionTag, JournalStats, Setup, Trade } from '@/lib/types';

export function useJournal() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [setups, setSetups] = useState<Setup[]>([]);
  const [emotions, setEmotions] = useState<EmotionTag[]>([]);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [t, s, e, st] = await Promise.all([
      journalRepo.getAll(),
      journalRepo.getSetups(),
      journalRepo.getEmotionTags(),
      journalRepo.getStats(),
    ]);
    setTrades(t);
    setSetups(s);
    setEmotions(e);
    setStats(st);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const unwatch = journalRepo.watchTrades(() => {
      refresh();
    });
    const onMessage = (msg: { type?: string }) => {
      if (msg?.type === 'TRADES_CHANGED') refresh();
    };
    browser.runtime.onMessage.addListener(onMessage);
    return () => {
      unwatch();
      browser.runtime.onMessage.removeListener(onMessage);
    };
  }, [refresh]);

  return { trades, setups, emotions, stats, loading, refresh };
}
