import { configureChains, createConfig } from 'wagmi';
import { mainnet, sepolia, base, arbitrum, optimism, polygon } from 'wagmi/chains';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { InjectedConnector } from 'wagmi/connectors/injected';

const sonic = {
  id: 146,
  name: 'Sonic',
  network: 'sonic',
  nativeCurrency: {
    decimals: 18,
    name: 'Sonic',
    symbol: 'S',
  },
  rpcUrls: {
    public: { http: ['https://rpc.soniclabs.com'] },
    default: { http: ['https://rpc.soniclabs.com'] },
  },
  blockExplorers: {
    etherscan: { name: 'SonicScan', url: 'https://sonicscan.org' },
    default: { name: 'SonicScan', url: 'https://sonicscan.org' },
  },
} as const;

const chains = [mainnet, sepolia, base, arbitrum, optimism, polygon, sonic];

const { publicClient, webSocketPublicClient } = configureChains(chains, [
  jsonRpcProvider({
    rpc: (chain) => ({
      http: (() => {
        switch (chain.id) {
          case 11155111: // Sepolia
            return 'https://sepolia.publicnode.com';
          case 1: // Mainnet
            return 'https://eth.publicnode.com';
          case 8453: // Base
            return 'https://base.publicnode.com';
          case 42161: // Arbitrum
            return 'https://arbitrum.publicnode.com';
          case 10: // Optimism
            return 'https://optimism.publicnode.com';
          case 137: // Polygon
            return 'https://polygon.publicnode.com';
          case 146: // Sonic
            return 'https://rpc.soniclabs.com';
          default:
            return chain.rpcUrls.default.http[0];
        }
      })(),
    }),
  }),
]);

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({
      chains,
      options: {
        name: 'Browser Wallet',
        shimDisconnect: true,
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
});
