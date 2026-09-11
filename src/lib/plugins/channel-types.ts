/**
 * Channel type display names, mirrored from new-api
 * `web/src/features/channels/constants.ts` (CHANNEL_TYPES). Brand names are
 * locale-independent. Ids not in the table (future channel types) fall back
 * to `#<id>`.
 */
export const CHANNEL_TYPE_NAMES: Record<number, string> = {
  0: 'Unknown',
  1: 'OpenAI',
  2: 'MjProxy',
  3: 'Azure',
  4: 'Ollama',
  5: 'MjProxyPlus',
  7: 'OhMyGPT',
  8: 'Custom',
  14: 'Anthropic',
  15: 'Baidu',
  16: 'Zhipu',
  17: 'Ali',
  18: 'Xunfei',
  19: '360',
  20: 'OpenRouter',
  22: 'FastGPT',
  23: 'Tencent',
  24: 'Gemini',
  25: 'Moonshot',
  26: 'Zhipu V4',
  27: 'Perplexity',
  31: 'LingYiWanWu',
  33: 'AWS',
  34: 'Cohere',
  35: 'MiniMax',
  36: 'SunoAPI',
  37: 'Dify',
  38: 'Jina',
  39: 'Cloudflare',
  40: 'SiliconFlow',
  41: 'Vertex AI',
  42: 'Mistral',
  43: 'DeepSeek',
  44: 'MokaAI',
  45: 'VolcEngine',
  46: 'Baidu V2',
  47: 'Xinference',
  48: 'xAI',
  49: 'Coze',
  50: 'Kling',
  51: 'Jimeng',
  52: 'Vidu',
  53: 'Submodel',
  54: 'DoubaoVideo',
  55: 'Sora',
  56: 'Replicate',
  57: 'ChatGPT Subscription (Codex)',
  58: 'Advanced Custom',
  59: 'Sub2API',
  60: 'New API',
  61: 'Task Plugin',
};

export function channelTypeLabel(id: number): string {
  return CHANNEL_TYPE_NAMES[id] ?? `#${id}`;
}
