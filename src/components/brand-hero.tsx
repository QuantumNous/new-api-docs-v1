import { getDocsConfig, getLocalizedSiteName } from '@/lib/docs-config';

export async function BrandHero({ lang = 'en' }: { lang?: string }) {
  const config = await getDocsConfig();
  const siteName = getLocalizedSiteName(config, lang);

  return (
    <div className="my-8 text-center">
      <img
        src={config.logoUrl}
        alt={`${config.brandName} Logo`}
        className="mx-auto"
        width="120"
        height="120"
      />
      <h1 className="mt-4 mb-2 text-4xl font-bold">{siteName}</h1>
    </div>
  );
}
