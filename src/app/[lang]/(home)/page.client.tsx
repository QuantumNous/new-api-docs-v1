'use client';

import { useEffect, useState } from 'react';
import { GrainGradient, Dithering } from '@paper-design/shaders-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { cn } from '@/lib/cn';

export function Hero() {
  const { resolvedTheme } = useTheme();
  const [showShaders, setShowShaders] = useState(false);
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    // Apply some delay, otherwise on slower devices, it errors with uniform images not being fully loaded.
    setTimeout(() => {
      setShowShaders(true);
    }, 400);
  }, []);

  return (
    <>
      {showShaders && (
        <GrainGradient
          className="animate-fd-fade-in absolute inset-0 duration-800"
          colors={
            resolvedTheme === 'dark'
              ? ['#06B6D4', '#8B5CF6', '#EC4899', '#1E3A8A00']
              : ['#22D3EE', '#A78BFA', '#F9A8D4', '#DBEAFE20']
          }
          colorBack="#00000000"
          softness={1}
          intensity={0.9}
          noise={0.5}
          shape="corners"
        />
      )}
      {showShaders && (
        <Dithering
          width={720}
          height={720}
          colorBack="#00000000"
          colorFront={resolvedTheme === 'dark' ? '#8B5CF6' : '#A78BFA'}
          shape="sphere"
          type="4x4"
          scale={0.5}
          size={3}
          speed={0.5}
          rotation={270}
          className="animate-fd-fade-in absolute duration-400 max-lg:bottom-[-50%] max-lg:left-[-200px] lg:top-[-5%] lg:right-0"
        />
      )}
      {showShaders && (
        <Dithering
          width={620}
          height={620}
          colorBack="#00000000"
          colorFront={resolvedTheme === 'dark' ? '#EC4899' : '#F9A8D4'}
          shape="sphere"
          type="4x4"
          scale={0.45}
          size={2.5}
          speed={0.6}
          rotation={90}
          className="animate-fd-fade-in absolute duration-600 max-lg:bottom-[-45%] max-lg:left-[-160px] lg:top-[0%] lg:right-[5%]"
        />
      )}
      {showShaders && (
        <Dithering
          width={550}
          height={550}
          colorBack="#00000000"
          colorFront={resolvedTheme === 'dark' ? '#06B6D4' : '#22D3EE'}
          shape="sphere"
          type="4x4"
          scale={0.4}
          size={2}
          speed={0.7}
          rotation={180}
          className="animate-fd-fade-in absolute duration-1000 max-lg:bottom-[-40%] max-lg:left-[-120px] lg:top-[5%] lg:right-[10%]"
        />
      )}
      {resolvedTheme && (
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
            'absolute top-[460px] left-[20%] max-w-[1200px] rounded-xl border-2',
            'lg:top-[400px]',
            imageReady ? 'animate-in fade-in duration-400' : 'invisible'
          )}
          onLoad={() => setImageReady(true)}
          priority
        />
      )}
    </>
  );
}
