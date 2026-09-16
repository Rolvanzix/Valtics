import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Check, 
  Lock, 
  Server, 
  Layers, 
  Coins, 
  Key,
  Flame,
  ArrowRight
} from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import { 
  CurveStudioConfigInput, 
  PreparedPoolDeployment, 
  prepareMeteoraPoolTransaction, 
  simulateMeteoraTransaction, 
  executeAndConfirmPoolTransaction,
  validateCurveStudioInput,
  createPoolStateFromDeployment
} from '../../services/meteoraCreation';
import { useNetwork } from '../../context/NetworkContext';
import { useWallet } from '../../context/WalletContext';
import { saveCreatedMarket } from '../../services/marketStorage';
import { getExplorerUrl } from '../../config/constants';
import { AddressBadge } from '../common/AddressBadge';
import { formatCurrency, formatNumber } from '../../utils/format';
import { NavigationTab } from '../layout/Header';
import { sanitizeErrorMessage } from '../../utils/security';
import { auditTransactionSafety } from '../../utils/txSafety';

interface Step6CreateProps {
  input: CurveStudioConfigInput;
  onBack: () => void;
  onSelectTab: (tab: NavigationTab) => void;
  onSelectMarketDetail?: (poolId: string) => void;
  onOpenWalletModal?: () => void;
}

type DeploymentState = 
  | 'idle'
  | 'preparing'
  | 'ready_to_confirm'
  | 'signing'
  | 'broadcasting'
  | 'confirming'
  | 'success'
  | 'error';

export const Step6Create: React.FC<Step6CreateProps> = ({
  input,
  onBack,
  onSelectTab,
  onSelectMarketDetail,
  onOpenWalletModal,
}) => {
  const { network, connection } = useNetwork();
  const { connected, publicKey, publicKeyStr, balanceSol, signTransaction, connect } = useWallet();

  const [deploymentState, setDeploymentState] = useState<DeploymentState>('idle');
  const [prepared, setPrepared] = useState<PreparedPoolDeployment | null>(null);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [simulationLogs, setSimulationLogs] = useState<string[] | null>(null);
  const [confirmedCheck, setConfirmedCheck] = useState(false);

  const [deploymentResult, setDeploymentResult] = useState<{
    txSignature: string;
    poolAddress: string;
    configAddress: string;
    baseVault: string;
    quoteVault: string;
    timestamp: number;
    network: string;
  } | null>(null);

  const [txError, setTxError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Automatically prepare transaction when entering Step 6 if wallet is connected
  useEffect(() => {
    let isMounted = true;

    async function prepare() {
      if (!connected || !publicKey) {
        return;
      }

      setDeploymentState('preparing');
      setPrepError(null);

      // Validate inputs
      const validation = validateCurveStudioInput(input);
      if (!validation.valid) {
        setPrepError(validation.errors.join('; '));
        setDeploymentState('error');
        return;
      }

      try {
        const prepResult = await prepareMeteoraPoolTransaction(connection, publicKey, input);
        if (!isMounted) return;

        // Perform simulation
        const sim = await simulateMeteoraTransaction(connection, prepResult.transaction);
        if (!isMounted) return;

        if (sim.logs) {
          setSimulationLogs(sim.logs);
        }

        setPrepared(prepResult);
        setDeploymentState('ready_to_confirm');
      } catch (err: any) {
        if (!isMounted) return;
        setPrepError(err?.message || 'Failed to prepare Meteora DBC pool transaction.');
        setDeploymentState('error');
      }
    }

    prepare();

    return () => {
      isMounted = false;
    };
  }, [connected, publicKey, input, connection]);

  // Execution handler: Explicit user confirmation required
  const handleExecute = async () => {
    if (!prepared || !signTransaction) {
      setTxError('Deployment transaction not prepared or wallet signer unavailable.');
      setDeploymentState('error');
      return;
    }

    if (!confirmedCheck) {
      setTxError('Please explicitly check the confirmation box before signing.');
      return;
    }

    setTxError(null);
    setDeploymentState('signing');

    try {
      // Step A: Signing & Broadcasting
      const res = await executeAndConfirmPoolTransaction({
        connection,
        prepared,
        signTransaction,
        input,
        network,
        onStatusChange: (status) => {
          if (status === 'broadcasting') setDeploymentState('broadcasting');
          if (status === 'confirming') setDeploymentState('confirming');
        },
      });

      if (!res || !res.signature) {
        throw new Error('Transaction execution failed on-chain.');
      }

      // Step B: Persist to storage
      const poolState = createPoolStateFromDeployment(res, input, network);
      saveCreatedMarket(poolState);

      setDeploymentResult({
        txSignature: res.signature,
        poolAddress: res.poolAddress,
        configAddress: res.configAddress,
        baseVault: res.baseVaultAddress,
        quoteVault: res.quoteVaultAddress,
        timestamp: Date.now(),
        network,
      });

      setDeploymentState('success');
    } catch (err: any) {
      setTxError(sanitizeErrorMessage(err?.message || 'Transaction submission failed on Solana cluster.'));
      setDeploymentState('error');
    }
  };

  const handleRetry = async () => {
    setTxError(null);
    if (publicKey) {
      setDeploymentState('preparing');
      try {
        const prepResult = await prepareMeteoraPoolTransaction(connection, publicKey, input);
        setPrepared(prepResult);
        setDeploymentState('ready_to_confirm');
      } catch (err: any) {
        setTxError(sanitizeErrorMessage(err?.message || 'Retry preparation failed.'));
        setDeploymentState('error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="border-b border-zinc-800/80 pb-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Step 6 — On-Chain Creation & Deployment</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Execute the official Meteora Dynamic Bonding Curve smart contract instructions on Solana.
        </p>
      </div>

      {/* Wallet Not Connected State */}
      {!connected && (
        <div className="bg-[#0c101a] border border-zinc-800 rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Key className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-white">Wallet Connection Required</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              An institutional or self-custody Solana wallet must be connected to sign the pool initialization and fund the rent exemption on {network}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onOpenWalletModal) {
                onOpenWalletModal();
              } else {
                connect();
              }
            }}
            className="py-2.5 px-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs shadow-amber-500/20"
          >
            <span>Connect Wallet to Deploy</span>
          </button>
        </div>
      )}

      {/* Preparing State */}
      {connected && deploymentState === 'preparing' && (
        <div className="bg-[#0c101a] border border-zinc-800 rounded-xl p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Preparing Meteora DBC Transaction</h3>
            <p className="text-xs text-zinc-400">
              Deriving PDAs, compiling FeeScheduler parameters, and simulating instruction payload...
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Screen Before Signing */}
      {connected && deploymentState === 'ready_to_confirm' && prepared && (
        <div className="space-y-5">
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-200">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 block text-sm">
                Explicit On-Chain Deployment Confirmation
              </span>
              <p className="text-[11px] text-amber-200/80 leading-relaxed mt-0.5">
                Carefully review the derived program-derived addresses and parameter payload. Once signed and confirmed on Solana {network}, the bonding curve will be live for trading.
              </p>
            </div>
          </div>

          {/* Derived Account Details */}
          <div className="bg-[#0c101a] border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <span className="text-sm font-bold text-white">Derived Program Addresses</span>
              <span className="text-xs font-mono text-zinc-400">Solana {network}</span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-sans text-zinc-400">Pool PDA (Meteora DBC)</span>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-semibold">{prepared.poolAddress}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(prepared.poolAddress, 'pool')}
                    className="text-zinc-400 hover:text-white"
                  >
                    {copiedKey === 'pool' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-sans text-zinc-400">Config Account</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-200">{prepared.configAddress}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(prepared.configAddress, 'config')}
                    className="text-zinc-400 hover:text-white"
                  >
                    {copiedKey === 'config' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-sans text-xs">
                <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                  <span className="text-zinc-400 text-[10px] uppercase block">Base Asset Vault</span>
                  <span className="font-mono text-zinc-200 text-[11px] truncate block">
                    {prepared.baseVault}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                  <span className="text-zinc-400 text-[10px] uppercase block">Quote Asset Vault</span>
                  <span className="font-mono text-zinc-200 text-[11px] truncate block">
                    {prepared.quoteVault}
                  </span>
                </div>
              </div>
            </div>

            {/* Parameter Verification Checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono-nums">
              <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-[10px] font-sans text-zinc-400 uppercase block">Start Spot</span>
                <span className="font-bold text-amber-400">{formatCurrency(input.startingPriceQuote, input.quoteSymbol)}</span>
              </div>
              <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-[10px] font-sans text-zinc-400 uppercase block">Graduation Threshold</span>
                <span className="font-bold text-emerald-400">{formatCurrency(input.migrationQuoteThreshold, input.quoteSymbol)}</span>
              </div>
              <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-[10px] font-sans text-zinc-400 uppercase block">Trading Fees</span>
                <span className="font-bold text-zinc-200">{input.startingFeeBps} → {input.endingFeeBps} bps</span>
              </div>
              <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-[10px] font-sans text-zinc-400 uppercase block">Post-Graduation LP</span>
                <span className="font-bold text-emerald-400">100% Locked</span>
              </div>
            </div>

            {/* Explicit Confirmation Checkbox */}
            <div className="pt-3 border-t border-zinc-800/80">
              <label className="flex items-start gap-3 cursor-pointer select-none bg-zinc-900/70 p-3.5 rounded-lg border border-zinc-700/80 hover:border-amber-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={confirmedCheck}
                  onChange={(e) => setConfirmedCheck(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-amber-500 cursor-pointer"
                />
                <div className="text-xs text-zinc-200 leading-relaxed">
                  <strong>I explicitly confirm and authorize this transaction.</strong> I have verified the token mint (<code>{input.baseMint.slice(0, 8)}...</code>), quote currency ({input.quoteSymbol}), and bonding curve invariant parameters. I understand that transaction fees and account rent exemptions on Solana are non-refundable.
                </div>
              </label>
            </div>
          </div>

          {/* Action Button Bar */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBack}
              className="py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Preview</span>
            </button>

            <button
              type="button"
              disabled={!confirmedCheck}
              onClick={handleExecute}
              className="py-3 px-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Sign & Broadcast Deployment</span>
            </button>
          </div>
        </div>
      )}

      {/* Pending States: Signing, Broadcasting, Confirming */}
      {connected && (deploymentState === 'signing' || deploymentState === 'broadcasting' || deploymentState === 'confirming') && (
        <div className="bg-[#0c101a] border border-zinc-800 rounded-xl p-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <RefreshCw className="w-7 h-7 animate-spin" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">
              {deploymentState === 'signing' && 'Awaiting Wallet Approval...'}
              {deploymentState === 'broadcasting' && 'Broadcasting to Solana Cluster...'}
              {deploymentState === 'confirming' && 'Awaiting Blockchain Consensus Confirmation...'}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {deploymentState === 'signing' && 'Please confirm and sign the transaction in your Solana wallet extension prompt.'}
              {deploymentState === 'broadcasting' && 'Transaction is being dispatched to active Solana devnet/mainnet RPC validators.'}
              {deploymentState === 'confirming' && 'Transaction committed to block. Awaiting finality status...'}
            </p>
          </div>

          {/* Stepper progress indicator */}
          <div className="flex items-center justify-center gap-4 text-xs font-medium">
            <div className={`flex items-center gap-1.5 ${deploymentState === 'signing' ? 'text-amber-400 font-bold' : 'text-emerald-400'}`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>1. Wallet Sign</span>
            </div>
            <div className={`flex items-center gap-1.5 ${deploymentState === 'broadcasting' ? 'text-amber-400 font-bold' : deploymentState === 'confirming' ? 'text-emerald-400' : 'text-zinc-600'}`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>2. Broadcast</span>
            </div>
            <div className={`flex items-center gap-1.5 ${deploymentState === 'confirming' ? 'text-amber-400 font-bold' : 'text-zinc-600'}`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>3. Confirm</span>
            </div>
          </div>
        </div>
      )}

      {/* Success State (Only After Real Blockchain Confirmation) */}
      {deploymentState === 'success' && deploymentResult && (
        <div className="bg-[#0c101a] border border-emerald-900/50 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-4 border-b border-zinc-800/80 pb-5">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Meteora Dynamic Bonding Curve Pool Deployed Successfully!
              </h3>
              <p className="text-xs text-emerald-400 mt-0.5 font-medium">
                Confirmed on Solana {deploymentResult.network} • Market is live in VALTICS directory
              </p>
            </div>
          </div>

          {/* Deployment Credentials & Identifiers */}
          <div className="space-y-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-5 font-mono text-xs">
            {/* Transaction Signature */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-zinc-800/60">
              <span className="font-sans text-zinc-400">Transaction Signature</span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 truncate max-w-[280px]">
                  {deploymentResult.txSignature}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(deploymentResult.txSignature, 'sig')}
                  className="text-zinc-400 hover:text-white"
                >
                  {copiedKey === 'sig' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={getExplorerUrl(deploymentResult.txSignature, 'tx', network)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-0.5 text-[11px]"
                >
                  <span>Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Pool Address */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-zinc-800/60">
              <span className="font-sans text-zinc-400">Meteora DBC Pool Address (PDA)</span>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold truncate max-w-[280px]">
                  {deploymentResult.poolAddress}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(deploymentResult.poolAddress, 'res_pool')}
                  className="text-zinc-400 hover:text-white"
                >
                  {copiedKey === 'res_pool' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={getExplorerUrl(deploymentResult.poolAddress, 'address', network)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-0.5 text-[11px]"
                >
                  <span>Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Config Address */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-zinc-800/60">
              <span className="font-sans text-zinc-400">Configuration Account</span>
              <div className="flex items-center gap-2">
                <span className="text-zinc-200 truncate max-w-[280px]">
                  {deploymentResult.configAddress}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(deploymentResult.configAddress, 'res_config')}
                  className="text-zinc-400 hover:text-white"
                >
                  {copiedKey === 'res_config' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Network & Timestamp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-sans text-xs">
              <div>
                <span className="text-zinc-400 text-[10px] uppercase block">Blockchain Network</span>
                <span className="font-mono text-zinc-200">Solana {deploymentResult.network}</span>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px] uppercase block">Confirmation Timestamp</span>
                <span className="font-mono text-zinc-200">
                  {new Date(deploymentResult.timestamp).toISOString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Destination Links */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setDeploymentState('idle');
                setDeploymentResult(null);
                setConfirmedCheck(false);
              }}
              className="py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer transition-colors"
            >
              Design Another Curve Market
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onSelectTab('markets')}
                className="py-2.5 px-5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                View in Markets Directory
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onSelectMarketDetail) {
                    onSelectMarketDetail(deploymentResult.poolAddress);
                  }
                  onSelectTab('market-detail');
                }}
                className="py-2.5 px-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs shadow-amber-500/20"
              >
                <span>Open Market Terminal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error / Failure State (Never Fake Success) */}
      {deploymentState === 'error' && (
        <div className="bg-rose-950/30 border border-rose-900/60 rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-rose-200">Deployment Transaction Failed</h3>
              <p className="text-xs text-rose-300/90 leading-relaxed">
                The Solana blockchain rejected the transaction or the RPC node reported an execution error. No funds were drained.
              </p>
            </div>
          </div>

          {/* Failure Log details */}
          <div className="bg-black/60 rounded-lg p-3.5 font-mono text-xs text-rose-300 border border-rose-950/80 overflow-x-auto">
            <div className="text-[10px] text-zinc-400 uppercase font-sans mb-1">Error Diagnostics:</div>
            <div>{txError || prepError || 'Unknown execution failure.'}</div>
          </div>

          {/* Retry Bar */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBack}
              className="py-2 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer"
            >
              Back to Configuration Preview
            </button>

            <button
              type="button"
              onClick={handleRetry}
              className="py-2.5 px-5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold cursor-pointer transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Deployment</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
