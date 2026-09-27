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
import { ExploreAssetsView } from './components/assets/ExploreAssetsView';
import { MarketsView } from './components/markets/MarketsView';
import { AssetPassportView } from './components/passport/AssetPassportView';
import { CreateMarketView } from './components/create/CreateMarketView';
import { CurveStudioView } from './components/studio/CurveStudioView';
import { MyMarketsView } from './components/myMarkets/MyMarketsView';
import { ActivityView } from './components/activity/ActivityView';
import { WalletModal } from './components/common/WalletModal';
import { PlatformPrimerModal } from './components/common/PlatformPrimerModal';
import { CurveModelParams, DBCPoolState } from './types';
import { getCreatedMarkets, onMarketCreated } from './services/marketStorage';
import { X, HelpCircle } from 'lucide-react';
import { ValticsLogo } from './components/brand/ValticsLogo';
import { BackgroundGrid } from './components/common/BackgroundGrid';
import { EnvironmentSwitch } from './components/common/EnvironmentSwitch';

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [primerModalOpen, setPrimerModalOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1280 : false;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [transferredCurveParams, setTransferredCurveParams] = useState<CurveModelParams | null>(null);
  const [selectedMarketAddress, setSelectedMarketAddress] = useState<string | null>(null);
  const [selectedCustomPool, setSelectedCustomPool] = useState<DBCPoolState | null>(null);
  const [navigatedFromTab, setNavigatedFromTab] = useState<NavigationTab | null>(null);
  const [passportInitialMint, setPassportInitialMint] = useState<string | null>(null);

  // Spotlight pool for contextual inspector: authentic on-chain created pool or null
  const [selectedPool, setSelectedPool] = useState<DBCPoolState | null>(() => {
    const created = getCreatedMarkets();
    return created.length > 0 ? created[0] : null;
  });

  React.useEffect(() => {
    const unsub = onMarketCreated((newPool) => {
      setSelectedPool(newPool);
    });
    return unsub;
  }, []);

  const handleApplyCurveToCreation = (params: CurveModelParams) => {
    setTransferredCurveParams(params);
    setActiveTab('create');
  };

  const handleSelectTab = (tab: NavigationTab) => {
    // If user explicitly clicks a top-level tab, clear active drill-down pool
    if (tab !== 'markets' || !selectedCustomPool) {
      setSelectedCustomPool(null);
      setSelectedMarketAddress(null);
      setNavigatedFromTab(null);
    }
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectAssetPage = (pool: DBCPoolState, fromTab: NavigationTab = 'explore-assets') => {
    setSelectedCustomPool(pool);
    setSelectedMarketAddress(pool.poolAddress);
    setNavigatedFromTab(fromTab);
    setActiveTab('markets');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex bg-[#080c14] text-[#e2e8f0] relative overflow-x-hidden">
      {/* Subtle Financial Infrastructure Background Layer */}
      <BackgroundGrid />

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

              {/* Mobile Environment Selector */}
              <div className="py-2 border-b border-zinc-800/80">
                <span className="text-[10px] uppercase font-mono text-zinc-500 mb-1.5 block">
                  Cluster Environment
                </span>
                <EnvironmentSwitch showStatusTip compact={true} />
              </div>

              <div className="space-y-1">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'markets', label: 'Explore markets' },
                  { id: 'create', label: 'Create market' },
                  { id: 'my-markets', label: 'Dashboard' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id as NavigationTab)}
                    className={`w-full text-left px-3.5 py-2.5 min-h-[44px] rounded-lg text-xs font-medium transition-colors flex items-center ${
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
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-lg bg-violet-950/30 text-violet-300 border border-violet-800/40 text-xs font-medium"
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
                onSelectAssetPage={(pool) => handleSelectAssetPage(pool, 'overview')}
                onSelectPool={(address) => {
                  const found = getCreatedMarkets().find((m) => m.poolAddress === address);
                  if (found) {
                    handleSelectAssetPage(found, 'overview');
                  } else {
                    setSelectedMarketAddress(address);
                    setNavigatedFromTab('overview');
                    handleSelectTab('markets');
                  }
                }}
              />
            )}

            {activeTab === 'explore-assets' && (
              <ExploreAssetsView
                onSelectTab={handleSelectTab}
                onSelectAssetPage={(pool) => handleSelectAssetPage(pool, 'explore-assets')}
              />
            )}

            {activeTab === 'markets' && (
              <MarketsView
                onSelectTab={handleSelectTab}
                selectedMarketAddress={selectedMarketAddress}
                customActivePool={selectedCustomPool}
                onBackToExplore={() => {
                  const fromTab = navigatedFromTab;
                  setSelectedCustomPool(null);
                  setSelectedMarketAddress(null);
                  setNavigatedFromTab(null);
                  if (fromTab && fromTab !== 'markets') {
                    setActiveTab(fromTab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                onOpenWalletModal={() => setWalletModalOpen(true)}
                onSelectPoolForInspector={(pool) => {
                  setSelectedPool(pool);
                  setInspectorOpen(true);
                }}
              />
            )}

            {activeTab === 'passport' && (
              <AssetPassportView
                onSelectTab={handleSelectTab}
                initialSelectedMint={passportInitialMint}
                onSelectMarketForTrade={(poolAddress) => {
                  setSelectedMarketAddress(poolAddress);
                  handleSelectTab('markets');
                }}
              />
            )}

            {activeTab === 'create' && (
              <CreateMarketView
                initialParams={transferredCurveParams}
                onSelectTab={handleSelectTab}
                onOpenWalletModal={() => setWalletModalOpen(true)}
                onSelectMarketDetail={(poolAddress) => {
                  setSelectedMarketAddress(poolAddress);
                  handleSelectTab('markets');
                }}
              />
            )}

            {activeTab === 'studio' && (
              <CreateMarketView
                initialParams={transferredCurveParams}
                onSelectTab={handleSelectTab}
                onOpenWalletModal={() => setWalletModalOpen(true)}
                onSelectMarketDetail={(poolAddress) => {
                  setSelectedMarketAddress(poolAddress);
                  handleSelectTab('markets');
                }}
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

            {/* Institutional Compact Footer */}
            <Footer onSelectTab={handleSelectTab} />
          </main>

          {/* 3. Right-Side Contextual Panel (Desktop persistent, Mobile/Tablet slide-over) */}
          <div className="hidden xl:block">
            <ContextualInspector
              isOpen={inspectorOpen}
              onClose={() => setInspectorOpen(false)}
              selectedPool={selectedPool}
              onNavigateToStudio={() => handleSelectTab('studio')}
            />
          </div>

          {/* Contextual Inspector Mobile/Tablet Drawer */}
          {inspectorOpen && (
            <div className="xl:hidden fixed inset-0 z-50 flex justify-end">
              <div
                className="fixed inset-0 bg-black/70 backdrop-blur-xs"
                onClick={() => setInspectorOpen(false)}
              />
              <div className="relative z-10 h-full">
                <ContextualInspector
                  isOpen={true}
                  onClose={() => setInspectorOpen(false)}
                  selectedPool={selectedPool}
                  onNavigateToStudio={() => {
                    setInspectorOpen(false);
                    handleSelectTab('studio');
                  }}
                />
              </div>
            </div>
          )}
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
