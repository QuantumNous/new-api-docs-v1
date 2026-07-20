'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export type AgentGuideStep = {
  title: string;
  description: string;
  image: string;
};

type AgentStepGuideProps = {
  app: string;
  steps: AgentGuideStep[];
};

export function AgentStepGuide({ app, steps }: AgentStepGuideProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="not-prose my-8 grid gap-5">
      {steps.map((step, index) => (
        <section
          key={step.title}
          className={`border-fd-border bg-fd-card grid overflow-hidden rounded-2xl border shadow-sm transition-all duration-700 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none lg:grid-cols-[minmax(0,0.8fr)_minmax(28rem,1.2fr)] ${
            visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: `${index * 120}ms` }}
        >
          <div className="flex gap-4 p-6 lg:items-center">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-violet-500 text-sm font-bold tracking-wider text-white shadow-lg shadow-pink-500/20">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="text-fd-foreground m-0 text-lg font-semibold">
                {step.title}
              </h3>
              <p className="text-fd-muted-foreground mt-2 mb-0 text-sm leading-6">
                {step.description}
              </p>
            </div>
          </div>
          <div className="border-fd-border relative min-h-56 overflow-hidden border-t bg-slate-100 lg:border-t-0 lg:border-l dark:bg-slate-950">
            <Image
              src={step.image}
              alt={`${app} 第 ${index + 1} 步配置截图`}
              width={1200}
              height={620}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.015] motion-reduce:transform-none"
            />
          </div>
        </section>
      ))}
    </div>
  );
}
