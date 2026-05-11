import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { i18n } from '@/lib/i18n';
import type { LinkItemType } from 'fumadocs-ui/layouts/docs';
import {
  DEFAULT_DOCS_CONFIG,
  type DocsConfig,
  getLocalizedSiteName,
} from '@/lib/docs-config';

export function getLinkItems(
  config: DocsConfig = DEFAULT_DOCS_CONFIG
): LinkItemType[] {
  if (!config.githubUrl) return [];

  return [
    {
      type: 'icon',
      url: config.githubUrl,
      label: 'GitHub',
      text: 'GitHub',
      icon: (
        <svg
          role="img"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-5"
        >
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      ),
      external: true,
    },
    // {
    //   type: 'icon',
    //   url: 'https://atomgit.com/fyinfor/token-factory',
    //   label: 'AtomGit',
    //   text: 'AtomGit',
    //   icon: (
    //     <svg
    //       role="img"
    //       viewBox="0 0 24 24"
    //       fill="currentColor"
    //       className="size-5"
    //     >
    //       <path
    //         fillRule="evenodd"
    //         d="M15.5,5c.1,0,.3-.2.5-.3,0,.1,0,.2,0,.3,0,.1,0,.3,0,.4,0,1,.6,1.8,1.4,2,1.1.3,2.1-.2,2.7-1.1.7-1.1.4-2.4-.8-3.3C16.2.8,12.8.2,9.1,1.2,1.1,3.6-1.6,13.4,4,19.4c2.4,2.6,5.5,3.7,9,3.6,4.5-.1,7.7-2.3,9.7-6.2,1.5-2.7-.1-5.7-3.2-6.4-1.7-.3-3.5-.5-5.3-.3-.6,0-1.2.2-1.7.5-.6.3-.7.9-.7,1.5,0,.6.5.9,1,1,1,.2,2.1.3,3.1.3.3,0,.6,0,.9,0,.4,0,.9,0,1.3,0,1.2.2,1.6,1.2,1,2.3-.2.3-.3.5-.5.7-.8.9-1.9,1.5-3.1,1.8-2.2.5-4.3.6-6.5-.1-2.5-.8-3.9-2.6-4-5,0-1.5.4-3,1.1-4.3.3-.6.5-1.2.5-1.9,0-.3,0-.6,0-.9,0-.2,0-.3,0-.5.2,0,.5.1.7.2.9.4,1.9.5,2.9.3.6-.1,1.2-.2,1.8-.1,1,0,1.9-.2,2.7-.7.2-.1.4-.2.6-.4Z"
    //       />
    //     </svg>
    //   ),
    //   external: true,
    // },
  ];
}

export const linkItems = getLinkItems();

export function getLogo(config: DocsConfig = DEFAULT_DOCS_CONFIG) {
  return (
    <img
      alt={config.brandName}
      src={config.logoUrl}
      width={20}
      height={20}
      className="size-5"
    />
  );
}

export const logo = getLogo();

export function baseOptions(
  locale: string,
  config: DocsConfig = DEFAULT_DOCS_CONFIG
): BaseLayoutProps {
  return {
    i18n,
    nav: {
      title: (
        <>
          {getLogo(config)}
          <span className="font-medium in-[header]:text-[15px] [.uwu_&]:hidden">
            {getLocalizedSiteName(config, locale)}
          </span>
        </>
      ),
      url: config.homeUrl,
    },
  };
}
