import React, { useState } from 'react';

interface WalletConnectProps {
  onConnect: (connected: boolean) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('0');

  const connectWallet = async () => {
    try {
      // Check if MetaMask is installed
      if (!(window as any).ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      // Request account access
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];

      setAddress(account);
      setIsConnected(true);
      onConnect(true);

      // Get balance (placeholder)
      setBalance('1.234');

    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress('');
    setBalance('0');
    onConnect(false);
  };

  if (!isConnected) {
    return (
      <button
        onClick={connectWallet}
        className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
      >
        Sign In
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="text-right">
        <div className="text-sm text-gray-300">
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <div className="text-xs text-gray-500">
          {balance} ETH
        </div>
      </div>
      <button
        onClick={disconnectWallet}
        className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
};

export default WalletConnect;