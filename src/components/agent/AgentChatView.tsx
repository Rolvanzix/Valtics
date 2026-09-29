import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Sliders,
  ArrowRight,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Info,
  Layers,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { useValticsAgent } from '../../context/AgentContext';
import { ValticsMark } from '../brand/ValticsLogo';
import { ValticsAgentAvatar } from '../brand/ValticsAgentAvatar';
import { CurveModelParams } from '../../types';
import { AgentActionRecommendation } from '../../types/agent';

interface AgentChatViewProps {
  onApplyCurveToCreation: (params: CurveModelParams) => void;
}

export const AgentChatView: React.FC<AgentChatViewProps> = ({ onApplyCurveToCreation }) => {
  const { messages, isLoading, error, sendMessage, clearConversation } = useValticsAgent();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const query = inputText.trim();
    setInputText('');
    sendMessage(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickPrompts = [
    'Scan all active Devnet markets and evaluate progress',
    'Recommend curve parameters for a tokenized T-bill',
    'Explain how Meteora Dynamic Bonding Curves work',
    'What are the anti-sniper protection parameters for launch?',
    'Compare Devnet USDC vs SOL as quote asset',
  ];

  return (
    <div className="flex flex-col h-[720px] rounded-xl border border-zinc-800 bg-[#090d14]/80 backdrop-blur-md overflow-hidden">
      {/* Top Bar with Clear & Status */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950/40 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-zinc-300 font-medium">Agent Interactive Session</span>
          <span className="text-zinc-600">·</span>
          <span className="text-[11px] text-zinc-500 font-mono">Model: Gemini 3.8 Flash (Devnet Core)</span>
        </div>

        <button
          type="button"
          onClick={clearConversation}
          title="Clear conversation history"
          className="flex items-center gap-1.5 px-2 py-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors cursor-pointer text-[11px] font-mono"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 max-w-4xl ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1 select-none ${
                  isUser
                    ? 'bg-zinc-700 text-zinc-200'
                    : 'bg-transparent'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <ValticsAgentAvatar size="sm" glow={false} />}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`flex-1 min-w-0 rounded-xl px-4 py-3.5 text-xs sm:text-[13px] leading-relaxed ${
                  isUser
                    ? 'bg-zinc-800 text-zinc-100 rounded-tr-xs border border-zinc-700/80'
                    : 'bg-[#0f141f] text-zinc-200 rounded-tl-xs border border-zinc-800 shadow-md'
                }`}
              >
                <div className="prose prose-invert prose-xs max-w-none space-y-2.5">
                  {renderFormattedContent(msg.content)}
                </div>

                {/* Structured Recommendation Action Card (if provided by agent) */}
                {msg.recommendation && msg.recommendation.curveParams && (
                  <div className="mt-4 pt-3 border-t border-zinc-800/80">
                    <CurveRecommendationCard
                      recommendation={msg.recommendation}
                      onApply={() => onApplyCurveToCreation(msg.recommendation!.curveParams!)}
                    />
                  </div>
                )}

                <div className="mt-2 text-[10px] text-zinc-500 font-mono text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 max-w-2xl mr-auto">
            <div className="w-7 h-7 flex items-center justify-center shrink-0 mt-1">
              <ValticsAgentAvatar size="sm" glow={true} />
            </div>
            <div className="rounded-xl px-4 py-3 bg-[#0f141f] border border-zinc-800 text-zinc-400 text-xs flex items-center gap-2.5">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span>Analyzing Devnet market data & synthesizing intelligence...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 border-t border-zinc-800/60 bg-zinc-950/20 overflow-x-auto flex items-center gap-1.5 scrollbar-none select-none">
        <span className="text-[10px] text-zinc-500 font-mono shrink-0 uppercase">Suggested:</span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => sendMessage(prompt)}
            disabled={isLoading}
            className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-[11px] font-sans border border-zinc-800 transition-colors cursor-pointer hover:border-zinc-700 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 sm:p-4 border-t border-zinc-800 bg-[#070a10]">
        {/* Error Recovery State */}
        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                if (lastUser) sendMessage(lastUser.content);
              }}
              className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-100 font-mono text-[11px] cursor-pointer transition-colors"
            >
              Retry Query
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask VALTICS Agent about Devnet markets, bonding curves, or market creation parameters..."
            className="w-full resize-none bg-zinc-900/60 border border-zinc-800 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden transition-all font-sans max-h-32"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            aria-label="Send message to VALTICS Agent"
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold shrink-0 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>

        <div className="mt-1.5 px-1 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <span>Non-Custodial Intelligence · Human Approval Required for All On-Chain Actions</span>
          <span className="hidden sm:inline">Press Enter ↵ to send</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Curve Recommendation Card inside agent message
 */
const CurveRecommendationCard: React.FC<{
  recommendation: AgentActionRecommendation;
  onApply: () => void;
}> = ({ recommendation, onApply }) => {
  const p = recommendation.curveParams;
  if (!p) return null;

  return (
    <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-emerald-200">{recommendation.title}</h4>
            <p className="text-[11px] text-emerald-400/80">{recommendation.summary}</p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono uppercase">
          {p.curveType} curve
        </span>
      </div>

      {/* Key Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-zinc-950/60 p-2.5 rounded border border-emerald-900/30">
        <div>
          <span className="text-zinc-500 block text-[9px] uppercase">Start Price</span>
          <span className="text-zinc-200 font-semibold">${p.startPriceUsd} {p.quoteAsset}</span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[9px] uppercase">Target Cap</span>
          <span className="text-zinc-200 font-semibold">${(p.migrationMarketCapUsd / 1_000_000).toFixed(1)}M</span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[9px] uppercase">Trading Fee</span>
          <span className="text-zinc-200 font-semibold">{p.feeBps} bps</span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[9px] uppercase">Anti-Sniper</span>
          <span className="text-zinc-200 font-semibold">{p.antiSniperSlots} slots</span>
        </div>
      </div>

      {/* Action CTA */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-zinc-400 font-mono">
          Ready for Meteora DBC deployment on Devnet
        </span>

        <button
          type="button"
          onClick={onApply}
          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <span>Export to Market Creator</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/**
 * Lightweight helper to format agent response text (supports code blocks, bullet points, headers, bold)
 */
function renderFormattedContent(text: string) {
  // Strip out JSON code blocks for cleaner text reading if it's recommendation json
  const cleanText = text.replace(/```json[\s\S]*?```/g, '').trim();

  const lines = cleanText.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  lines.forEach((line, idx) => {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${idx}`}
            className="bg-black/60 border border-zinc-800 rounded p-2.5 font-mono text-[11px] text-zinc-300 overflow-x-auto my-2"
          >
            {codeBuffer.join('\n')}
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // Markdown Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={idx} className="font-bold text-sm text-zinc-100 mt-2 mb-1">
          {line.replace('### ', '')}
        </h3>
      );
      return;
    }
    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={idx} className="font-semibold text-xs text-zinc-200 mt-2 mb-0.5">
          {line.replace('#### ', '')}
        </h4>
      );
      return;
    }

    // Bullet points
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        <div key={idx} className="flex items-start gap-2 pl-2">
          <span className="text-emerald-400 shrink-0 mt-1">•</span>
          <span className="text-zinc-300">{formatInlineMarkdown(line.trim().substring(2))}</span>
        </div>
      );
      return;
    }

    // Numbered lists
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={idx} className="flex items-start gap-2 pl-2">
          <span className="font-mono text-zinc-500 shrink-0">{numMatch[1]}.</span>
          <span className="text-zinc-300">{formatInlineMarkdown(numMatch[2])}</span>
        </div>
      );
      return;
    }

    // Paragraph
    if (line.trim()) {
      elements.push(
        <p key={idx} className="text-zinc-300">
          {formatInlineMarkdown(line)}
        </p>
      );
    }
  });

  return elements;
}

function formatInlineMarkdown(text: string): React.ReactNode {
  // Simple bold and code formatter
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono text-[11px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
