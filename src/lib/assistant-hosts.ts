/**
 * The hosts a visit has to come from before we call it a visit from an AI assistant.
 *
 * This list is deliberately strict, and strictness is the product. An owner compares our number
 * with their analytics; a number inflated by ordinary search traffic destroys the comparison and
 * the trust behind it. So a host earns a place here only when a referral from it means a person
 * read an assistant's answer and clicked through.
 *
 * Deliberately NOT here, though an earlier version of the WordPress plugin had them:
 *   ya.ru            ordinary Yandex search. Alice lives at alice.yandex.ru.
 *   duckduckgo.com   ordinary DuckDuckGo search. Its assistant lives at duck.ai.
 *   openai.com       the company's marketing site, not the assistant.
 *   x.ai             the company's site. The assistant is grok.com.
 */
export const ASSISTANT_HOSTS: Readonly<Record<string, string>> = {
  'chatgpt.com': 'ChatGPT',
  'chat.openai.com': 'ChatGPT',
  'perplexity.ai': 'Perplexity',
  'www.perplexity.ai': 'Perplexity',
  'claude.ai': 'Claude',
  'copilot.microsoft.com': 'Copilot',
  'copilot.com': 'Copilot',
  'm365.cloud.microsoft': 'Copilot',
  'gemini.google.com': 'Gemini',
  'aistudio.google.com': 'Google AI Studio',
  'notebooklm.google.com': 'NotebookLM',
  'grok.com': 'Grok',
  'duck.ai': 'DuckDuckGo AI',
  'you.com': 'You.com',
  'chat.qwen.ai': 'Qwen',
  'chat.deepseek.com': 'DeepSeek',
  'doubao.com': 'Doubao',
  'alice.yandex.ru': 'Alice',
  'chat.mistral.ai': 'Le Chat',
  'meta.ai': 'Meta AI',
  'phind.com': 'Phind',
};

/** Every host we accept, for the script that runs on the owner's pages. */
export const ASSISTANT_HOST_LIST: readonly string[] = Object.keys(ASSISTANT_HOSTS);

/**
 * The display name for a referring host, or null when it is not an assistant.
 * A leading "www." is ignored except where the list names it explicitly.
 */
export function assistantName(host: string): string | null {
  const h = String(host || '')
    .trim()
    .toLowerCase()
    .replace(/\.$/, '');
  if (!h) return null;
  if (ASSISTANT_HOSTS[h]) return ASSISTANT_HOSTS[h];
  const bare = h.replace(/^www\./, '');
  return ASSISTANT_HOSTS[bare] ?? null;
}
