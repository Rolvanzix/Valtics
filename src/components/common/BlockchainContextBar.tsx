import React from 'react';

export interface BlockchainAddressItem {
  label: string;
  address: string;
  type?: 'address' | 'tx';
}

interface BlockchainContextBarProps {
  screenTitle?: string;
  addresses?: BlockchainAddressItem[];
  compact?: boolean;
  className?: string;
}

export const BlockchainContextBar: React.FC<BlockchainContextBarProps> = () => {
  return null;
};
