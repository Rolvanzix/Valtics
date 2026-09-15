export function formatPubkey(key: string | null | undefined, head = 4, tail = 4): string {
  if (!key) return '';
  if (key.length <= head + tail + 2) return key;
  return `${key.slice(0, head)}...${key.slice(-tail)}`;
}

export function formatCurrency(
  value: number | string | null | undefined,
  currency = 'USD',
  maxDecimals = 2
): string {
  if (value === null || value === undefined) return '$0.00';
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return '$0.00';

  if (currency === 'USD') {
    if (num > 0 && num < 0.0001) {
      return `$${num.toExponential(4)}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: num >= 1 ? 2 : Math.min(6, maxDecimals),
      maximumFractionDigits: num >= 1 ? 2 : Math.min(6, maxDecimals),
    }).format(num);
  }

  if (currency === 'SOL') {
    return `${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })} SOL`;
  }

  return `${num.toLocaleString('en-US', {
    maximumFractionDigits: maxDecimals,
  })} ${currency}`;
}

export function formatNumber(
  value: number | string | null | undefined,
  decimals = 0
): string {
  if (value === null || value === undefined) return '0';
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatBps(bps: number | null | undefined): string {
  if (bps === null || bps === undefined) return '0.00%';
  return `${(bps / 100).toFixed(2)}%`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatRelativeTime(timestampMs: number): string {
  const diff = Date.now() - timestampMs;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
