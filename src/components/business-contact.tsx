import { getDocsConfig, getLocalizedBusinessWorkTime } from '@/lib/docs-config';
import { Callout } from 'fumadocs-ui/components/callout';

const labels: Record<
  string,
  {
    phoneTitle: string;
    wechatTitle: string;
    wechatAlt: string;
  }
> = {
  zh: {
    phoneTitle: '联系电话',
    wechatTitle: '企业微信（扫码联系）',
    wechatAlt: '企业微信二维码',
  },
  en: {
    phoneTitle: 'Business Cooperation Phone',
    wechatTitle: 'WeChat Work (Scan to Contact)',
    wechatAlt: 'WeChat Work QR Code',
  },
  ja: {
    phoneTitle: 'ビジネス提携用電話番号',
    wechatTitle: '企業WeChat（QRコードをスキャンして連絡）',
    wechatAlt: '企業WeChat QRコード',
  },
};

export async function BusinessContact({ lang = 'en' }: { lang?: string }) {
  const config = await getDocsConfig();
  const t = labels[lang] || labels.en;
  const phone = config.business.phone.trim();
  const phoneHref =
    config.business.phoneHref.trim() || phone.replace(/\s+/g, '');
  const workTime = getLocalizedBusinessWorkTime(config, lang).trim();
  const wechatQrUrl = config.business.wechatQrUrl.trim();

  return (
    <>
      {(phone || workTime) && (
        <Callout type="info" title={t.phoneTitle}>
          {phone && <a href={`tel:${phoneHref}`}>{phone}</a>}
          {phone && workTime && <br />}
          {workTime}
        </Callout>
      )}

      {wechatQrUrl && (
        <Callout type="info" title={t.wechatTitle}>
          <img src={wechatQrUrl} alt={t.wechatAlt} width="240" />
        </Callout>
      )}
    </>
  );
}
