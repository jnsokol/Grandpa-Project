import { useEffect, useRef, useState } from 'react';
import { useTileStore } from '../../lib/store/tile-store';
import type { AiTile } from '../../lib/store/tiles';

type Message = { role: 'user' | 'assistant'; content: string };
type Props = { tile: AiTile };

const PROXY_URL = import.meta.env.VITE_RSS_PROXY_URL ?? '';

const MODELS: Record<'openai' | 'anthropic', string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
  anthropic: ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
};

async function chat(provider: 'openai' | 'anthropic', model: string, system: string, messages: Message[]): Promise<string> {
  if (!PROXY_URL) throw new Error('VITE_RSS_PROXY_URL is not set — deploy the Cloudflare Worker first.');
  const res = await fetch(`${PROXY_URL}/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, model, system, messages }),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error ?? `Error ${res.status}`);
  }
  if (provider === 'anthropic') {
    const data = await res.json() as { content: { type: string; text: string }[] };
    return data.content.find((c) => c.type === 'text')?.text ?? '';
  }
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? '';
}

export function AiChatTile({ tile }: Props) {
  const updateTile = useTileStore((s) => s.updateTile);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(false);
  const [draftProvider, setDraftProvider] = useState<'openai' | 'anthropic'>(tile.provider);
  const [draftModel, setDraftModel] = useState(tile.model ?? '');
  const [draftSystem, setDraftSystem] = useState(tile.systemPrompt ?? '');
  const bottomRef = useRef<HTMLDivElement>(null);

  const model = tile.model || (tile.provider === 'openai' ? 'gpt-4o-mini' : 'claude-opus-4-7');
  const system = tile.systemPrompt || 'You are a helpful assistant.';
  const isOpenAI = tile.provider === 'openai';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function saveSettings() {
    updateTile({ ...tile, provider: draftProvider, model: draftModel || undefined, systemPrompt: draftSystem || undefined });
    setSettings(false);
  }

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    setInput('');
    setError('');
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);
    try {
      const reply = await chat(tile.provider, model, system, next);
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  const gradient = isOpenAI
    ? 'from-teal-600 via-teal-700 to-cyan-800'
    : 'from-indigo-600 via-indigo-700 to-purple-800';
  const label = isOpenAI ? 'GPT' : 'Claude';

  // ── Settings panel ─────────────────────────────────────────────────────────
  if (settings) {
    return (
      <div className={`flex flex-col h-full bg-gradient-to-br ${gradient} rounded-xl p-4 text-white gap-3 overflow-auto`}>
        <p className="text-base font-bold shrink-0">🤖 AI Chat — settings</p>

        <div className="flex flex-col gap-1 shrink-0">
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">Provider</span>
          <div className="flex gap-2">
            {(['openai', 'anthropic'] as const).map((p) => (
              <button key={p} onClick={() => { setDraftProvider(p); setDraftModel(''); }}
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${draftProvider === p ? 'bg-white/30' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
                {p === 'openai' ? 'OpenAI (GPT)' : 'Anthropic (Claude)'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">Model</span>
          <select value={draftModel} onChange={(e) => setDraftModel(e.target.value)}
            className="bg-white/15 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white outline-none">
            <option value="" className="text-slate-800">Default</option>
            {MODELS[draftProvider].map((m) => <option key={m} value={m} className="text-slate-800">{m}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">System prompt</span>
          <textarea value={draftSystem} onChange={(e) => setDraftSystem(e.target.value)} rows={3}
            placeholder="You are a helpful assistant."
            className="bg-white/15 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 outline-none resize-none" />
        </div>

        {!PROXY_URL && (
          <p className="text-xs text-yellow-300 shrink-0">
            ⚠ Deploy the Cloudflare Worker and set VITE_RSS_PROXY_URL to enable AI.
          </p>
        )}

        <div className="flex gap-2 mt-auto shrink-0">
          <button onClick={saveSettings}
            className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold text-white transition-colors">
            Save
          </button>
          <button onClick={() => setSettings(false)}
            className="px-4 py-2 text-white/50 hover:text-white text-sm transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Chat screen ────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col h-full bg-gradient-to-br ${gradient} rounded-xl overflow-hidden text-white`}>
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <div>
          <p className="text-base font-bold">🤖 {label}</p>
          <p className="text-white/50 text-xs">{model}</p>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} className="text-white/40 hover:text-white text-xs transition-colors">Clear</button>
          )}
          <button onClick={() => setSettings(true)} className="text-white/40 hover:text-white text-lg leading-none transition-colors" aria-label="Settings">⚙</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-3 pb-2 min-h-0 flex flex-col gap-2">
        {messages.length === 0 && (
          <p className="text-white/30 text-sm text-center mt-8">Send a message to start chatting</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed ${
              msg.role === 'user' ? 'bg-white/25' : 'bg-black/25 text-white/90'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-black/25 rounded-2xl px-3 py-2 text-sm text-white/50 animate-pulse">Thinking…</div>
          </div>
        )}
        {error && <p className="text-red-300 text-xs text-center px-2">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 pb-3 shrink-0 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Message… (Enter to send)"
          rows={1}
          disabled={loading}
          className="flex-1 bg-white/15 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/40 resize-none disabled:opacity-50"
          style={{ minHeight: '2.25rem', maxHeight: '5rem' }}
        />
        <button onClick={send} disabled={loading || !input.trim()}
          className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white font-bold text-base disabled:opacity-40 transition-colors shrink-0"
          aria-label="Send">↑</button>
      </div>
    </div>
  );
}
