import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { QQGroupQuiz } from '@/components/qq-group-quiz';
import { APIPage } from '@/components/api-page';
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { AgentStepGuide } from '@/components/agent-step-guide';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...(defaultMdxComponents as MDXComponents),
    img: (props) => <ImageZoom {...(props as any)} />,
    QQGroupQuiz,
    AgentStepGuide,
    // APIPage is an async server component, need type assertion to bypass MDX type check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    APIPage: APIPage as any,
    ...components,
  };
}
