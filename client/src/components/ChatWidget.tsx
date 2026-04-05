import { useState, useRef, useEffect, useCallback, ReactNode } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "Hi, I'm Medicare Guide, SelectQuote's AI assistant \u2014 not a human or licensed agent. I can help you compare Medicare Advantage plans and narrow down options based on what matters most to you.\n\nTo start, what's most important to you in a plan \u2014 keeping your doctors, lowering costs, better drug coverage, or extra benefits like dental, vision, or fitness?"
};

function renderMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Split by tokens: markdown links [text](url), bold **text**, bare paths /foo/bar
  const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\/[a-z][-a-z0-9/]*(?:\?[a-z0-9=&%_-]+)?)/gi;
  const parts = text.split(tokenRegex);

  parts.forEach((part, i) => {
    if (!part) return;

    // Markdown link: [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      nodes.push(
        <a
          key={i}
          href={linkMatch[2]}
          style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 500 }}
          target={linkMatch[2].startsWith('http') ? '_blank' : '_self'}
          rel="noopener noreferrer"
        >
          {linkMatch[1]}
        </a>
      );
      return;
    }

    // Bold: **text** — if inner text is a path, make it a link
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) {
      const inner = boldMatch[1];
      if (inner.startsWith('/')) {
        nodes.push(
          <a
            key={i}
            href={inner}
            style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 600 }}
          >
            {inner}
          </a>
        );
      } else {
        nodes.push(<strong key={i} style={{ fontWeight: 600 }}>{inner}</strong>);
      }
      return;
    }

    // Bare path: /plans?zip=66208, /part-d/formulary-search, etc.
    if (/^\/[a-z][-a-z0-9/]*(?:\?[a-z0-9=&%_-]+)?$/i.test(part)) {
      nodes.push(
        <a
          key={i}
          href={part}
          style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 500 }}
        >
          {part}
        </a>
      );
      return;
    }

    // Plain text
    nodes.push(<span key={i}>{part}</span>);
  });

  return nodes;
}

function parseActionTags(text: string): { cleanText: string; actions: any[] } {
  const actionRegex = /\[ACTION:(\{[^}]+\})\]/g;
  const actions: any[] = [];
  let match;
  while ((match = actionRegex.exec(text)) !== null) {
    try { actions.push(JSON.parse(match[1])); } catch {}
  }
  const cleanText = text.replace(actionRegex, '').trim();
  return { cleanText, actions };
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isLoading]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      // Only send messages AFTER the initial greeting to the API
      const apiMessages = updatedMessages.slice(1);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) throw new Error('Chat request failed');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';
      let currentEventType = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim();
            continue;
          }
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);

            if (currentEventType === 'error') {
              throw new Error(dataStr);
            }

            if (currentEventType === 'delta') {
              try {
                const data = JSON.parse(dataStr);
                if (data && typeof data === 'string') {
                  accumulated += data;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'assistant', content: accumulated };
                    return updated;
                  });
                }
              } catch { /* skip parse errors */ }
            }
            currentEventType = '';
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: "I'm sorry, I'm having trouble connecting right now. Please try again or call 1-800-555-0100 to speak with a licensed advisor."
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 50);
            // Process action tags from the last assistant message
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === 'assistant' && lastMsg.content) {
          const { cleanText, actions } = parseActionTags(lastMsg.content);
          if (actions.length > 0) {
            actions.forEach(action => {
              if (action.type === 'OPEN_DRUGS_DOCTORS_MODAL') {
                window.dispatchEvent(new CustomEvent('openDrugsDoctorsModal'));
              } else if (action.type === 'COLLECT_PHONE') {
                window.dispatchEvent(new CustomEvent('collectPhone'));
              } else if (action.type === 'COLLECT_NAME') {
                window.dispatchEvent(new CustomEvent('collectName'));
              }
            });
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: cleanText };
            return updated;
          }
        }
        return prev;
      });
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            zIndex: 9999,
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          aria-label="Open Medicare Guide chat"
        >
          💬
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '400px',
          height: '600px',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 9999,
          background: '#fff',
          border: '1px solid #e2e8f0',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1e40af, #2563eb)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}>
              🏥
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '16px' }}>
                Medicare Guide
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                by SelectQuote
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: '#f8fafc',
          }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user'
                      ? '18px 18px 4px 18px'
                      : '18px 18px 18px 4px',
                    background: msg.role === 'user' ? '#2563eb' : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#1e293b',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.content ? renderMarkdown(msg.content) : (
                    <span style={{ color: '#94a3b8' }}>Thinking...</span>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.content === '' && (
              <div style={{ textAlign: 'center', padding: '8px' }}>
                <div style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#2563eb',
                  animation: 'pulse 1s infinite',
                  marginRight: '4px',
                }} />
                <div style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#2563eb',
                  animation: 'pulse 1s infinite 0.2s',
                  marginRight: '4px',
                }} />
                <div style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#2563eb',
                  animation: 'pulse 1s infinite 0.4s',
                }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            style={{
              padding: '12px 16px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '8px',
              background: '#fff',
            }}
          >
 
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about Medicare plans..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '24px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                fontSize: '14px',
                background: '#f8fafc',
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: input.trim() ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#cbd5e1',
                color: '#fff',
                border: 'none',
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              ▲
            </button>
          </form>

          {/* Footer */}
          <div style={{
            padding: '8px 16px',
            textAlign: 'center',
            fontSize: '11px',
            color: '#94a3b8',
            background: '#fff',
            borderTop: '1px solid #f1f5f9',
          }}>
            AI assistant · Not a licensed agent · <a href="tel:1-800-555-0100" style={{ color: '#2563eb' }}>1-800-555-0100</a>
          </div>
        </div>
      )}
    </>
  );
}
