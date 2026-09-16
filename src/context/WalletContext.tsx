/**
 * VALTICS Secure Wallet Context & Adapter Integration
 * 
 * Complies with strict institutional security standards:
 * - Zero Secret Storage: Seed phrases, private keys, and wallet secrets are NEVER requested,
 *   stored, or persisted in localStorage, sessionStorage, or external databases.
 * - Standard Solana Wallet Adapter protocol support (Phantom, Solflare, Standard Wallet).
 * - Deliberate signing: No automatic transaction signing upon connection or background actions.
 * - Address validation: Validates all public keys from wallet providers before trusting them.
 * - Error Sanitization: Internal RPC and system error information is sanitized.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PublicKey, Transaction, VersionedTransaction, Keypair } from '@solana/web3.js';
import { useNetwork } from './NetworkContext';
import { fetchSolBalance } from '../services/solana';
import { isValidSolanaAddress, sanitizeErrorMessage } from '../utils/security';

export interface WalletProviderInfo {
  name: string;
  icon: string;
  installed: boolean;
  adapterKey: 'phantom' | 'solflare' | 'standard' | 'sandbox';
  description: string;
}

interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  publicKeyStr: string | null;
  balanceSol: number | null;
  walletName: string | null;
  error: string | null;
  availableWallets: WalletProviderInfo[];
  connect: (walletType?: 'phantom' | 'solflare' | 'standard' | 'sandbox') => Promise<boolean>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  requestDevnetAirdrop: () => Promise<boolean>;
  signTransaction: (tx: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface SolanaProvider {
  isPhantom?: boolean;
  isSolflare?: boolean;
  publicKey?: { toBase58(): string; toBuffer(): Uint8Array };
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toBase58(): string } }>;
  disconnect: () => Promise<void>;
  signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>;
  signAllTransactions?: <T extends Transaction | VersionedTransaction>(txs: T[]) => Promise<T[]>;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    solana?: SolanaProvider;
    phantom?: { solana?: SolanaProvider };
    solflare?: SolanaProvider;
  }
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connection } = useNetwork();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [balanceSol, setBalanceSol] = useState<number | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<SolanaProvider | null>(null);
  
  // Ephemeral In-Memory Keypair for Devnet sandboxed preview only (NEVER persisted to disk or storage)
  const [sandboxKeypair, setSandboxKeypair] = useState<Keypair | null>(null);

  // Security enforcement on mount: Purge any legacy key material from browser storage
  useEffect(() => {
    try {
      localStorage.removeItem('valtics_devnet_sandbox_kp');
      sessionStorage.removeItem('valtics_devnet_sandbox_kp');
    } catch {
      // Storage access may be restricted in sandboxed iframes
    }
  }, []);

  const getProvider = useCallback((preferred?: 'phantom' | 'solflare' | 'standard' | 'sandbox'): { provider: SolanaProvider | null; name: string } => {
    if (typeof window === 'undefined') return { provider: null, name: '' };

    if (preferred === 'solflare' && window.solflare) {
      return { provider: window.solflare, name: 'Solflare' };
    }
    if (preferred === 'phantom' && (window.phantom?.solana || window.solana?.isPhantom)) {
      return { provider: window.phantom?.solana || window.solana!, name: 'Phantom' };
    }

    if (window.phantom?.solana) return { provider: window.phantom.solana, name: 'Phantom' };
    if (window.solflare) return { provider: window.solflare, name: 'Solflare' };
    if (window.solana) return { provider: window.solana, name: window.solana.isPhantom ? 'Phantom' : 'Solana Wallet' };

    return { provider: null, name: '' };
  }, []);

  const availableWallets: WalletProviderInfo[] = React.useMemo(() => {
    if (typeof window === 'undefined') return [];
    return [
      {
        name: 'Phantom',
        icon: '🟣',
        installed: !!(window.phantom?.solana || window.solana?.isPhantom),
        adapterKey: 'phantom',
        description: 'Popular Solana self-custodial browser extension',
      },
      {
        name: 'Solflare',
        icon: '🟠',
        installed: !!window.solflare,
        adapterKey: 'solflare',
        description: 'Institutional-grade Solana web & hardware wallet',
      },
      {
        name: 'Standard Wallet Adapter',
        icon: '⚡',
        installed: !!window.solana,
        adapterKey: 'standard',
        description: 'Generic window.solana standard provider',
      },
      {
        name: 'Devnet In-Memory Session (Ephemeral)',
        icon: '🧪',
        installed: true,
        adapterKey: 'sandbox',
        description: 'Volatile RAM-only testing session for sandboxed previews. Zero key storage.',
      },
    ];
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!publicKey || !connection) {
      setBalanceSol(null);
      return;
    }
    try {
      const bal = await fetchSolBalance(connection, publicKey.toBase58());
      setBalanceSol(bal);
    } catch {
      // Non-fatal balance refresh
    }
  }, [publicKey, connection]);

  useEffect(() => {
    if (connected && publicKey) {
      refreshBalance();
      const interval = setInterval(refreshBalance, 15000);
      return () => clearInterval(interval);
    }
  }, [connected, publicKey, refreshBalance]);

  // Eager connect ONLY if previously authorized/trusted (never prompts unsolicited popup)
  useEffect(() => {
    const { provider, name } = getProvider();
    if (provider && provider.connect) {
      provider
        .connect({ onlyIfTrusted: true })
        .then((res) => {
          if (res?.publicKey) {
            const pubStr = res.publicKey.toBase58();
            if (isValidSolanaAddress(pubStr)) {
              setPublicKey(new PublicKey(pubStr));
              setConnected(true);
              setWalletName(name);
              setActiveProvider(provider);
            }
          }
        })
        .catch(() => {
          // Silent fallback - user has not explicitly connected in this session
        });
    }
  }, [getProvider]);

  const connect = async (walletType?: 'phantom' | 'solflare' | 'standard' | 'sandbox'): Promise<boolean> => {
    setError(null);
    setConnecting(true);
    try {
      if (walletType === 'sandbox') {
        // Ephemeral in-memory keypair generated strictly in volatile memory
        // NEVER stored in localStorage, sessionStorage, cookies, or logs
        const kp = Keypair.generate();
        setSandboxKeypair(kp);
        setPublicKey(kp.publicKey);
        setConnected(true);
        setWalletName('Devnet Ephemeral Session (RAM Only)');
        setActiveProvider(null);
        return true;
      }

      const { provider, name } = getProvider(walletType);
      if (!provider) {
        throw new Error(
          'No compatible Solana wallet extension detected. Please install Phantom or Solflare browser extension, or use Devnet Ephemeral Session.'
        );
      }

      // Explicit user approval required
      const response = await provider.connect();
      if (!response || !response.publicKey) {
        throw new Error('Wallet connection was cancelled or rejected.');
      }

      const pubStr = response.publicKey.toBase58();
      // Security invariant: Validate the returned address
      if (!isValidSolanaAddress(pubStr)) {
        throw new Error('Wallet adapter returned an invalid public key format.');
      }

      const pub = new PublicKey(pubStr);
      setPublicKey(pub);
      setConnected(true);
      setWalletName(name);
      setActiveProvider(provider);
      setSandboxKeypair(null);

      // Listen for account change / disconnect if supported
      if (provider.on) {
        provider.on('disconnect', () => {
          disconnect();
        });
        provider.on('accountChanged', (newPubkey: { toBase58(): string } | null) => {
          if (newPubkey && isValidSolanaAddress(newPubkey.toBase58())) {
            setPublicKey(new PublicKey(newPubkey.toBase58()));
          } else {
            disconnect();
          }
        });
      }

      return true;
    } catch (err: unknown) {
      const sanitized = sanitizeErrorMessage(err);
      setError(sanitized);
      return false;
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      if (activeProvider && activeProvider.disconnect) {
        await activeProvider.disconnect();
      }
    } catch {
      // Ignore disconnect errors
    } finally {
      setConnected(false);
      setPublicKey(null);
      setBalanceSol(null);
      setWalletName(null);
      setActiveProvider(null);
      setSandboxKeypair(null);
      setError(null);
    }
  };

  const requestDevnetAirdrop = async (): Promise<boolean> => {
    if (!publicKey || !connection) return false;
    try {
      const sig = await connection.requestAirdrop(publicKey, 1_000_000_000); // 1 SOL
      await connection.confirmTransaction(sig, 'confirmed');
      await refreshBalance();
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Secure Transaction Signing
   * Invariant: Never signs automatically or in the background.
   * Requires connected wallet and active user instruction.
   */
  const signTransaction = async (tx: Transaction | VersionedTransaction) => {
    if (sandboxKeypair) {
      if ('partialSign' in tx) {
        (tx as Transaction).partialSign(sandboxKeypair);
        return tx;
      }
      throw new Error('VersionedTransaction signing is not supported in ephemeral sandbox.');
    }

    if (!activeProvider) {
      throw new Error('Wallet is not connected. Please connect your wallet first.');
    }

    return await activeProvider.signTransaction(tx);
  };

  return (
    <WalletContext.Provider
      value={{
        connected,
        connecting,
        publicKey,
        publicKeyStr: publicKey ? publicKey.toBase58() : null,
        balanceSol,
        walletName,
        error,
        availableWallets,
        connect,
        disconnect,
        refreshBalance,
        requestDevnetAirdrop,
        signTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
