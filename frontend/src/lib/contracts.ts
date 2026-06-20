export const BRICK3_CHAIN = {
  id: 11155111,
  name: 'sepolia',
} as const;

export const BRICK3_CONTRACTS = {
  PermissionManager: '0xB0A8d028064aB5F89F654721ed33355F6255b6ad',
  TreasuryManager: '0x80BAb75706EF084e8fF6343B68Ba5C2E0848F7eC',
  ProfitManager: '0xcC84e01F6dFcb4EA7f75199e26EB1183e227bBdD',
  ConditionManager: '0x0e8F432e0341811b85dbc532141b237BfB76174C',
  AaveFlashAdapter: '0x4c6d8Af4B09ba916f825465a979bC2e391F38cC5',
  UniV3Adapter: '0x91ee878A2E1ED815d31e80220e01B86f5981259B',
  FlashLoanManager: '0x622079697c5E7104e241765DF959983CF6F1Bcff',
  SwapManager: '0x2848C5149543966E20093D215f9f1413cAE31E5e',
  LendingManager: '0xC1ca3c8e09F34A6174f9dD5046e8eF0C4722784b',
  ActionExecutor: '0xbD90F87f181b672a2ee6Fd77AdBB52005770422C',
  StrategyRegistry: '0x2F9cd7eE7c722F52436c761564b5c65a69B1e617',
  SimulationHelper: '0x96a9AF45203EB366914F8411c5c42603c94D0819',
  SolverRegistry: '0xd3Cc1eDEDEaAd8Aa6DfDFAcE030D2ac5107A1755',
  IntentSettlement: '0x51e3067d5C912646bf79A98e653840f6C4aD2BAC',
  ERC7756QuicTransport: '0x88EE6c695d8f4b77625D1a44eEC43B55CaA3Aeb5',
  CrossChainIntentInbox: '0x7782DC69F8142eaa2635C210614DF6137BAdcF70',
  StrategyExecutorKernel: '0x2c0f410Aa11523EE935361Ac71947d74812145C4',
  BandleRouter: '0x9E47eF490e228cE3415C6a4BE05B94EC1AAd18c7',
  MockLendingAdapter: '0x5fEBfb9096f4EE02FEdc7eBB9CCF8061D95143Ee',
  AaveV3LendingAdapter: '0x00A4CE68b90D401ada897E0D87EB919F0859cb98',
  // Flash Loan Adapters - Deploy with scripts/deploy-flash-loan-adapters.js
  CanvasFlashLoanBlock: '0x0000000000000000000000000000000000000000', // UPDATE AFTER DEPLOY
  AaveV3FlashAdapter: '0x0000000000000000000000000000000000000000', // UPDATE AFTER DEPLOY
  UniswapV3FlashAdapter: '0x0000000000000000000000000000000000000000', // UPDATE AFTER DEPLOY
  UniswapV4FlashAdapter: '0x0000000000000000000000000000000000000000', // UPDATE AFTER DEPLOY
  FlashLoanBlockRegistry: '0x0000000000000000000000000000000000000000', // UPDATE AFTER DEPLOY
} as const;

export const solverRegistryAbi = [
  {
    type: 'function',
    name: 'getSolver',
    stateMutability: 'view',
    inputs: [{ internalType: 'address', name: 'solver', type: 'address' }],
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'stake', type: 'uint256' },
          { internalType: 'uint256', name: 'kineticScore', type: 'uint256' },
          { internalType: 'bytes32', name: 'endpointHash', type: 'bytes32' },
          { internalType: 'bool', name: 'active', type: 'bool' },
          { internalType: 'uint256', name: 'registeredAt', type: 'uint256' },
          { internalType: 'uint256', name: 'lastHeartbeat', type: 'uint256' },
        ],
        internalType: 'struct SolverRegistry.SolverInfo',
        name: '',
        type: 'tuple',
      },
    ],
  },
  {
    type: 'function',
    name: 'isEligible',
    stateMutability: 'view',
    inputs: [
      { internalType: 'address', name: 'solver', type: 'address' },
      { internalType: 'uint256', name: 'minScore', type: 'uint256' },
      { internalType: 'uint256', name: 'minStake', type: 'uint256' },
    ],
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
  },
  {
    type: 'event',
    name: 'SolverRegistered',
    inputs: [
      { indexed: true, internalType: 'address', name: 'solver', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'stake', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'kineticScore', type: 'uint256' },
      { indexed: false, internalType: 'bytes32', name: 'endpointHash', type: 'bytes32' },
    ],
    anonymous: false,
  },
] as const;

export const bandleRouterAbi = [
  {
    type: 'function',
    name: 'simulateStrategy',
    stateMutability: 'view',
    inputs: [
      { internalType: 'uint256', name: 'expectedOut', type: 'uint256' },
      { internalType: 'uint256', name: 'debt', type: 'uint256' },
      { internalType: 'uint256', name: 'flashFee', type: 'uint256' },
      { internalType: 'uint256', name: 'gasCost', type: 'uint256' },
      { internalType: 'uint256', name: 'platformFee', type: 'uint256' },
    ],
    outputs: [{ internalType: 'int256', name: '', type: 'int256' }],
  },
  {
    type: 'function',
    name: 'executeStrategy',
    stateMutability: 'nonpayable',
    inputs: [
      {
        internalType: 'tuple[]',
        name: 'actions',
        type: 'tuple[]',
        components: [
          { internalType: 'uint8', name: 'actionType', type: 'uint8' },
          { internalType: 'bytes', name: 'params', type: 'bytes' },
        ],
      },
      { internalType: 'uint256', name: 'minProfitWei', type: 'uint256' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
      { internalType: 'bytes32', name: 'strategyHash', type: 'bytes32' },
    ],
    outputs: [
      { internalType: 'int256', name: 'netProfitWei', type: 'int256' },
      { internalType: 'uint256', name: 'platformFeeWei', type: 'uint256' },
    ],
  },
] as const;

export const strategyRegistryAbi = [
  {
    type: 'function',
    name: 'registerStrategy',
    stateMutability: 'nonpayable',
    inputs: [
      { internalType: 'bytes32', name: 'strategyHash', type: 'bytes32' },
      { internalType: 'string', name: 'uri', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'markUsed',
    stateMutability: 'nonpayable',
    inputs: [{ internalType: 'bytes32', name: 'strategyHash', type: 'bytes32' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getCreator',
    stateMutability: 'view',
    inputs: [{ internalType: 'bytes32', name: 'strategyHash', type: 'bytes32' }],
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
  },
] as const;

export const quicTransportAbi = [
  {
    type: 'function',
    name: 'registerEndpoint',
    stateMutability: 'nonpayable',
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'quicAddr', type: 'string' },
      { internalType: 'bytes', name: 'publicKey', type: 'bytes' },
      { internalType: 'bool', name: 'kernelBypass', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'event',
    name: 'EndpointRegistered',
    inputs: [
      { indexed: true, internalType: 'address', name: 'operator', type: 'address' },
      { indexed: false, internalType: 'string', name: 'name', type: 'string' },
      { indexed: false, internalType: 'string', name: 'quicAddr', type: 'string' },
      { indexed: false, internalType: 'bytes', name: 'publicKey', type: 'bytes' },
      { indexed: false, internalType: 'bool', name: 'kernelBypass', type: 'bool' },
    ],
    anonymous: false,
  },
] as const;

// ============================================
// FLASH LOAN ADAPTER ABIs
// ============================================

export const canvasFlashLoanBlockAbi = [
  {
    type: 'function',
    name: 'executeFlashLoanStrategy',
    stateMutability: 'nonpayable',
    inputs: [
      { internalType: 'string', name: 'providerName', type: 'string' },
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'minProfit', type: 'uint256' },
      { internalType: 'bytes', name: 'arbitrageData', type: 'bytes' },
      { internalType: 'address', name: 'strategyExecutor', type: 'address' },
    ],
    outputs: [
      { internalType: 'uint256', name: 'profit', type: 'uint256' },
      { internalType: 'bool', name: 'success', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'getAdaptersInfo',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { internalType: 'string[]', name: 'names', type: 'string[]' },
      { internalType: 'address[]', name: 'addresses', type: 'address[]' },
      { internalType: 'uint256[]', name: 'fees', type: 'uint256[]' },
    ],
  },
  {
    type: 'event',
    name: 'FlashLoanBlockExecuted',
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'strategyId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'adapter', type: 'address' },
      { indexed: true, internalType: 'address', name: 'token', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'profit', type: 'uint256' },
      { indexed: false, internalType: 'bool', name: 'success', type: 'bool' },
    ],
    anonymous: false,
  },
] as const;

export const flashLoanAdapterBaseAbi = [
  {
    type: 'function',
    name: 'executeFlashLoan',
    stateMutability: 'nonpayable',
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    outputs: [
      {
        components: [
          { internalType: 'bool', name: 'success', type: 'bool' },
          { internalType: 'uint256', name: 'amountBorrowed', type: 'uint256' },
          { internalType: 'uint256', name: 'feePaid', type: 'uint256' },
          { internalType: 'bytes', name: 'callbackReturn', type: 'bytes' },
          { internalType: 'string', name: 'errorReason', type: 'string' },
        ],
        internalType: 'struct FlashLoanAdapterBase.FlashLoanResult',
        name: '',
        type: 'tuple',
      },
    ],
  },
  {
    type: 'function',
    name: 'getFlashLoanFee',
    stateMutability: 'view',
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'supportsToken',
    stateMutability: 'view',
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'providerName',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
  },
  {
    type: 'event',
    name: 'FlashLoanInitiated',
    inputs: [
      { indexed: true, internalType: 'address', name: 'token', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'fee', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'borrower', type: 'address' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'FlashLoanCompleted',
    inputs: [
      { indexed: true, internalType: 'address', name: 'token', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'fee', type: 'uint256' },
      { indexed: false, internalType: 'bool', name: 'success', type: 'bool' },
    ],
    anonymous: false,
  },
] as const;
