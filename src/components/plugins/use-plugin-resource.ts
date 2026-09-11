'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  pluginSiteFromHostname,
  type PluginSite,
} from '@/lib/plugins/public-site';

const subscribe = () => () => {};

export function usePluginSite(): PluginSite | null {
  return useSyncExternalStore(
    subscribe,
    () => pluginSiteFromHostname(window.location.hostname),
    () => null
  );
}

export function usePluginResource<T>(
  path: string | null,
  site: PluginSite | null
) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: T;
    error?: string;
  } | null>(null);
  const requestKey =
    path !== null && site ? `${site}:${path}:${attempt}` : null;

  useEffect(() => {
    if (path === null || !site || !requestKey) return;
    const controller = new AbortController();
    void fetch(`/api/plugins${path}?site=${site}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok || payload.success !== true) {
          setResult({
            key: requestKey,
            error:
              typeof payload.message === 'string'
                ? payload.message
                : '插件数据加载失败，请重试。',
          });
          return;
        }
        setResult({ key: requestKey, data: payload.data as T });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResult({
            key: requestKey,
            error: '插件数据加载失败，请重试。',
          });
      });
    return () => controller.abort();
  }, [path, site, requestKey]);

  // A changed plugin/version immediately hides the old result, even before effects run.
  const current = result?.key === requestKey ? result : null;
  return {
    data: current?.data,
    error: current?.error,
    loading: current === null,
    retry: () => setAttempt((value) => value + 1),
  };
}
