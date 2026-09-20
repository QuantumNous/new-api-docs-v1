'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { cn } from '@/lib/cn';

const GrainGradient = dynamic(
  () => import('@paper-design/shaders-react').then((m) => m.GrainGradient),
  { ssr: false }
);

type ShaderProfile = {
  delayMs: number;
  idleTimeoutMs: number;
  softness: number;
  intensity: number;
  noise: number;
  reduceMotion: boolean;
};

const DEFAULT_SHADER_PROFILE: ShaderProfile = {
  delayMs: 500,
  idleTimeoutMs: 1200,
  softness: 1,
  intensity: 0.85,
  noise: 0.45,
  reduceMotion: false,
};

function detectShaderProfile(): ShaderProfile {
  if (typeof window === 'undefined') {
    // Must be consistent between SSR and the client's first render.
    return DEFAULT_SHADER_PROFILE;
  }

  const reduceMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

  const navAny = navigator as unknown as {
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };

  const memory =
    typeof navAny.deviceMemory === 'number' ? navAny.deviceMemory : 8;
  const cores =
    typeof navAny.hardwareConcurrency === 'number'
      ? navAny.hardwareConcurrency
      : 8;
  const isSmallScreen =
    window.matchMedia?.('(max-width: 1023px)')?.matches ?? false;

  // Always render shaders, but adapt quality to reduce jank on low-end / small screens.
  const lowEnd = memory <= 4 || cores <= 4;

  if (reduceMotion) {
    return {
      delayMs: 350,
      idleTimeoutMs: 1200,
      softness: 1,
      intensity: 0.55,
      noise: 0.22,
      reduceMotion: true,
    };
  }

  if (lowEnd || isSmallScreen) {
    return {
      delayMs: 550,
      idleTimeoutMs: 1600,
      softness: 1,
      intensity: 0.7,
      noise: 0.28,
      reduceMotion: false,
    };
  }

  return {
    delayMs: 250,
    idleTimeoutMs: 1000,
    softness: 1,
    intensity: 0.9,
    noise: 0.5,
    reduceMotion: false,
  };
}

export function Hero({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [showShaders, setShowShaders] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [logoReady, setLogoReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Avoid hydration mismatch: the first client render must match SSR output.
  const [profile, setProfile] = useState<ShaderProfile>(DEFAULT_SHADER_PROFILE);

  const shaderColors = useMemo(
    () =>
      resolvedTheme === 'dark'
        ? ['#06B6D4', '#8B5CF6', '#EC4899', '#1E3A8A00']
        : ['#22D3EE', '#A78BFA', '#F9A8D4', '#DBEAFE20'],
    [resolvedTheme]
  );

  useEffect(() => {
    setMounted(true);
    setProfile(detectShaderProfile());
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;
    let idleId: number | undefined;
    const start = () => {
      if (!cancelled) setShowShaders(true);
    };

    const win = window as unknown as {
      requestIdleCallback?: (
        cb: () => void,
        options?: { timeout?: number }
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    // Always keep the effect, but start it after first paint/idle to minimize jank.
    const t = window.setTimeout(() => {
      if (cancelled) return;
      if (typeof win.requestIdleCallback === 'function') {
        idleId = win.requestIdleCallback(start, {
          timeout: profile.idleTimeoutMs,
        });
        return;
      }
      start();
    }, profile.delayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      if (typeof idleId === 'number') {
        win.cancelIdleCallback?.(idleId);
      }
    };
  }, [mounted, profile.delayMs, profile.idleTimeoutMs]);

  return (
    <>
      {/* CSS theme variants keep the first render consistent during hydration. */}
      <div
        aria-hidden
        className="absolute inset-0 dark:hidden"
        style={{
          background:
            'radial-gradient(1200px 800px at 20% 15%, rgba(34,211,238,.25), transparent 60%), radial-gradient(1000px 700px at 70% 25%, rgba(167,139,250,.22), transparent 55%), radial-gradient(900px 700px at 55% 70%, rgba(249,168,212,.18), transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 hidden dark:block"
        style={{
          background:
            'radial-gradient(1200px 800px at 20% 15%, rgba(6,182,212,.28), transparent 60%), radial-gradient(1000px 700px at 70% 25%, rgba(139,92,246,.24), transparent 55%), radial-gradient(900px 700px at 55% 70%, rgba(236,72,153,.18), transparent 60%)',
        }}
      />

      {showShaders && (
        <GrainGradient
          className={cn(
            'absolute inset-0 duration-800',
            profile.reduceMotion ? 'animate-none' : 'animate-fd-fade-in'
          )}
          colors={shaderColors}
          colorBack="#00000000"
          softness={profile.softness}
          intensity={profile.intensity}
          noise={profile.noise}
          shape="corners"
        />
      )}

      <div className="relative z-2 flex w-full flex-col">
        <div className="grid items-center gap-8 px-4 pt-12 md:px-12 md:pt-24 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
          <div className="flex min-w-0 flex-col max-md:items-center max-md:text-center">
            {children}
          </div>
          <div className="hidden size-72 lg:block">
            {mounted && (
              <Image
                src="/assets/newapi.png"
                alt="logo"
                width={288}
                height={288}
                className={cn(
                  'size-72 drop-shadow-2xl',
                  logoReady
                    ? 'animate-in fade-in zoom-in-95 duration-700'
                    : 'invisible'
                )}
                onLoad={() => setLogoReady(true)}
                priority
              />
            )}
          </div>
        </div>

        <div className="relative mt-12 min-h-[240px] flex-1">
          {mounted && (
            <Image
              src={
                resolvedTheme === 'dark'
                  ? '/assets/dashboard-dark.png'
                  : '/assets/dashboard-light.png'
              }
              alt="dashboard-preview"
              width={1200}
              height={800}
              className={cn(
                'absolute top-0 left-[20%] max-w-[1200px] rounded-xl border-2',
                imageReady ? 'animate-in fade-in duration-400' : 'invisible'
              )}
              onLoad={() => setImageReady(true)}
              loading="lazy"
              fetchPriority="low"
              sizes="(min-width: 1024px) 1200px, 100vw"
            />
          )}
        </div>
      </div>
    </>
  );
}
