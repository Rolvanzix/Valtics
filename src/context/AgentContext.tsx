import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AgentChatMessage, AgentMarketSummary, AgentActionRecommendation, AgentWorkspaceMode } from '../types/agent';
import { sendAgentQuery, fetchAgentMarketScan } from '../services/agentService';
import { useWallet } from './WalletContext';
import { getCreatedMarkets } from '../services/marketStorage';
import { CurveModelParams } from '../types';
import { scanAndRedactCredentials } from '../services/agentSecurityGuard';

interface AgentContextType {
  messages: AgentChatMessage[];
  isLoading: boolean;
  error: string | null;
  activeView: AgentWorkspaceMode;
  marketSummary: AgentMarketSummary | null;
  summaryLoading: boolean;
  setActiveView: (view: AgentWorkspaceMode) => void;
  sendMessage: (text: string) => Promise<void>;
  clearConversation: () => void;
  refreshMarketScan: () => Promise<void>;
  activeRecommendation: AgentActionRecommendation | null;
  applyRecommendation: (rec: AgentActionRecommendation, onApply: (params: CurveModelParams) => void) => void;
}

const STORAGE_KEY = 'valtics_agent_conversation_history_v1';

const INITIAL_WELCOME_MESSAGE: AgentChatMessage = {
  id: 'msg-welcome-0',
  role: 'assistant',
  content: `### Welcome to VALTICS Agent
I am the native intelligence layer for **VALTICS** on **Solana Devnet**.

My capabilities include:
- **Market Scanning**: Scan active Devnet pools, track bonding curve progression, and analyze liquidity depth.
- **Deep Research**: Inquire about Meteora Dynamic Bonding Curves, pricing mechanics, and tokenized real-world assets.
- **Curve Architecture**: Receive tailored curve parameter models (initial price, graduation quote target, fee bps, and anti-sniper limits) designed for your specific asset class.
- **Institutional Guidance**: Explore Devnet faucet mechanics, SPL token programs, and liquidity migration to Meteora DAMM.

*Note: All analyses and curve models are strictly non-custodial and run on Solana Devnet. You retain full transaction approval authority via your connected wallet.*`,
  timestamp: Date.now(),
};

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connected, publicKeyStr, balanceSol } = useWallet();
  const [messages, setMessages] = useState<AgentChatMessage[]>(() => {
    if (typeof window === 'undefined') return [INITIAL_WELCOME_MESSAGE];
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [INITIAL_WELCOME_MESSAGE];
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<AgentWorkspaceMode>('landing');
  const [marketSummary, setMarketSummary] = useState<AgentMarketSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [activeRecommendation, setActiveRecommendation] = useState<AgentActionRecommendation | null>(null);

  // Persist messages in sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (e) {
        console.warn('Could not save agent conversation history:', e);
      }
    }
  }, [messages]);

  // Refresh market scan
  const refreshMarketScan = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const clientMarkets = getCreatedMarkets();
      const summary = await fetchAgentMarketScan(clientMarkets);
      setMarketSummary(summary);
    } catch (err: any) {
      console.warn('Market scan error:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Initial scan load
  useEffect(() => {
    refreshMarketScan();
  }, [refreshMarketScan]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      // CLIENT-SIDE PRE-FLIGHT INTERCEPTION: Prevent sensitive credentials from transmitting
      const credScan = scanAndRedactCredentials(text.trim());
      if (credScan.hasSensitiveData) {
        const neutralizedUserMsg: AgentChatMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: `[🔒 Sensitive Private Key/Seed Phrase Neutralized & Redacted Locally]`,
          timestamp: Date.now(),
        };

        const warningMsg: AgentChatMessage = {
          id: `agent-security-${Date.now()}`,
          role: 'assistant',
          content: `### ⚠️ Client Security Safeguard: Non-Custodial Protocol Protection

VALTICS Agent intercepted a string matching a **private key or mnemonic seed phrase** directly in your browser.

#### Actions Taken:
- **Transmission Blocked**: This secret was **NOT transmitted** across the network or sent to the server.
- **Zero-Storage Principle**: The credential was immediately destroyed in memory.

#### Non-Custodial Security Policy:
- VALTICS operates strictly non-custodially: the Agent **NEVER** asks for, needs, or accepts private keys or seed phrases.
- All transactions are securely signed through your Solana Devnet browser wallet (Phantom/Solflare) after your explicit inspection.`,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, neutralizedUserMsg, warningMsg]);
        return;
      }

      const userMsg: AgentChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: Date.now(),
      };

      const updatedHistory = [...messages, userMsg];
      setMessages(updatedHistory);
      setIsLoading(true);
      setError(null);

      try {
        const clientMarkets = getCreatedMarkets();
        const payloadHistory = updatedHistory
          .filter((m) => m.role !== 'system')
          .slice(-10)
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));

        const response = await sendAgentQuery({
          messages: payloadHistory,
          walletContext: {
            connected,
            publicKey: publicKeyStr,
            balanceSol,
          },
          clientKnownMarkets: clientMarkets,
        });

        const agentMsg: AgentChatMessage = {
          id: `agent-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          timestamp: Date.now(),
          recommendation: response.recommendation,
        };

        if (response.recommendation) {
          setActiveRecommendation(response.recommendation);
        }

        setMessages((prev) => [...prev, agentMsg]);
      } catch (err: any) {
        const errMsg: AgentChatMessage = {
          id: `agent-err-${Date.now()}`,
          role: 'assistant',
          content: `An error occurred while consulting the intelligence layer: ${err.message || 'Network error'}. Please try again.`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errMsg]);
        setError(err.message || 'Request failed');
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, connected, publicKeyStr, balanceSol]
  );

  const clearConversation = useCallback(() => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setActiveRecommendation(null);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }, []);

  const applyRecommendation = useCallback(
    (rec: AgentActionRecommendation, onApply: (params: CurveModelParams) => void) => {
      if (rec.curveParams) {
        onApply(rec.curveParams);
      }
    },
    []
  );

  return (
    <AgentContext.Provider
      value={{
        messages,
        isLoading,
        error,
        activeView,
        marketSummary,
        summaryLoading,
        setActiveView,
        sendMessage,
        clearConversation,
        refreshMarketScan,
        activeRecommendation,
        applyRecommendation,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

export const useValticsAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useValticsAgent must be used within an AgentProvider');
  }
  return context;
};
