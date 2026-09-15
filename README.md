# VALTICS

<p align="center">
  <img src="public/valtics-logo.svg" width="100" height="100" alt="VALTICS Logo" />
</p>

<p align="center">
  <strong>Programmable markets for tokenized assets.</strong>
</p>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#core-features">Core Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#meteora-integration">Meteora Integration</a> •
  <a href="#technology-stack">Technology Stack</a> •
  <a href="#security">Security</a> •
  <a href="#getting-started">Getting Started</a>
</p>

---

## Overview

**VALTICS** is an issuer-focused market infrastructure platform designed for tokenized assets and equity-like real-world assets (RWAs). 

VALTICS uses Solana and Meteora's Dynamic Bonding Curve (DBC) infrastructure to provide configurable price discovery and liquidity mechanisms for newly tokenized assets. The platform moves beyond one-size-fits-all token launches by providing asset originators and issuers with a structured, rigorous methodology to configure market parameters tailored to distinct asset classes, liquidity depths, and volatility profiles.

Whether launching short-duration Treasury bill wrappers, private credit instruments, real estate yield tokens, or structured notes, VALTICS provides the parameterization, simulation, on-chain execution, and graduation monitoring required for institutional-grade primary liquidity.

---

## Core Features

- **Tokenized Asset Market Creation**: End-to-end guided workflow for configuring and deploying on-chain bonding curve liquidity pools for SPL tokens on Solana.
- **Dynamic Bonding Curve Configuration**: Parameterize initial spot pricing, target migration market cap, curve delta, fee decays, and LP token splits according to asset fundamentals.
- **Configurable Price-Discovery Parameters**: Support for tailored starting price corridors, floor mechanisms, and dynamic spread controls suited for stable-yield vs. variable-growth assets.
- **Liquidity Configuration**: Granular post-graduation liquidity distribution controls, including permanent LP locking, unlocked LP vesting, and partner splits.
- **Curve Visualization & Mathematical Simulation**: Deterministic invariant visualizer modeling price progression, quote token reserve accumulation, slippage thresholds, and market depth from genesis to graduation.
- **Graduation & Migration Monitoring**: Real-time tracking of curve completion percentage, quote accumulation toward graduation thresholds, and automated transition indicators for Meteora DAMM v2 pools.
- **Market Dashboard & Analytics**: High-level and detailed metrics including Total Value Locked (TVL), 24h trading volume, current price, active reserve balances, and slot timestamps.
- **Asset Information & Verification Layer**: Integrated token metadata inspection, base mint account validation, reference Net Asset Value (NAV) anchoring, and category tagging (Treasuries, Private Credit, Real Estate, Structured Notes).
- **On-Chain Activity Monitoring**: Live indexing and event log displays of transactions (swaps, pool initialization, fee collections) confirmed on the Solana ledger.
- **Solana Wallet Integration**: Native support for browser-based Solana wallets (Phantom, Solflare, Standard Wallet specification) alongside an integrated Devnet Sandbox Wallet with instant devnet SOL faucet integration for local testing.
- **Real Blockchain Transaction Flow**: Constructs genuine Solana transaction instructions using the official Meteora DBC SDK, runs simulated pre-flights, and broadcasts signed transactions to RPC nodes.
- **Transaction Status & Confirmation**: Explicit multi-phase feedback covering preparation, wallet signature request, network broadcast, on-chain block confirmation, and Solana Explorer verification links.
- **Issuer Market Management**: Dedicated portal for pool creators to monitor deployed markets, track accrued creator fees, inspect vault accounts, and administer market parameters.

---

## Architecture

The VALTICS platform is architected in clear, decoupled layers mapped directly to on-chain program requirements:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        User Interface Layer                            │
│  React 19 • Tailwind CSS v4 • Lucide Icons • Motion Transitions        │
│  (Overview Dashboard, Market Terminal, Curve Studio, Activity Log)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Application & Business Logic                         │
│  Market State Management • Curve Math Simulation • Local Registry      │
│  NetworkContext (Devnet/Mainnet) • WalletContext • Toast Notifications │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Meteora Integration Layer                          │
│  @meteora-ag/dynamic-bonding-curve-sdk                                 │
│  - buildCurve & Fee Configuration Builders                             │
│  - deriveDbcPoolAddress & deriveDbcTokenVaultAddress PDA Derivations   │
│  - Transaction Construction: createConfigAndPool Instructions          │
│  - Pre-flight RPC Simulation & Parameter Validation                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Solana Wallet Layer                            │
│  Phantom • Solflare • Standard Solana Providers • Sandbox Keypair      │
│  Client-side message & transaction signing                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Solana Blockchain & Programs                      │
│  Meteora DBC Program: Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB     │
│  Solana SPL Token Program • System Program • Meteora DAMM v2           │
└────────────────────────────────────────────────────────────────────────┘
```

### Layer Breakdown

1. **User Interface Layer**: Built with React 19, Tailwind CSS v4, and modern design primitives. Provides the primary entry points:
   - **Overview Dashboard**: High-level asset universe, featured markets, and protocol statistics.
   - **Market Directory & Terminal**: Live trading views, interactive depth charts, reserve monitors, and swap execution interfaces.
   - **VALTICS Curve Studio**: 6-step guided market creation and parameterization studio with built-in asset verification and curve simulation.
   - **My Markets**: Portfolio and fee management dashboard for market issuers.
2. **Application & Business Logic**: Handles client-side state, invariant calculations, network cluster selection, market caching (`localStorage`), and connection handling.
3. **Meteora Integration Layer (`src/services/` & `src/config/`)**: Encapsulates SDK interactions with `@meteora-ag/dynamic-bonding-curve-sdk`, formatting configuration parameters (base fee mode, fee decay schedules, migration thresholds, and token authority settings) into serialized Solana transaction payloads.
4. **Solana Wallet Layer (`src/context/WalletContext.tsx`)**: Bridges browser wallet extensions with the application. Provides unified transaction signing interfaces and handles fee-payer keypair management.
5. **Solana Blockchain**: The decentralized settlement layer executing the Meteora Dynamic Bonding Curve smart contract and maintaining pool state PDAs, base token vaults, and quote reserve vaults.

---

## Meteora Integration

VALTICS directly integrates with Meteora's Dynamic Bonding Curve (DBC) protocol on Solana using the official TypeScript SDK:

- **Official SDK Package**: `@meteora-ag/dynamic-bonding-curve-sdk` (v1.5.12)
- **Program ID**: `Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB`

### Supported DBC Mechanisms

- **Dynamic Curve Construction (`buildCurve`)**: Computes initial virtual reserves, real reserve requirements, and migration points based on target quote thresholds and allocation ratios.
- **Config & Pool Initialization (`createConfigAndPool`)**: Packages curve configuration, fee schedules, token authority constraints, and pool keypairs into an atomic transaction instruction set.
- **Configurable Fee Schedules**:
  - `FeeSchedulerLinear`: Linearly decays trading fees from a designated starting basis points (bps) to ending bps over a defined timeframe.
  - `FeeSchedulerExponential`: Smooth exponential fee reduction tailored for price discovery phases.
- **Dynamic Fees**: Dynamic fee adjustment based on short-term market volatility.
- **Fee Collection Modes**: Supports `CollectFeeMode.QuoteToken` and `CollectFeeMode.OutputToken` for streamlined accounting.
- **Migration & Graduation Path**: Configured targeting `MigrationOption.MET_DAMM_V2` for automated transition to Meteora Dynamic Automated Market Maker (DAMM v2) pools when the quote threshold is met.
- **Permanent Liquidity Locking**: Enables issuers to configure permanent LP token locks (`creatorPermanentLockedLpPct`) to ensure permanent secondary market liquidity for token holders.
- **Program Derived Address (PDA) Derivation**: Programmatic derivation of pool accounts (`deriveDbcPoolAddress`) and secure token vaults (`deriveDbcTokenVaultAddress`).

*Note: VALTICS only utilizes supported, verified methods exposed by the official `@meteora-ag/dynamic-bonding-curve-sdk`.*

---

## Technology Stack

The codebase strictly utilizes the following production technologies and libraries:

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [React 19](https://react.dev/) | Component architecture, functional components, hooks |
| **Language** | [TypeScript 5.8](https://www.typescriptlang.org/) | End-to-end static type safety and Solana SDK typing |
| **Build Tooling** | [Vite 6](https://vitejs.dev/) | Fast build bundling, ESM hot reloading, and dev server |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern utility-first CSS design system |
| **Blockchain Client** | [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/) | Solana RPC connection, transactions, PublicKey, Keypair |
| **Token Standard** | [@solana/spl-token](https://spl.solana.com/token) | SPL Token program utilities and balance queries |
| **Bonding Curve Engine** | [@meteora-ag/dynamic-bonding-curve-sdk](https://github.com/meteora-ag/dynamic-bonding-curve-sdk) | Official Meteora DBC pool generation, curves, and fees |
| **Large Number Math** | [bn.js](https://github.com/indutny/bn.js/) / [buffer](https://github.com/feross/buffer) | 64-bit and 128-bit integer precision for token amounts |
| **Polyfills** | `vite-plugin-node-polyfills` | Node.js cryptographic and buffer polyfills for Vite |
| **Icons & UI** | [Lucide React](https://lucide.dev/) | Clean, accessible vector iconography |
| **Animations** | [Motion](https://motion.dev/) | Smooth layout transitions and interaction feedback |

---

## Security

VALTICS is designed with a non-custodial, client-verifiable security architecture:

1. **Non-Custodial Architecture**: VALTICS does **not** request, collect, or store users' private keys, recovery seed phrases, or credentials on any server or database.
2. **Explicit Wallet Signatures**: Wallet signatures are requested exclusively through connected Solana wallet providers when an explicit blockchain state change (e.g. pool creation, swap, fee withdrawal) is initiated by the user.
3. **Transaction Inspection Before Signing**: Complete transaction details—including target accounts, derived PDAs, fee parameters, and rent allocation costs—are presented in the interface for review prior to submitting the signature request.
4. **Verified Confirmation States**: Success states, pool registrations, and transaction receipts are displayed only after positive on-chain confirmation by the Solana cluster RPC.
5. **Environment Configuration**: Sensitive environment settings and private RPC endpoints are managed strictly through environment variables (`.env`).
6. **Independent Verification**: Users should independently review all transaction summaries, destination vaults, and fee parameters in their connected wallet before signing any transaction.

---

## Market Profiles

VALTICS Curve Studio provides pre-configured, mathematically modeled market presets for common tokenized asset profiles:

| Profile | Target Asset Class | Volatility Corridor | Fee Schedule | Graduation Threshold | LP Lock |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Conservative** | T-Bills, Short-Term Government Debt, Yield Stables | ±2% to ±4% | 0.25% → 0.20% (86,400s) | $150,000 USDC | 100% Locked |
| **Balanced** | Private Credit, Senior Debt, Real Estate Income | ±8% to ±15% | 0.75% → 0.40% (172,800s) | $350,000 USDC | 90% Locked |
| **Growth** | Tokenized Equity, Commodities, Infrastructure | ±25% to ±50% | 1.50% → 0.60% (259,200s) | $750,000 USDC | 80% Locked |

*Disclaimer: Market profile presets are parameter templates provided for simulation and configuration purposes only and do not constitute financial, investment, legal, or regulatory advice.*

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) or [Bun](https://bun.sh/)
- A Solana wallet extension (e.g. [Phantom](https://phantom.app/) or [Solflare](https://solflare.com/)) set to Solana Devnet or Mainnet-Beta.

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/valtics.git
cd valtics
```

### 2. Install Dependencies

Using `npm`:
```bash
npm install
```

Or using `bun`:
```bash
bun install
```

### 3. Configure Environment Variables

Create a `.env` file from the provided `.env.example`:

```bash
cp .env.example .env
```

Review and adjust variables as required:

```env
# Solana RPC Endpoint (devnet, mainnet-beta, or custom RPC like Helius/Triton)
VITE_SOLANA_RPC_URL="https://api.devnet.solana.com"

# Target Solana Cluster ('devnet' | 'mainnet-beta')
VITE_SOLANA_NETWORK="devnet"
```

### 4. Run the Development Server

Start the local development server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### 5. Build for Production

Compile the project into static assets:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

### 6. Linting & Type Checking

To verify TypeScript types across all modules:

```bash
npm run lint
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
