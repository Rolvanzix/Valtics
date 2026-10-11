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
  ArrowRight, 
  Terminal,
  Info,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileCheck2,
  Activity
} from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import { 
  CurveStudioConfigInput, 
  PreparedPoolDeployment, 
  prepareMeteoraPoolTransaction, 
  simulateMeteoraTransaction, 
  executeAndConfirmPoolTransaction,
  validateCurveStudioInput,
  createPoolStateFromDeployment,
  TransactionDiagnosticsData,
  MeteoraDeploymentError
} from '../../services/meteoraCreation';
import { 
  runPreDeploymentChecks, 
  PreDeploymentValidationResult,
  DEVNET_RPC_ENDPOINT,
  DEVNET_DBC_PROGRAM_ID,
  DEVNET_SOL_QUOTE_MINT
} from '../../services/networkValidator';
import { 
  auditMarketSafety, 
  MarketSafetyAuditResult 
} from '../../services/marketSafetyAudit';
import { 
  saveCreatedMarket, 
  isMarketAlreadyCreated, 
  reconcileMarketWithBlockchain 
} from '../../services/marketStorage';
import { 
  runDevnetCreationTestSuite, 
  TestSuiteSummary 
} from '../../tests/devnetCreationSuite';
import { useNetwork } from '../../context/NetworkContext';
import { useWallet } from '../../context/WalletContext';
import { getExplorerUrl } from '../../config/constants';
import { formatCurrency, formatNumber } from '../../utils/format';
import { NavigationTab } from '../layout/Header';
import { sanitizeErrorMessage } from '../../utils/security';

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
  | 'verifying'
  | 'success'
  | 'requires_verification'
  | 'error';

export const Step6Create: React.FC<Step6CreateProps> = ({
  input,
  onBack,
  onSelectTab,
  onSelectMarketDetail,
  onOpenWalletModal,
}) => {
  const { network, connection } = useNetwork();
  const { connected, publicKey, publicKeyStr, balanceSol, signTransaction, connect, isWrongNetwork, networkError } = useWallet();

  const [deploymentState, setDeploymentState] = useState<DeploymentState>('idle');
  const [prepared, setPrepared] = useState<PreparedPoolDeployment | null>(null);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [preCheckResult, setPreCheckResult] = useState<PreDeploymentValidationResult | null>(null);
  const [simulationLogs, setSimulationLogs] = useState<string[] | null>(null);
  const [confirmedCheck, setConfirmedCheck] = useState(false);
  const [safetyAudit, setSafetyAudit] = useState<MarketSafetyAuditResult | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);

  // Recovery & Post-Transaction State
  const [verificationPendingSig, setVerificationPendingSig] = useState<string | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<{ differenceDetected: boolean; discrepancies: string[] } | null>(null);

  // Devnet Test Suite Modal State
  const [showTestSuiteModal, setShowTestSuiteModal] = useState(false);
  const [testSuiteSummary, setTestSuiteSummary] = useState<TestSuiteSummary | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const [deploymentResult, setDeploymentResult] = useState<{
    txSignature: string;
    poolAddress: string;
    configAddress: string;
    baseVault: string;
    quoteVault: string;
    timestamp: number;
    network: string;
    marketId: string;
    creator: string;
    environment: string;
  } | null>(null);

  const [txError, setTxError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<TransactionDiagnosticsData | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTabSection, setActiveTabSection] = useState<'safety' | 'impact' | 'immutability'>('safety');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Run Test Suite Handler
  const handleRunTestSuite = async () => {
    setIsRunningTests(true);
    try {
      const summary = await runDevnetCreationTestSuite(connection, publicKey);
      setTestSuiteSummary(summary);
    } catch (err) {
      console.error('Failed to run test suite:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Automatically prepare transaction when entering Step 6 after strictly passing 10-point Pre-Deployment Checks
  useEffect(() => {
    let isMounted = true;

    async function prepare() {
      if (!connected || !publicKey) {
        return;
      }

      setDeploymentState('preparing');
      setPrepError(null);
      setTxError(null);

      // Anti-Duplication Check: check if base mint or pool already exists
      const dup = isMarketAlreadyCreated(input.baseMint);
      if (dup.exists && dup.pool) {
        setIsDuplicate(true);
        setDuplicateMessage(`Warning: A market with base mint ${input.baseMint.slice(0, 8)}... was already deployed on-chain at ${dup.pool.poolAddress.slice(0, 8)}...`);
      } else {
        setIsDuplicate(false);
        setDuplicateMessage(null);
      }

      // Execute 10-Point Pre-Deployment Verification
      const preCheck = await runPreDeploymentChecks({
        connection,
        connected,
        walletPublicKey: publicKey,
        walletPublicKeyStr: publicKeyStr,
        appNetwork: network,
        isWrongNetwork,
        networkError,
      });

      if (!isMounted) return;
      setPreCheckResult(preCheck);

      // Check 10: Block deployment immediately if any pre-check fails
      if (!preCheck.success || !preCheck.payerPublicKey) {
        const failureMsg = preCheck.errorSummary || 'Pre-deployment verification checks failed.';
        setPrepError(failureMsg);
        setDeploymentState('error');
        return;
      }

      // Validate Curve Studio input constraints
      input.payerAddress = preCheck.payerPublicKey.toBase58();
      const validation = validateCurveStudioInput(input);
      if (!validation.valid) {
        setPrepError(validation.errors.join('; '));
        setDeploymentState('error');
        return;
      }

      try {
        const prepResult = await prepareMeteoraPoolTransaction(connection, preCheck.payerPublicKey, input);
        if (!isMounted) return;

        // Perform simulation
        const sim = await simulateMeteoraTransaction(connection, prepResult.transaction);
        if (!isMounted) return;

        if (sim.logs) {
          setSimulationLogs(sim.logs);
        }

        // Run full Market Safety Audit
        const audit = auditMarketSafety(input, balanceSol, sim);
        setSafetyAudit(audit);

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
  }, [connected, publicKey, publicKeyStr, input, connection, network, isWrongNetwork, networkError, balanceSol]);

  // Execution handler: Explicit user confirmation required
  const handleExecute = async () => {
    if (!connected || !publicKey) {
      setTxError('Wallet not connected. Please connect your Solana Devnet wallet.');
      setDeploymentState('error');
      return;
    }

    if (isWrongNetwork) {
      setTxError(`Transaction blocked: ${networkError || 'Wallet or RPC is not on Solana Devnet.'}`);
      setDeploymentState('error');
      return;
    }

    if (safetyAudit && safetyAudit.classification === 'BLOCKED') {
      setTxError(`Market creation is BLOCKED by safety engine: ${safetyAudit.blockedReasons.join('; ')}`);
      setDeploymentState('error');
      return;
    }

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
      // Signing, Broadcasting, and Strictly Verifying on Solana Devnet
      const res = await executeAndConfirmPoolTransaction({
        connection,
        prepared,
        signTransaction,
        input,
        network: 'devnet',
        onStatusChange: (status) => {
          if (status === 'broadcasting') setDeploymentState('broadcasting');
          if (status === 'confirming') setDeploymentState('confirming');
          if (status === 'verifying') setDeploymentState('verifying');
        },
      });

      if (!res || !res.signature) {
        throw new Error('Transaction execution failed on-chain.');
      }

      // Persist to storage with verified pool address as canonical identifier
      const poolState = createPoolStateFromDeployment(res, input, 'devnet');
      const canonicalMarketId = `devnet-${res.poolAddress.slice(0, 10)}`;
      (poolState as any).marketId = canonicalMarketId;
      (poolState as any).environment = 'devnet';
      (poolState as any).authenticatedCreatorWallet = publicKeyStr || input.payerAddress;
      (poolState as any).onChainVerified = true;

      saveCreatedMarket(poolState, 'devnet');

      setDeploymentResult({
        txSignature: res.signature,
        poolAddress: res.poolAddress,
        configAddress: res.configAddress,
        baseVault: res.baseVaultAddress,
        quoteVault: res.quoteVaultAddress,
        timestamp: Date.now(),
        network: 'devnet',
        marketId: canonicalMarketId,
        creator: publicKeyStr || input.payerAddress,
        environment: 'devnet',
      });

      setDeploymentState('success');
    } catch (err: any) {
      const errMsg = err?.message || 'Transaction submission failed on Solana cluster.';
      
      // If error indicates that the transaction confirmed but on-chain account verification requires re-read:
      if (errMsg.includes('MARKET CREATION REQUIRES VERIFICATION')) {
        const sigMatch = errMsg.match(/Tx Signature:\s*([A-Za-z0-9]+)/);
        const sig = sigMatch ? sigMatch[1] : null;
        setVerificationPendingSig(sig);
        setTxError(errMsg);
        setDeploymentState('requires_verification');
        return;
      }

      if (err?.diagnostics) {
        setDiagnostics(err.diagnostics);
      } else if (prepared) {
        setDiagnostics({
          instructionIndex: 1,
          failingProgramId: DEVNET_DBC_PROGRAM_ID,
          simulationLogs: simulationLogs || [],
          instructionSummary: prepared.transaction.instructions.map((ix, idx) => ({
            index: idx,
            programId: ix.programId.toBase58(),
            programName: idx === 0 ? 'Meteora DBC: CreateConfig' : 'Meteora DBC: InitializeVirtualPoolWithSplToken',
            accountsCount: ix.keys.length,
            accounts: ix.keys.map((k) => ({ pubkey: k.pubkey.toBase58(), isSigner: k.isSigner, isWritable: k.isWritable })),
          })),
          baseMint: input.baseMint || prepared.baseMintAddress,
          quoteMint: input.quoteMint,
          configAddress: prepared.configPubkey,
          walletAddress: publicKeyStr || '',
          cluster: 'devnet',
          sdkVersion: '1.5.12',
          rawError: errMsg,
        });
      }
      setTxError(sanitizeErrorMessage(errMsg));
      setDeploymentState('error');
    }
  };

  // Reconcile on-chain ledger state in verification recovery mode
  const handleReconcileVerification = async () => {
    if (!prepared) return;
    setIsReconciling(true);
    setReconcileResult(null);

    try {
      const rec = await reconcileMarketWithBlockchain(prepared.poolAddress, connection);
      setReconcileResult({
        differenceDetected: rec.differenceDetected,
        discrepancies: rec.discrepancies,
      });

      if (rec.reconciled && rec.pool) {
        setDeploymentResult({
          txSignature: verificationPendingSig || 'Verified On-Chain',
          poolAddress: rec.pool.poolAddress,
          configAddress: rec.pool.configAddress || prepared.configPubkey,
          baseVault: rec.pool.baseVault || prepared.baseVaultAddress,
          quoteVault: rec.pool.quoteVault || prepared.quoteVaultAddress,
          timestamp: Date.now(),
          network: 'devnet',
          marketId: (rec.pool as any).marketId || `devnet-${rec.pool.poolAddress.slice(0, 10)}`,
          creator: rec.pool.creator,
          environment: 'devnet',
        });
        setDeploymentState('success');
      } else {
        setTxError(`Ledger verification check: Pool account ${prepared.poolAddress} has not yet finalized on Devnet validators. Please wait a few seconds and retry.`);
      }
    } catch (err: any) {
      setTxError(`Reconciliation failed: ${err?.message || 'RPC communication error'}`);
    } finally {
      setIsReconciling(false);
    }
  };

  const handleRetry = async () => {
    setTxError(null);
    setDiagnostics(null);
    setPrepError(null);
    if (publicKey) {
      setDeploymentState('preparing');
      try {
        const preCheck = await runPreDeploymentChecks({
          connection,
          connected,
          walletPublicKey: publicKey,
          walletPublicKeyStr: publicKeyStr,
          appNetwork: network,
          isWrongNetwork,
          networkError,
        });
        setPreCheckResult(preCheck);

        if (!preCheck.success || !preCheck.payerPublicKey) {
          const failureMsg = preCheck.errorSummary || 'Pre-deployment verification checks failed.';
          setPrepError(failureMsg);
          setDeploymentState('error');
          return;
        }

        input.payerAddress = preCheck.payerPublicKey.toBase58();
        const prepResult = await prepareMeteoraPoolTransaction(connection, preCheck.payerPublicKey, input);
        const sim = await simulateMeteoraTransaction(connection, prepResult.transaction);
        if (sim.logs) {
          setSimulationLogs(sim.logs);
        }
        const audit = auditMarketSafety(input, balanceSol, sim);
        setSafetyAudit(audit);
        setPrepared(prepResult);
        setDeploymentState('ready_to_confirm');
      } catch (err: any) {
        setTxError(sanitizeErrorMessage(err?.message || 'Retry preparation failed.'));
        setDeploymentState('error');
      }
    }
  };

  const classification = safetyAudit?.classification || 'SAFE';

  return (
    <div className="space-y-6">
      {/* Top Header & Test Suite Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#670CDC]/20 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-[#F7F3FF] tracking-tight font-sans">
              Market Verification & Deployment
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#140130] text-[#D76EDD] border border-[#670CDC]/30">
              SOLANA DEVNET
            </span>
          </div>
          <p className="text-xs text-[#B8A9CC] mt-1">
            Audited Meteora Dynamic Bonding Curve initialization with cryptographic on-chain verification.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowTestSuiteModal(true);
            if (!testSuiteSummary) {
              handleRunTestSuite();
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#140130] hover:bg-[#1A0140] text-[#B8A9CC] hover:text-[#F7F3FF] border border-[#670CDC]/30 text-xs font-mono transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Terminal className="w-3.5 h-3.5 text-[#34D399]" />
          <span>Devnet 15-Point Suite</span>
        </button>
      </div>

      {/* Duplicate Market Warning */}
      {isDuplicate && duplicateMessage && (
        <div className="bg-[#F99225]/15 border border-[#F99225]/40 rounded-xl p-4 flex items-start gap-3 text-xs text-[#EDE4FA]">
          <AlertTriangle className="w-5 h-5 text-[#F99225] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-sm font-bold text-[#F7F3FF] block">Duplicate Token Detection</strong>
            <p className="text-[11px] text-[#B8A9CC] leading-relaxed">
              {duplicateMessage}
            </p>
            <p className="text-[10px] text-[#F99225]">
              Meteora DBC requires a fresh, uninitialized base mint keypair for new pools. Valtics will atomically generate a new keypair if you proceed.
            </p>
          </div>
        </div>
      )}

      {/* Wallet Not Connected State */}
      {!connected && (
        <div className="bg-[#140130] border border-[#670CDC]/25 rounded-xl p-8 text-center space-y-4 shadow-xl shadow-[#09011B]/60">
          <div className="w-12 h-12 rounded-full bg-[#670CDC]/20 border border-[#670CDC]/40 flex items-center justify-center text-[#F99225] mx-auto">
            <Key className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-[#F7F3FF] font-sans">Wallet connection required</h3>
            <p className="text-xs text-[#B8A9CC] leading-relaxed">
              Connect your Solana wallet to sign the market initialization and deploy the dynamic bonding curve on Solana Devnet.
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
            className="py-2.5 px-6 rounded-lg bg-gradient-to-r from-[#670CDC] to-[#8023EC] hover:from-[#7615EC] hover:to-[#9035F5] text-white font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-md shadow-[#670CDC]/30"
          >
            <span>Connect wallet</span>
          </button>
        </div>
      )}

      {/* Preparing State */}
      {connected && deploymentState === 'preparing' && (
        <div className="bg-[#140130] border border-[#670CDC]/25 rounded-xl p-10 text-center space-y-4 shadow-xl shadow-[#09011B]/60">
          <div className="w-12 h-12 rounded-full bg-[#670CDC]/20 border border-[#670CDC]/40 flex items-center justify-center text-[#EDE4FA] mx-auto">
            <RefreshCw className="w-6 h-6 animate-spin text-[#F99225]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#F7F3FF]">Executing Preflight & Safety Engine</h3>
            <p className="text-xs text-[#B8A9CC]">
              Deriving PDAs, auditing authority configurations, and running preflight simulation on Devnet...
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Screen Before Signing */}
      {connected && deploymentState === 'ready_to_confirm' && prepared && (
        <div className="space-y-5">
          {/* 1. Market Safety Check Header Banner */}
          <div
            className={`rounded-xl p-4 border flex items-start gap-3 text-xs ${
              classification === 'BLOCKED'
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                : classification === 'HIGH_RISK'
                ? 'bg-orange-500/10 border-orange-500/40 text-orange-200'
                : classification === 'WARNING'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
            }`}
          >
            {classification === 'SAFE' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : classification === 'BLOCKED' ? (
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#F7F3FF]">
                  MARKET SAFETY CHECK — {classification}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    classification === 'SAFE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : classification === 'BLOCKED'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {classification}
                </span>
              </div>
              <p className="text-[11px] text-[#EDE4FA] leading-relaxed">
                {safetyAudit?.summaryMessage}
              </p>
            </div>
          </div>

          {/* 2. Interactive Navigation for Audit Details, Wallet Impact, Immutability */}
          <div className="bg-[#140130] border border-[#670CDC]/25 rounded-xl p-5 space-y-4 shadow-xl shadow-[#09011B]/60">
            <div className="flex items-center justify-between border-b border-[#670CDC]/20 pb-3">
              <div className="inline-flex p-1 rounded-lg bg-[#100126] border border-[#670CDC]/30 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setActiveTabSection('safety')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    activeTabSection === 'safety'
                      ? 'bg-[#670CDC] text-white shadow font-semibold'
                      : 'text-[#B8A9CC] hover:text-[#F7F3FF]'
                  }`}
                >
                  9-Point Safety Audit
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabSection('impact')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    activeTabSection === 'impact'
                      ? 'bg-[#670CDC] text-white shadow font-semibold'
                      : 'text-[#B8A9CC] hover:text-[#F7F3FF]'
                  }`}
                >
                  Transaction & Impact
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabSection('immutability')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    activeTabSection === 'immutability'
                      ? 'bg-[#670CDC] text-white shadow font-semibold'
                      : 'text-[#B8A9CC] hover:text-[#F7F3FF]'
                  }`}
                >
                  Immutability / Drift
                </button>
              </div>

              <span className="text-xs font-mono text-[#7E6D96]">Solana Devnet</span>
            </div>

            {/* TAB 1: 9-Point Safety Checklist */}
            {activeTabSection === 'safety' && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {safetyAudit?.checks.map((chk) => (
                    <div
                      key={chk.id}
                      className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${
                        chk.status === 'blocked'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                          : chk.status === 'warning'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : 'bg-[#100126] border-[#670CDC]/20 text-[#EDE4FA]'
                      }`}
                    >
                      {chk.status === 'passed' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : chk.status === 'blocked' ? (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-0.5">
                        <span className="font-semibold block text-[11px] text-[#F7F3FF]">
                          {chk.label}
                        </span>
                        <p className="text-[10px] text-[#B8A9CC] leading-relaxed">
                          {chk.detail}
                        </p>
                        {chk.remediation && chk.status !== 'passed' && (
                          <p className="text-[10px] font-mono text-[#F99225]">
                            Fix: {chk.remediation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: Transaction Preview & Expected Wallet Impact */}
            {activeTabSection === 'impact' && (
              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#100126] border border-[#670CDC]/20 space-y-2 font-sans">
                  <h4 className="text-xs font-bold text-[#F7F3FF] uppercase tracking-wider font-mono">
                    You Are Creating:
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-[#7E6D96] block uppercase">Asset</span>
                      <span className="text-[#F7F3FF] font-semibold">{input.assetName} ({input.ticker})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7E6D96] block uppercase">Network</span>
                      <span className="text-[#F99225] font-semibold">Solana Devnet</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7E6D96] block uppercase">Genesis Price</span>
                      <span className="text-emerald-400 font-semibold">{input.startingPriceQuote} {input.quoteSymbol}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7E6D96] block uppercase">Threshold</span>
                      <span className="text-emerald-400 font-semibold">{input.migrationQuoteThreshold.toLocaleString()} {input.quoteSymbol}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#100126] border border-[#670CDC]/20 space-y-2">
                  <h4 className="text-xs font-bold text-[#F99225] uppercase tracking-wider">
                    Expected Wallet Impact:
                  </h4>
                  <div className="space-y-1.5 text-[11px] text-[#EDE4FA]">
                    <div className="flex justify-between border-b border-[#670CDC]/15 pb-1">
                      <span className="text-[#B8A9CC]">Estimated SOL Required (Rent + Tx Fee):</span>
                      <span className="font-bold text-[#F99225]">~0.065005 SOL</span>
                    </div>
                    <div className="flex justify-between border-b border-[#670CDC]/15 pb-1">
                      <span className="text-[#B8A9CC]">Token Supply Minted:</span>
                      <span className="font-bold">{input.totalSupply.toLocaleString()} units</span>
                    </div>
                    <div className="flex justify-between border-b border-[#670CDC]/15 pb-1">
                      <span className="text-[#B8A9CC]">Curve Allocation (Available for Public Trade):</span>
                      <span className="font-bold text-emerald-400">
                        {((input.totalSupply * input.curveAllocationPct) / 100).toLocaleString()} ({input.curveAllocationPct}%)
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-[#670CDC]/15 pb-1">
                      <span className="text-[#B8A9CC]">Migration Allocation (Reserved for DAMM v2 LP):</span>
                      <span className="font-bold">
                        {(input.totalSupply - (input.totalSupply * input.curveAllocationPct) / 100).toLocaleString()} units
                      </span>
                    </div>
                    <div className="flex justify-between pt-0.5">
                      <span className="text-[#B8A9CC]">Accounts Initialized Atomically:</span>
                      <span className="text-right text-[#D76EDD]">Config PDA, Pool PDA, Base/Quote Vault ATAs</span>
                    </div>
                  </div>
                </div>

                {/* Derived Addresses */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded bg-[#100126] border border-[#670CDC]/20">
                    <span className="text-[#B8A9CC]">Pool PDA:</span>
                    <span className="text-[#F99225]">{prepared.poolAddress}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded bg-[#100126] border border-[#670CDC]/20">
                    <span className="text-[#B8A9CC]">Config PDA:</span>
                    <span className="text-[#EDE4FA]">{prepared.configAddress}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Market Immutability / Configuration Drift Panel */}
            {activeTabSection === 'immutability' && (
              <div className="space-y-3 text-xs">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold block">
                    IMMUTABLE (Locked On-Chain — Cannot Drift)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                    {safetyAudit?.immutableParameters.map((p, idx) => (
                      <div key={idx} className="p-2 rounded bg-[#100126] border border-[#670CDC]/20 space-y-0.5">
                        <span className="text-[#7E6D96] block text-[10px]">{p.name}</span>
                        <div className="text-[#F7F3FF] font-bold truncate">{p.value}</div>
                        <span className="text-[10px] text-[#B8A9CC] block font-sans">{p.rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-[#F99225] uppercase tracking-wider font-bold block">
                      CREATOR CONTROLLED
                    </span>
                    {safetyAudit?.creatorControlledParameters.map((p, idx) => (
                      <div key={idx} className="p-2 rounded bg-[#100126] border border-[#670CDC]/20 space-y-0.5 text-[11px]">
                        <span className="text-[#7E6D96] block text-[10px]">{p.name}</span>
                        <div className="text-[#F7F3FF] font-bold truncate">{p.value}</div>
                        <span className="text-[10px] text-[#B8A9CC] block">{p.rule}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-[#D76EDD] uppercase tracking-wider font-bold block">
                      PROTOCOL CONTROLLED
                    </span>
                    {safetyAudit?.protocolControlledParameters.map((p, idx) => (
                      <div key={idx} className="p-2 rounded bg-[#100126] border border-[#670CDC]/20 space-y-0.5 text-[11px]">
                        <span className="text-[#7E6D96] block text-[10px]">{p.name}</span>
                        <div className="text-[#F7F3FF] font-bold truncate">{p.value}</div>
                        <span className="text-[10px] text-[#B8A9CC] block">{p.rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Explicit Confirmation Checkbox */}
            <div className="pt-3 border-t border-[#670CDC]/20">
              <label className="flex items-start gap-3 cursor-pointer select-none bg-[#100126] p-3.5 rounded-lg border border-[#670CDC]/30 hover:border-[#F99225]/50 transition-colors">
                <input
                  type="checkbox"
                  checked={confirmedCheck}
                  onChange={(e) => setConfirmedCheck(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-[#F99225] cursor-pointer"
                />
                <div className="text-xs text-[#EDE4FA] leading-relaxed">
                  <strong>I have reviewed the Market Safety Check and verify on-chain parameters.</strong> I confirm that this transaction initializes an immutable SPL token mint (<code>{input.baseMint.slice(0, 8)}...</code>), locks 100% of post-graduation LP in Meteora non-custodial locker, and creates the pool on Solana Devnet.
                </div>
              </label>
            </div>
          </div>

          {/* Action Button Bar */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto min-h-[44px] py-2.5 px-5 rounded-lg bg-[#140130] hover:bg-[#1A0140] text-[#EDE4FA] font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-[#670CDC]/30"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              disabled={!confirmedCheck || classification === 'BLOCKED'}
              onClick={handleExecute}
              className={`w-full sm:w-auto min-h-[44px] py-3 px-8 rounded-lg font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md ${
                classification === 'BLOCKED'
                  ? 'bg-rose-500/30 text-rose-200 border border-rose-500/50 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-[#F99225] to-[#E07D10] hover:from-[#FFA640] hover:to-[#F99225] text-black shadow-[#F99225]/20 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{classification === 'BLOCKED' ? 'Creation Blocked' : 'Create Market on Devnet'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Pending States: Signing, Broadcasting, Confirming, Verifying */}
      {connected && (deploymentState === 'signing' || deploymentState === 'broadcasting' || deploymentState === 'confirming' || deploymentState === 'verifying') && (
        <div className="bg-[#140130] border border-[#670CDC]/25 rounded-xl p-8 text-center space-y-6 shadow-xl shadow-[#09011B]/60">
          <div className="w-14 h-14 rounded-full bg-[#670CDC]/20 border border-[#670CDC]/40 flex items-center justify-center text-[#F99225] mx-auto">
            <RefreshCw className="w-7 h-7 animate-spin" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-[#F7F3FF]">
              {deploymentState === 'signing' && 'Awaiting Wallet Approval...'}
              {deploymentState === 'broadcasting' && 'Broadcasting to Solana Devnet...'}
              {deploymentState === 'confirming' && 'Awaiting Consensus Block Confirmation...'}
              {deploymentState === 'verifying' && 'Strictly Verifying On-Chain Ledger State...'}
            </h3>
            <p className="text-xs text-[#B8A9CC] leading-relaxed">
              {deploymentState === 'signing' && 'Please approve the atomic transaction in your Solana wallet prompt.'}
              {deploymentState === 'broadcasting' && 'Dispatched to Solana Devnet RPC validators with recent blockhash.'}
              {deploymentState === 'confirming' && 'Committed to block. Confirming consensus state.'}
              {deploymentState === 'verifying' && 'Reading back Meteora pool account info and matching configuration parameters against the ledger.'}
            </p>
          </div>

          {/* Stepper progress indicator */}
          <div className="flex items-center justify-center gap-3 text-xs font-medium font-mono">
            <div className={`flex items-center gap-1 ${deploymentState === 'signing' ? 'text-[#F99225] font-bold' : 'text-emerald-400'}`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>1. Sign</span>
            </div>
            <span>→</span>
            <div className={`flex items-center gap-1 ${deploymentState === 'broadcasting' ? 'text-[#F99225] font-bold' : (deploymentState === 'confirming' || deploymentState === 'verifying') ? 'text-emerald-400' : 'text-[#7E6D96]'}`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>2. Broadcast</span>
            </div>
            <span>→</span>
            <div className={`flex items-center gap-1 ${deploymentState === 'confirming' ? 'text-[#F99225] font-bold' : deploymentState === 'verifying' ? 'text-emerald-400' : 'text-[#7E6D96]'}`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>3. Confirm</span>
            </div>
            <span>→</span>
            <div className={`flex items-center gap-1 ${deploymentState === 'verifying' ? 'text-[#F99225] font-bold' : 'text-[#7E6D96]'}`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>4. Verify On-Chain</span>
            </div>
          </div>
        </div>
      )}

      {/* Recovery State: Requires Verification (Never fabricate success) */}
      {deploymentState === 'requires_verification' && prepared && (
        <div className="bg-[#140130] border border-[#F99225]/40 rounded-xl p-6 sm:p-8 space-y-6 shadow-xl shadow-[#09011B]/60">
          <div className="flex items-center gap-4 border-b border-[#670CDC]/20 pb-5">
            <div className="w-12 h-12 rounded-full bg-[#F99225]/10 border border-[#F99225]/40 flex items-center justify-center text-[#F99225] shrink-0">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#F7F3FF] tracking-tight">
                MARKET CREATION REQUIRES VERIFICATION
              </h3>
              <p className="text-xs text-[#F99225] mt-0.5 font-medium">
                Transaction submitted to Solana Devnet, but ledger account confirmation is pending validation.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#100126] border border-[#670CDC]/25 space-y-3 text-xs font-mono">
            <div className="text-[#EDE4FA] leading-relaxed font-sans">
              The Valtix protocol never reports success until on-chain accounts are independently verified. You can check the transaction status on Solana Explorer or trigger an immediate on-chain reconciliation check.
            </div>

            {verificationPendingSig && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded bg-[#140130] border border-[#670CDC]/20">
                <span className="text-[#B8A9CC]">Tx Signature:</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#F99225]">{verificationPendingSig.slice(0, 16)}...</span>
                  <a
                    href={getExplorerUrl(verificationPendingSig, 'tx', 'devnet')}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#F99225] hover:text-[#FFA640] flex items-center gap-0.5 text-[11px]"
                  >
                    <span>Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded bg-[#140130] border border-[#670CDC]/20">
              <span className="text-[#B8A9CC]">Pool Account:</span>
              <span>{prepared.poolAddress}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isReconciling}
              onClick={handleReconcileVerification}
              className="py-2.5 px-6 rounded-lg bg-[#670CDC] hover:bg-[#7818EE] text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-md shadow-[#670CDC]/30 disabled:opacity-50"
            >
              {isReconciling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileCheck2 className="w-3.5 h-3.5" />}
              <span>Verify On-Chain Ledger State Now</span>
            </button>

            <button
              type="button"
              onClick={handleRetry}
              className="py-2.5 px-5 rounded-lg bg-[#140130] hover:bg-[#1A0140] text-[#B8A9CC] hover:text-[#F7F3FF] border border-[#670CDC]/30 text-xs font-medium cursor-pointer"
            >
              Back to Review
            </button>
          </div>
        </div>
      )}

      {/* Success State (Only After Real On-Chain Ledger Verification) */}
      {deploymentState === 'success' && deploymentResult && (
        <div className="bg-[#140130] border border-emerald-500/40 rounded-xl p-6 sm:p-8 space-y-6 shadow-xl shadow-[#09011B]/60">
          <div className="flex items-center gap-4 border-b border-[#670CDC]/20 pb-5">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#F7F3FF] tracking-tight">
                Meteora Dynamic Bonding Curve Deployed & Verified On-Chain!
              </h3>
              <p className="text-xs text-emerald-400 mt-0.5 font-medium">
                Confirmed and verified on Solana Devnet • Real on-chain state read back successfully
              </p>
            </div>
          </div>

          {/* Deployment Credentials & Identifiers */}
          <div className="space-y-3 bg-[#100126] border border-[#670CDC]/20 rounded-xl p-5 font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-[#670CDC]/20">
              <span className="font-sans text-[#7E6D96]">Canonical Market ID</span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">
                  {deploymentResult.marketId}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(deploymentResult.marketId, 'mkt_id')}
                  className="text-[#7E6D96] hover:text-[#EDE4FA]"
                >
                  {copiedKey === 'mkt_id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-[#670CDC]/20">
              <span className="font-sans text-[#7E6D96]">Meteora Pool Account (PDA)</span>
              <div className="flex items-center gap-2">
                <span className="text-[#F99225] font-bold">
                  {deploymentResult.poolAddress}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(deploymentResult.poolAddress, 'res_pool')}
                  className="text-[#7E6D96] hover:text-[#EDE4FA]"
                >
                  {copiedKey === 'res_pool' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={getExplorerUrl(deploymentResult.poolAddress, 'address', 'devnet')}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#F99225] hover:text-[#FFA640] flex items-center gap-0.5 text-[11px]"
                >
                  <span>Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-[#670CDC]/20">
              <span className="font-sans text-[#7E6D96]">Base Token Mint</span>
              <div className="flex items-center gap-2">
                <span className="text-[#EDE4FA] font-bold">
                  {input.baseMint}
                </span>
                <a
                  href={getExplorerUrl(input.baseMint, 'address', 'devnet')}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#F99225] hover:text-[#FFA640] flex items-center gap-0.5 text-[11px]"
                >
                  <span>Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <span className="font-sans text-[#7E6D96]">Transaction Signature</span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 truncate max-w-[280px]">
                  {deploymentResult.txSignature}
                </span>
                <a
                  href={getExplorerUrl(deploymentResult.txSignature, 'tx', 'devnet')}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#F99225] hover:text-[#FFA640] flex items-center gap-0.5 text-[11px]"
                >
                  <span>Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Navigation to Live Market */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {onSelectMarketDetail && (
              <button
                type="button"
                onClick={() => onSelectMarketDetail(deploymentResult.poolAddress)}
                className="py-2.5 px-6 rounded-lg bg-[#670CDC] hover:bg-[#7818EE] text-white font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-md shadow-[#670CDC]/30"
              >
                <span>View Market Terminal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onSelectTab('markets')}
              className="py-2.5 px-5 rounded-lg bg-[#140130] hover:bg-[#1A0140] text-[#EDE4FA] font-medium text-xs transition-colors border border-[#670CDC]/30 cursor-pointer"
            >
              Browse Markets Directory
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {deploymentState === 'error' && (
        <div className="bg-[#140130] border border-rose-500/40 rounded-xl p-6 sm:p-8 space-y-5 shadow-xl shadow-[#09011B]/60">
          <div className="flex items-center gap-3 border-b border-[#670CDC]/20 pb-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F7F3FF]">Deployment Blocked or Failed</h3>
              <p className="text-xs text-rose-300 mt-0.5">
                {txError || prepError || 'Failed to complete transaction on Solana Devnet.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="py-2.5 px-6 rounded-lg bg-[#670CDC] hover:bg-[#7818EE] text-white font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-md shadow-[#670CDC]/30"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Preflight Checks</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="py-2.5 px-5 rounded-lg bg-[#140130] hover:bg-[#1A0140] text-[#EDE4FA] font-medium text-xs transition-colors border border-[#670CDC]/30 cursor-pointer"
            >
              Back to Configuration
            </button>
          </div>
        </div>
      )}

      {/* Devnet 15-Point Creation Test Suite Modal */}
      {showTestSuiteModal && (
        <div className="fixed inset-0 z-50 bg-[#000010]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#140130] border border-[#670CDC]/40 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            <div className="p-5 border-b border-[#670CDC]/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-[#34D399]" />
                <div>
                  <h3 className="text-base font-bold text-[#F7F3FF]">
                    Devnet Creation Test Suite (15 Test Invariants)
                  </h3>
                  <p className="text-[11px] text-[#B8A9CC]">
                    Live validation of Solana RPC, Meteora SDK constraints, scam-resistance, and on-chain ledger execution.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTestSuiteModal(false)}
                className="text-[#7E6D96] hover:text-[#EDE4FA] p-1.5 rounded-lg hover:bg-[#1C0142] transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between bg-[#100126] p-3 rounded-xl border border-[#670CDC]/20">
                <div className="text-xs font-mono">
                  <span className="text-[#7E6D96]">Cluster: </span>
                  <span className="text-[#F99225] font-bold">Solana Devnet</span>
                  {testSuiteSummary && (
                    <span className="ml-4 text-emerald-400 font-bold">
                      Passed: {testSuiteSummary.passed} / {testSuiteSummary.total}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isRunningTests}
                  onClick={handleRunTestSuite}
                  className="px-3 py-1.5 rounded-lg bg-[#670CDC] hover:bg-[#7818EE] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isRunningTests ? 'animate-spin' : ''}`} />
                  <span>{isRunningTests ? 'Executing...' : 'Re-run Tests'}</span>
                </button>
              </div>

              {testSuiteSummary ? (
                <div className="space-y-2">
                  {testSuiteSummary.results.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-lg bg-[#100126] border border-[#670CDC]/20 flex items-start gap-3 text-xs"
                    >
                      {r.passed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-0.5 font-mono">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#F7F3FF]">
                            {r.id}. {r.name}
                          </span>
                          <span className="text-[10px] text-[#7E6D96]">
                            {r.durationMs}ms
                          </span>
                        </div>
                        <p className="text-[11px] text-[#B8A9CC] font-sans">
                          {r.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#B8A9CC] space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#F99225]" />
                  <span>Running automated Devnet test suite...</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#670CDC]/20 bg-[#100126] flex justify-end">
              <button
                type="button"
                onClick={() => setShowTestSuiteModal(false)}
                className="py-2 px-5 rounded-lg bg-[#140130] hover:bg-[#1A0140] text-[#EDE4FA] text-xs font-semibold border border-[#670CDC]/30"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
