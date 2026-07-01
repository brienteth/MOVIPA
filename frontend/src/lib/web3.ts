import { configureChains, createConfig } from 'wagmi';
import { mainnet, sepolia, base, arbitrum, optimism, polygon } from 'wagmi/chains';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { ethers } from 'ethers';

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

export const getOpacusWalletAddress = (ownerAddress: string): string => {
  if (!ownerAddress) return "0x40021c19a16d2Ca7640D0B93A487023F9f6250B2";
  try {
    const factoryAddress = ethers.getAddress("0x026E35ae1FB5458e7332056793f1814A58a687b6".toLowerCase());
    const ownerAddr = ethers.getAddress(ownerAddress.toLowerCase());
    const salt = ethers.keccak256(ethers.solidityPacked(['address'], [ownerAddr]));
    const initCodeHash = "0x14492522cee743e41fc1b1030e684300cf96578fc2a17fdcb47008175442f753";
    const create2Inputs = ethers.solidityPacked(
      ['bytes1', 'address', 'bytes32', 'bytes32'],
      ['0xff', factoryAddress, salt, initCodeHash]
    );
    const hash = ethers.keccak256(create2Inputs);
    return ethers.getAddress("0x" + hash.slice(-40));
  } catch (e) {
    console.error("CREATE2 address derivation error:", e);
    return "0x40021c19a16d2Ca7640D0B93A487023F9f6250B2";
  }
};
