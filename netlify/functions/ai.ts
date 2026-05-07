import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: 'Method not allowed' };

  type AiBody = {
    provider: 'openai' | 'anthropic';
    model?: string;
    system?: string;
    messages: { role: string; content: string }[];
  };

  const { provider, model, system, messages } = JSON.parse(event.body ?? '{}') as AiBody;

  if (provider === 'anthropic') {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not set in Netlify environment variables.' }) };
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model ?? 'claude-opus-4-7', max_tokens: 1024, system: system ?? 'You are a helpful assistant.', messages }),
    });
    return { statusCode: res.status, headers: { ...cors, 'Content-Type': 'application/json' }, body: await res.text() };
  }

  if (provider === 'openai') {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'OPENAI_API_KEY not set in Netlify environment variables.' }) };
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model ?? 'gpt-4o-mini', messages: [{ role: 'system', content: system ?? 'You are a helpful assistant.' }, ...messages] }),
    });
    return { statusCode: res.status, headers: { ...cors, 'Content-Type': 'application/json' }, body: await res.text() };
  }

  return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Unknown provider' }) };
};
