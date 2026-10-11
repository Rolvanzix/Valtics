import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { formatPubkey } from '../../utils/format';
import { getExplorerUrl } from '../../config/constants';
import { useNetwork } from '../../context/NetworkContext';

interface AddressBadgeProps {
  address: string;
  type?: 'address' | 'tx';
  showCopy?: boolean;
  showExplorer?: boolean;
  label?: string;
  className?: string;
  head?: number;
  tail?: number;
}

export const AddressBadge: React.FC<AddressBadgeProps> = ({
  address,
  type = 'address',
  showCopy = true,
  showExplorer = true,
  label,
  className = '',
  head = 4,
  tail = 4,
}) => {
  const [copied, setCopied] = useState(false);
  const { network } = useNetwork();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (!address) return <span className="text-[#7E6D96] font-mono text-xs">None</span>;

  return (
    <div
      id={`address-badge-${address.slice(0, 8)}`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#670CDC]/25 bg-[#100126] text-[#EDE4FA] font-mono-nums text-xs ${className}`}
    >
      {label && <span className="text-[#7E6D96] mr-1 font-sans text-[11px]">{label}:</span>}
      <span title={address} className="tracking-tight text-[#EDE4FA]">
        {formatPubkey(address, head, tail)}
      </span>

      {showCopy && (
        <button
          id={`copy-btn-${address.slice(0, 6)}`}
          type="button"
          onClick={handleCopy}
          title="Copy full address"
          className="text-[#7E6D96] hover:text-[#EDE4FA] transition-colors p-0.5 rounded hover:bg-[#140130]"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
      )}

      {showExplorer && (
        <a
          id={`explorer-link-${address.slice(0, 6)}`}
          href={getExplorerUrl(address, type === 'tx' ? 'tx' : 'address', network)}
          target="_blank"
          rel="noopener noreferrer"
          title="View on Solana Explorer"
          className="text-[#7E6D96] hover:text-[#EDE4FA] transition-colors p-0.5 rounded hover:bg-[#140130]"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};
