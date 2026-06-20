export const BRICK3_CHAIN = {
  id: 11155111,
  name: 'sepolia',
} as const;

export const BRICK3_CONTRACTS = {
  PermissionManager: '0x618A13a1dE79cde892a1cA5B3FC24D4AA66b718D',
  TreasuryManager: '0x4Cd07043D8411A29DCe3fAFa1Aa89E67D74c184B',
  ProfitManager: '0x6e44B6d48AFe3123C9906E9959f1C7C5A21f5e80',
  ConditionManager: '0x5E9714A6D073B4F53C40f636421aE95226753AF1',
  AaveFlashAdapter: '0x0f840e0DeA1c11b2aB35A8f18A3ab4ac47cF5262',
  UniV3Adapter: '0x68Fcae27158aC9464CB54A51c6F0A2A427eb2B36',
  FlashLoanManager: '0xdd345972941c3acfAEFf6b14FA20b4Eea3c32F76',
  SwapManager: '0xE0C701bDc519BCfB0C36B1fFbAf44308A3D0672c',
  LendingManager: '0x75f433A440Ec08EB3188532977aEcD0f7554D1a3',
  ActionExecutor: '0xd190A715Ee25bfd2Ebfc19292A3d1c0544c6EA28',
  StrategyRegistry: '0xF30f02c6b2bb2D2345C72cCD759F56B8e924D8b1',
  SimulationHelper: '0x80EF502f3CDC6bE44c77b4DBCF9c0B347eE036eB',
  SolverRegistry: '0x1Cf2f897AfDF98688bEdC15EB4e3AaE2eDFCD164',
  IntentSettlement: '0xC8a378BD783aDFD0D745CbC76341c5DB97cF9B55',
  ERC7756QuicTransport: '0x463D733832cBD497C29a0521ad3030a19f64f712',
  CrossChainIntentInbox: '0x3315f6233351f20Aa333d92a5f1b3B255471EB08',
  StrategyExecutorKernel: '0x18C1d2974D512bEbE2b3bE36375B62f5eb1C38E2',
  BandleRouter: '0x09Bee01F41D36B40e4eB86c4557D1f572949d516',
  MockLendingAdapter: '0x5fEBfb9096f4EE02FEdc7eBB9CCF8061D95143Ee',
  AaveV3LendingAdapter: '0x180A97d63681013aDd660901f06d0230368AFd53',
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
