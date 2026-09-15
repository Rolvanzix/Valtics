/**
 * VALTICS — Programmable markets for tokenized assets.
 * Institutional issuer-facing infrastructure for Meteora Dynamic Bonding Curves on Solana.
 */

import React, { useState } from 'react';
import { NetworkProvider } from './context/NetworkContext';
import { WalletProvider } from './context/WalletContext';
import { NavigationTab } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { TopUtilityBar } from './components/layout/TopUtilityBar';
import { ContextualInspector } from './components/layout/ContextualInspector';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { Footer } from './components/layout/Footer';
import { OverviewView } from './components/overview/OverviewView';
import { MarketsView } from './components/markets/MarketsView';
import { CreateMarketView } from './components/create/CreateMarketView';
import { CurveStudioView } from './components/studio/CurveStudioView';
import { MyMarketsView } from './components/myMarkets/MyMarketsView';
import { ActivityView } from './components/activity/ActivityView';
import { WalletModal } from './components/common/WalletModal';
import { PlatformPrimerModal } from './components/common/PlatformPrimerModal';
import { CurveModelParams, DBCPoolState } from './types';
import { REFERENCE_POOLS } from './config/constants';
import { X, HelpCircle } from 'lucide-react';
import { ValticsLogo } from './components/brand/ValticsLogo';

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [primerModalOpen, setPrimerModalOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [transferredCurveParams, setTransferredCurveParams] = useState<CurveModelParams | null>(null);
  const [selectedMarketAddress, setSelectedMarketAddress] = useState<string | null>(null);

  // Default initial spotlight pool for contextual inspector
  const initialPool = REFERENCE_POOLS?.[0];
  const [selectedPool, setSelectedPool] = useState<DBCPoolState | null>(
    initialPool
      ? {
          poolAddress: initialPool.poolAddress,
          configAddress: 'Config7vS4Z6hT9bK3gR3RwhK6eUuWkL2kRjV7K4Uv',
          baseMint: initialPool.baseMint,
          quoteMint: initialPool.quoteMint,
          baseVault: 'VaultB1cT2eR3uK6fP5hW9jQ2mD7zC4vB8xM1q9aL4nS',
          quoteVault: 'VaultQ2mD7zC4vB8xM1q9aL4nS7vX8bY1cT2eR3uK6fP',
          creator: 'Auth4vB8xM1q9aL4nS7vX8bY1cT2eR3uK6fP5hW9jQ2m',
          migrationOption: initialPool.migrationOption === 'MET_DAMM' ? 0 : 1,
          migrationOptionLabel: initialPool.migrationOption,
          baseReserve: '1000000000',
          quoteReserve: '50000000',
          quoteThreshold: initialPool.quoteThreshold,
          currentPrice: initialPool.currentPrice,
          startPrice: initialPool.startPrice,
          migrationPrice: initialPool.migrationPrice,
          quoteCurveProgressPct: initialPool.progressPct,
          baseCurveProgressPct: initialPool.progressPct,
          isMigrated: initialPool.isMigrated,
          baseFeeBps: initialPool.feeBps,
          tokenName: initialPool.name,
          tokenSymbol: initialPool.symbol,
          rwaCategory: initialPool.rwaCategory,
        }
      : null
  );

  const handleApplyCurveToCreation = (params: CurveModelParams) => {
    setTransferredCurveParams(params);
    setActiveTab('create');
  };

  const handleSelectTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex bg-[#080c14] text-[#e2e8f0]">
      {/* 1. Desktop Persistent Left Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 bg-[#090d14] border-r border-zinc-800 p-4 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <ValticsLogo size="sm" showText={true} />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'markets', label: 'Markets' },
                  { id: 'create', label: 'Create Market' },
                  { id: 'studio', label: 'Curve Studio' },
                  { id: 'my-markets', label: 'My Markets' },
                  { id: 'activity', label: 'Activity & Audit' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id as NavigationTab)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-[#121824] text-zinc-100 font-semibold border border-zinc-700'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setPrimerModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-950/30 text-violet-300 border border-violet-800/40 text-xs font-medium"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
                  <span>Platform Guide (How it works)</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 text-[10px] text-zinc-500 font-mono">
              VALTICS INFRASTRUCTURE · SOLANA
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Utility Header */}
        <TopUtilityBar
          onOpenWalletModal={() => setWalletModalOpen(true)}
          inspectorOpen={inspectorOpen}
          onToggleInspector={() => setInspectorOpen(!inspectorOpen)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onSearchQuery={setSearchQuery}
          onOpenPrimer={() => setPrimerModalOpen(true)}
        />

        {/* Workspace + Right Contextual Panel Layout */}
        <div className="flex-1 flex min-h-0">
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10 max-w-7xl w-full mx-auto">
            {activeTab === 'overview' && (
              <OverviewView
                onSelectTab={handleSelectTab}
                onSelectPool={(address) => {
                  setSelectedMarketAddress(address);
                  handleSelectTab('markets');
                }}
              />
            )}

            {activeTab === 'markets' && (
              <MarketsView
                onSelectTab={handleSelectTab}
                selectedMarketAddress={selectedMarketAddress}
                onSelectPoolForInspector={(pool) => {
                  setSelectedPool(pool);
                  setInspectorOpen(true);
                }}
              />
            )}

            {activeTab === 'create' && (
              <CreateMarketView
                initialParams={transferredCurveParams}
                onSelectTab={handleSelectTab}
                onOpenWalletModal={() => setWalletModalOpen(true)}
              />
            )}

            {activeTab === 'studio' && (
              <CurveStudioView
                onSelectTab={handleSelectTab}
                onApplyToCreation={handleApplyCurveToCreation}
              />
            )}

            {activeTab === 'my-markets' && (
              <MyMarketsView
                onSelectTab={handleSelectTab}
                onOpenWalletModal={() => setWalletModalOpen(true)}
                onSelectPoolForInspector={(pool) => {
                  setSelectedPool(pool);
                  setInspectorOpen(true);
                }}
              />
            )}

            {activeTab === 'activity' && (
              <ActivityView />
            )}

            {/* Institutional Footer */}
            <Footer />
          </main>

          {/* 3. Optional Right-Side Contextual Panel (Desktop) */}
          <div className="hidden xl:block">
            <ContextualInspector
              isOpen={inspectorOpen}
              onClose={() => setInspectorOpen(false)}
              selectedPool={selectedPool}
              onNavigateToStudio={() => handleSelectTab('studio')}
            />
          </div>
        </div>

        {/* 4. Mobile Bottom Navigation */}
        <MobileBottomNav
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
        />
      </div>

      {/* Non-Custodial Wallet Modal */}
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />

      {/* Platform Primer & Architecture Guide */}
      <PlatformPrimerModal
        isOpen={primerModalOpen}
        onClose={() => setPrimerModalOpen(false)}
        onNavigate={handleSelectTab}
      />
    </div>
  );
}

export default function App() {
  return (
    <NetworkProvider>
      <WalletProvider>
        <MainAppContent />
      </WalletProvider>
    </NetworkProvider>
  );
}
