import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { QQGroupQuiz } from '@/components/qq-group-quiz';
import { APIPage } from '@/components/api-page';
import { BrandHero } from '@/components/brand-hero';
import { BusinessContact } from '@/components/business-contact';
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...(defaultMdxComponents as MDXComponents),
    img: (props) => <ImageZoom {...(props as any)} />,
    QQGroupQuiz,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    BrandHero: BrandHero as any,
    // BusinessContact fetches runtime docs config from the backend.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    BusinessContact: BusinessContact as any,
    // APIPage is an async server component, need type assertion to bypass MDX type check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    APIPage: APIPage as any,
    ...components,
  };
}
