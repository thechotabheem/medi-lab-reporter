import { useState, useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export type DataSource = 'live' | 'cache' | 'offline';

export function useDataFreshness(queryKey?: string) {
  const { isOnline } = useNetworkStatus();
  const [dataSource, setDataSource] = useState<DataSource>(
    navigator.onLine ? 'live' : 'offline'
  );
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!isOnline) {
      setDataSource('offline');
      return;
    }

    // Check recent performance entries for Supabase API calls
    const checkFreshness = () => {
      try {
        const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const supabaseEntries = entries.filter(
          (e) => e.name.includes('supabase') && e.name.includes('rest')
        );

        if (supabaseEntries.length === 0) {
          setDataSource('live');
          return;
        }

        const latest = supabaseEntries[supabaseEntries.length - 1];
        // transferSize === 0 typically indicates service worker cache
        if (latest.transferSize === 0 && latest.decodedBodySize > 0) {
          setDataSource('cache');
        } else {
          setDataSource('live');
        }
        setLastFetchedAt(new Date());
      } catch {
        setDataSource('live');
      }
    };

    // Small delay to let fetch complete
    const timer = setTimeout(checkFreshness, 500);
    return () => clearTimeout(timer);
  }, [isOnline, queryKey]);

  return { dataSource, lastFetchedAt };
}
