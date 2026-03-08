// Algorithmic context compression — no LLM needed, nearly free

interface Message {
  role: string;
  content: string;
}

interface CompressResult {
  compressed: Message[];
  original_tokens: number;
  compressed_tokens: number;
  savings_percent: number;
  method: 'fast' | 'deep';
}

// Estimate tokens (~4 chars per token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function estimateMessagesTokens(messages: Message[]): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content) + 4, 0);
}

// Fast compression: algorithmic deduplication + trimming
export function compressFast(messages: Message[]): CompressResult {
  const originalTokens = estimateMessagesTokens(messages);
  const compressed: Message[] = [];

  // Keep system messages as-is
  const systemMsgs = messages.filter(m => m.role === 'system');
  const nonSystem = messages.filter(m => m.role !== 'system');

  // Deduplicate: remove messages with >80% content overlap
  const seen = new Set<string>();
  const deduped: Message[] = [];
  for (const msg of nonSystem) {
    const normalized = msg.content.toLowerCase().replace(/\s+/g, ' ').trim();
    const fingerprint = normalized.slice(0, 200);
    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      deduped.push(msg);
    }
  }

  // Trim verbose content: collapse whitespace, remove filler phrases
  const FILLER = [
    /\b(certainly|absolutely|of course|sure thing|happy to help|I'd be glad to|let me)\b/gi,
    /\b(as (I |we )?(mentioned|noted|discussed) (earlier|above|before|previously))\b/gi,
    /\b(in (this|the) (case|context|scenario|situation))\b/gi,
    /\b(it('s| is) (important|worth|crucial) (to )?(note|mention|remember) that)\b/gi,
    /\b(please (note|keep in mind|be aware) that)\b/gi,
    /\b(as you (can see|know|may know|might know))\b/gi,
  ];

  for (const msg of deduped) {
    let content = msg.content;
    // Remove filler phrases
    for (const pattern of FILLER) {
      content = content.replace(pattern, '');
    }
    // Collapse multiple spaces/newlines
    content = content.replace(/\n{3,}/g, '\n\n').replace(/ {2,}/g, ' ').trim();

    if (content.length > 0) {
      compressed.push({ role: msg.role, content });
    }
  }

  // For long conversations (>20 msgs), summarize early messages more aggressively
  const result = [...systemMsgs];
  if (compressed.length > 20) {
    // Keep first 3 and last 15 messages, truncate middle
    const early = compressed.slice(0, 3).map(m => ({
      role: m.role,
      content: m.content.length > 500 ? m.content.slice(0, 500) + '...' : m.content,
    }));
    const recent = compressed.slice(-15);
    result.push(...early, { role: 'system', content: `[${compressed.length - 18} earlier messages condensed]` }, ...recent);
  } else {
    result.push(...compressed);
  }

  const compressedTokens = estimateMessagesTokens(result);

  return {
    compressed: result,
    original_tokens: originalTokens,
    compressed_tokens: compressedTokens,
    savings_percent: originalTokens > 0
      ? parseFloat(((1 - compressedTokens / originalTokens) * 100).toFixed(1))
      : 0,
    method: 'fast',
  };
}

// Smart truncation: identify load-bearing messages
export function truncateSmart(messages: Message[], targetTokens?: number): CompressResult {
  const originalTokens = estimateMessagesTokens(messages);
  const target = targetTokens || Math.floor(originalTokens * 0.5);

  // Score each message by importance
  const scored = messages.map((msg, i) => {
    let importance = 0;

    // System messages are always important
    if (msg.role === 'system') importance += 100;

    // Recent messages are more important
    importance += (i / messages.length) * 30;

    // Messages with code/data are more important
    if (msg.content.includes('```') || msg.content.includes('{')) importance += 20;

    // Messages with decisions/actions
    if (/\b(decided|created|implemented|fixed|changed|updated|error|bug|issue)\b/i.test(msg.content)) importance += 15;

    // Questions from user are important
    if (msg.role === 'user' && msg.content.includes('?')) importance += 10;

    // Short messages are cheap to keep
    if (msg.content.length < 100) importance += 5;

    // Penalize very long messages
    if (msg.content.length > 2000) importance -= 10;

    return { msg, importance, tokens: estimateTokens(msg.content) + 4 };
  });

  // Sort by importance (highest first), take messages until we hit target
  const sorted = [...scored].sort((a, b) => b.importance - a.importance);
  const kept = new Set<number>();
  let tokenBudget = target;

  for (const item of sorted) {
    const idx = scored.indexOf(item);
    if (tokenBudget >= item.tokens) {
      kept.add(idx);
      tokenBudget -= item.tokens;
    }
  }

  // Reconstruct in original order
  const result: Message[] = [];
  let skippedCount = 0;
  for (let i = 0; i < messages.length; i++) {
    if (kept.has(i)) {
      if (skippedCount > 0) {
        result.push({ role: 'system', content: `[${skippedCount} message(s) truncated]` });
        skippedCount = 0;
      }
      result.push(messages[i]);
    } else {
      skippedCount++;
    }
  }
  if (skippedCount > 0) {
    result.push({ role: 'system', content: `[${skippedCount} message(s) truncated]` });
  }

  const compressedTokens = estimateMessagesTokens(result);

  return {
    compressed: result,
    original_tokens: originalTokens,
    compressed_tokens: compressedTokens,
    savings_percent: originalTokens > 0
      ? parseFloat(((1 - compressedTokens / originalTokens) * 100).toFixed(1))
      : 0,
    method: 'deep',
  };
}
