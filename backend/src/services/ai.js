/**
 * DeepSeek AI 服务封装
 * DeepSeek API 兼容 OpenAI 格式
 */

const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
const API_KEY = process.env.DEEPSEEK_API_KEY;
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

async function chatCompletion(messages, options = {}) {
  const { temperature = 0.7, maxTokens = 2048, retries = 4, timeoutMs = 120000 } = options;
  let activeMaxTokens = maxTokens;
  let tokenFallbackTried = false;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature,
          max_tokens: activeMaxTokens,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const err = await res.text();
        if (res.status === 400 && !tokenFallbackTried && activeMaxTokens > 8192 && /token|max_tokens|maximum|context/i.test(err)) {
          tokenFallbackTried = true;
          activeMaxTokens = 8192;
          console.warn('[AI] max_tokens rejected, retrying with 8192...');
          continue;
        }
        // 429 或 5xx 也可以重试
        if ((res.status === 429 || res.status >= 500) && attempt < retries) {
          const delay = Math.min(2000 * Math.pow(2, attempt), 15000);
          console.warn(`[AI] Attempt ${attempt + 1} got HTTP ${res.status}, retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw new Error(`DeepSeek API error ${res.status}: ${err}`);
      }

      const data = await res.json();
      return data.choices[0].message.content;
    } catch (err) {
      const isRetryable = err.name === 'AbortError'
        || err.message?.includes('fetch failed')
        || err.message?.includes('ECONNRESET')
        || err.message?.includes('ECONNREFUSED')
        || err.message?.includes('ETIMEDOUT')
        || err.message?.includes('ENOTFOUND')
        || err.message?.includes('socket hang up')
        || err.message?.includes('network')
        || err.message?.includes('TLS');

      if (isRetryable && attempt < retries) {
        const delay = Math.min(3000 * Math.pow(2, attempt), 20000);
        console.warn(`[AI] Attempt ${attempt + 1} failed (${err.message}), retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}

/**
 * 流式调用，返回 Response
 */
async function chatCompletionStream(messages, options = {}) {
  const { temperature = 0.7, maxTokens = 2048 } = options;

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${err}`);
  }

  return res;
}

module.exports = { chatCompletion, chatCompletionStream };
