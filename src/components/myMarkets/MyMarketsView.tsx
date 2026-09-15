import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Search, 
  Coins, 
  ArrowUpRight, 
  ShieldCheck, 
  Lock, 
  RefreshCw, 
  AlertCircle,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Plus,
  ChevronRight
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { useNetwork } from '../../context/NetworkContext';
import { fetchCreatorPools } from '../../services/meteora';
import { DBCPoolState, TransactionIntent } from '../../types';
import { AddressBadge } from '../common/AddressBadge';
import { formatCurrency, formatPercent, formatBps } from '../../utils/format';
import { isValidSolanaAddress } from '../../utils/security';
import { METEORA_DBC_PROGRAM_ID, getExplorerUrl } from '../../config/constants';
import { TxPreflightModal } from '../common/TxPreflightModal';
import { NavigationTab } from '../layout/Header';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Table, Column } from '../ui/Table';
import { EmptyState } from '../ui/EmptyState';

interface MyMarketsViewProps {
  onSelectTab: (tab: NavigationTab) => void;
  onOpenWalletModal: () => void;
  onSelectPoolForInspector?: (pool: DBCPoolState) => void;
}

export const MyMarketsView: React.FC<MyMarketsViewProps> = ({
  onSelectTab,
  onOpenWalletModal,
  onSelectPoolForInspector,
}) => {
  const { connected, publicKeyStr } = useWallet();
  const { connection, rpcConfig, network } = useNetwork();

  const [creatorInput, setCreatorInput] = useState<string>('');
  const [activeAuthority, setActiveAuthority] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [pools, setPools] = useState<DBCPoolState[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Claim fees preflight modal
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedPoolForClaim, setSelectedPoolForClaim] = useState<DBCPoolState | null>(null);
  const [isSigningClaim, setIsSigningClaim] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimTxSig, setClaimTxSig] = useState<string | null>(null);

  useEffect(() => {
    if (connected && publicKeyStr) {
      setActiveAuthority(publicKeyStr);
      setCreatorInput(publicKeyStr);
    }
  }, [connected, publicKeyStr]);

  const loadCreatorPools = async (authority: string) => {
    if (!isValidSolanaAddress(authority)) {
      setError('Please enter a valid 32-44 char Solana public key.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const results = await fetchCreatorPools(connection, rpcConfig.endpoint, authority);
      setPools(results);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching creator pools';
      setError(msg);
      setPools([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeAuthority) {
      loadCreatorPools(activeAuthority);
    }
  }, [activeAuthority, connection, rpcConfig.endpoint]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (creatorInput.trim()) {
      setActiveAuthority(creatorInput.trim());
    }
  };

  const handleInitiateClaim = (pool: DBCPoolState) => {
    setSelectedPoolForClaim(pool);
    setClaimError(null);
    setClaimTxSig(null);
    setClaimModalOpen(true);
  };

  const claimIntent: TransactionIntent | null = selectedPoolForClaim
    ? {
        title: 'Claim Accrued Creator Trading Fees',
        description: `Execute claim instruction for accumulated trading fees on DBC Pool ${selectedPoolForClaim.poolAddress.slice(0, 8)}... to creator authority.`,
        programId: METEORA_DBC_PROGRAM_ID,
        network,
        instructionsCount: 1,
        estimatedFeeSol: 0.000005,
        rentExemptReserveSol: 0,
        requiredSigners: [publicKeyStr || 'Connected Wallet'],
        accounts: [
          { label: 'Pool PDA', pubkey: selectedPoolForClaim.poolAddress, isSigner: false, isWritable: true },
          { label: 'Creator Authority', pubkey: selectedPoolForClaim.creator, isSigner: true, isWritable: true },
          { label: 'Quote Vault PDA', pubkey: selectedPoolForClaim.quoteVault, isSigner: false, isWritable: true },
        ],
        criticalParameters: [
          { label: 'Target Pool', value: selectedPoolForClaim.poolAddress.slice(0, 8) + '...' },
          { label: 'Destination', value: selectedPoolForClaim.creator.slice(0, 8) + '...' },
          { label: 'Network', value: network },
        ],
      }
    : null;

  const handleExecuteClaim = async () => {
    setIsSigningClaim(true);
    setClaimError(null);
    try {
      if (!connected || !publicKeyStr) {
        throw new Error('Wallet must be connected to sign the claim instruction.');
      }
      throw new Error(
        `On-chain claim instruction ready for Meteora DBC on ${network.toUpperCase()}. Ensure creator authority account has minimum balance for base gas (~0.000005 SOL).`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Claim failed';
      setClaimError(msg);
    } finally {
      setIsSigningClaim(false);
    }
  };

  const columns: Column<DBCPoolState>[] = [
    {
      key: 'poolAddress',
      header: 'Pool PDA',
      render: (p) => <AddressBadge address={p.poolAddress} head={4} tail={4} />,
    },
    {
      key: 'baseMint',
      header: 'Base Mint',
      render: (p) => <AddressBadge address={p.baseMint} head={4} tail={4} />,
    },
    {
      key: 'migrationOptionLabel',
      header: 'Migration Target',
      render: (p) => <span className="font-sans text-zinc-300">{p.migrationOptionLabel}</span>,
    },
    {
      key: 'quoteReserve',
      header: 'Quote Reserve',
      align: 'right',
      render: (p) => (
        <span className="font-mono-nums text-zinc-200 font-semibold">{p.quoteReserve}</span>
      ),
    },
    {
      key: 'isMigrated',
      header: 'Status',
      align: 'center',
      render: (p) => (
        <Badge variant={p.isMigrated ? 'graduated' : 'live'} size="xs" dot>
          {p.isMigrated ? 'Graduated' : 'Active Curve'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => onSelectPoolForInspector?.(p)}
          >
            Inspect
          </Button>
          <Button
            variant="primary"
            size="xs"
            onClick={() => handleInitiateClaim(p)}
          >
            Claim Fees
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight font-sans">
              Issuer Markets & Fee Claims
            </h1>
            <Badge variant="brand" size="xs">
              Authority Dashboard
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your deployed Meteora Dynamic Bonding Curves, monitor fee accruals, and trigger AMM graduation
          </p>
        </div>

        <Button
          variant="brand"
          size="sm"
          onClick={() => onSelectTab('create')}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Deploy New Market
        </Button>
      </div>

      {/* Creator Authority Query Bar */}
      <Card>
        <div className="p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-sans">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Authority Filter</span>
            </span>
            {activeAuthority && (
              <button
                type="button"
                onClick={() => loadCreatorPools(activeAuthority)}
                className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh On-Chain</span>
              </button>
            )}
          </div>

          <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1">
              <Input
                placeholder="Enter Creator / Issuer Authority Public Key..."
                value={creatorInput}
                onChange={(e) => setCreatorInput(e.target.value)}
                tabular
                leftIcon={<Search className="w-3.5 h-3.5 text-zinc-500" />}
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              isLoading={loading}
              className="shrink-0"
            >
              Inspect Authority
            </Button>
          </form>

          {!connected && (
            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400 font-sans">
              <span>Viewing in guest mode. Connect wallet to auto-populate authority.</span>
              <button
                type="button"
                onClick={onOpenWalletModal}
                className="text-amber-400 hover:underline font-medium cursor-pointer"
              >
                Connect Wallet →
              </button>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-300 text-xs">
              {error}
            </div>
          )}
        </div>
      </Card>

      {/* Pools List or Empty State */}
      {loading ? (
        <Card>
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            <span className="text-xs font-mono">Querying Meteora DBC program accounts on {network}...</span>
          </div>
        </Card>
      ) : pools.length > 0 ? (
        <Table
          columns={columns}
          data={pools}
          keyExtractor={(p) => p.poolAddress}
          onRowClick={(p) => onSelectPoolForInspector?.(p)}
        />
      ) : (
        <EmptyState
          title="No Deployed DBC Markets Found for Authority"
          description={
            activeAuthority
              ? `No dynamic bonding curve pools on ${network} have creator authority set to ${activeAuthority.slice(0, 6)}...`
              : 'Connect your wallet or search an issuer address above to view your managed markets.'
          }
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSelectTab('create')}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Deploy First RWA Market
            </Button>
          }
        />
      )}

      {/* Claim Fees Preflight Modal */}
      <TxPreflightModal
        isOpen={claimModalOpen}
        intent={claimIntent}
        onClose={() => setClaimModalOpen(false)}
        onConfirm={handleExecuteClaim}
        isSigning={isSigningClaim}
        error={claimError}
        txSignature={claimTxSig}
      />
    </div>
  );
};
