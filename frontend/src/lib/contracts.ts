export const BRICK3_CHAIN = {
  id: 11155111,
  name: 'sepolia',
} as const;


export const BRICK3_CONTRACTS = {
  PermissionManager: '0x618A13a1dE79cde892a1cA5B3FC24D4AA66b718D',
  TreasuryManager: '0x6aa9645bc2083D623134D50bd86a2B354e8Bb1D3',
  ProfitManager: '0x6e44B6d48AFe3123C9906E9959f1C7C5A21f5e80',
  ConditionManager: '0x5E9714A6D073B4F53C40f636421aE95226753AF1',
  AaveFlashAdapter: '0x0f840e0DeA1c11b2aB35A8f18A3ab4ac47cF5262',
  UniV3Adapter: '0x3eD1013d060401fA6435cfd6a96cb6cD4BFCc6c0',
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
  StrategyExecutorKernel: '0x40021c19a16d2Ca7640D0B93A487023F9f6250B2',
  BandleRouter: '0x2266Fed2f61508dA465AdaF98c194A5b3DEcc074',
  MockLendingAdapter: '0x5fEBfb9096f4EE02FEdc7eBB9CCF8061D95143Ee',
  AaveV3LendingAdapter: '0x4a4AbC511067Ba3fD9FA32875D19B8b96Ff45eA5',
  CanvasFlashLoanBlock: '0x0000000000000000000000000000000000000000',
  AaveV3FlashAdapter: '0x0000000000000000000000000000000000000000',
  UniswapV3FlashAdapter: '0x0000000000000000000000000000000000000000',
  UniswapV4FlashAdapter: '0x0000000000000000000000000000000000000000',
  FlashLoanBlockRegistry: '0x0000000000000000000000000000000000000000',
  UniV3AdapterMockSwap: '0x0000000000000000000000000000000000000000',
  SushiSwapAdapter: '0x0000000000000000000000000000000000000000',
  BalancerAdapter: '0x0000000000000000000000000000000000000000',
  CurveAdapter: '0x0000000000000000000000000000000000000000',
  MorphoAdapter: '0x0000000000000000000000000000000000000000',
  DyDxFlashAdapter: '0x0000000000000000000000000000000000000000',
  LidoAdapter: '0x0000000000000000000000000000000000000000',
  CowSwapAdapter: '0x0000000000000000000000000000000000000000',
} as const;

export type Brick3Contracts = {
  [K in keyof typeof BRICK3_CONTRACTS]: string;
};

export const BRICK3_CONTRACTS_BY_CHAIN: Record<number, Brick3Contracts> = {
  // Sepolia (11155111)
  11155111: {
    PermissionManager: "0xB0A8d028064aB5F89F654721ed33355F6255b6ad",
    TreasuryManager: "0x80BAb75706EF084e8fF6343B68Ba5C2E0848F7eC",
    ProfitManager: "0xcC84e01F6dFcb4EA7f75199e26EB1183e227bBdD",
    ConditionManager: "0x0e8F432e0341811b85dbc532141b237BfB76174C",
    AaveFlashAdapter: "0x4c6d8Af4B09ba916f825465a979bC2e391F38cC5",
    UniV3Adapter: "0x91ee878A2E1ED815d31e80220e01B86f5981259B",
    AaveV3LendingAdapter: "0x00A4CE68b90D401ada897E0D87EB919F0859cb98",
    FlashLoanManager: "0x622079697c5E7104e241765DF959983CF6F1Bcff",
    SwapManager: "0x2848C5149543966E20093D215f9f1413cAE31E5e",
    LendingManager: "0xC1ca3c8e09F34A6174f9dD5046e8eF0C4722784b",
    ActionExecutor: "0xbD90F87f181b672a2ee6Fd77AdBB52005770422C",
    StrategyRegistry: "0x2F9cd7eE7c722F52436c761564b5c65a69B1e617",
    SimulationHelper: "0x96a9AF45203EB366914F8411c5c42603c94D0819",
    SolverRegistry: "0xd3Cc1eDEDEaAd8Aa6DfDFAcE030D2ac5107A1755",
    IntentSettlement: "0x51e3067d5C912646bf79A98e653840f6C4aD2BAC",
    ERC7756QuicTransport: "0x88EE6c695d8f4b77625D1a44eEC43B55CaA3Aeb5",
    CrossChainIntentInbox: "0x7782DC69F8142eaa2635C210614DF6137BAdcF70",
    StrategyExecutorKernel: "0x2c0f410Aa11523EE935361Ac71947d74812145C4",
    BandleRouter: "0x9E47eF490e228cE3415C6a4BE05B94EC1AAd18c7",
    MockLendingAdapter: "0x0000000000000000000000000000000000000000",
    CanvasFlashLoanBlock: "0x0000000000000000000000000000000000000000",
    AaveV3FlashAdapter: "0x0000000000000000000000000000000000000000",
    UniswapV3FlashAdapter: "0x0000000000000000000000000000000000000000",
    UniswapV4FlashAdapter: "0x0000000000000000000000000000000000000000",
    FlashLoanBlockRegistry: "0x0000000000000000000000000000000000000000",
    UniV3AdapterMockSwap: "0x0000000000000000000000000000000000000000",
    SushiSwapAdapter: "0x0000000000000000000000000000000000000000",
    BalancerAdapter: "0x0000000000000000000000000000000000000000",
    CurveAdapter: "0x0000000000000000000000000000000000000000",
    MorphoAdapter: "0x0000000000000000000000000000000000000000",
    DyDxFlashAdapter: "0x0000000000000000000000000000000000000000",
    LidoAdapter: "0x0000000000000000000000000000000000000000",
    CowSwapAdapter: "0x0000000000000000000000000000000000000000",
  },
  // Base Mainnet (8453)
  8453: {
    PermissionManager: "0x618A13a1dE79cde892a1cA5B3FC24D4AA66b718D",
    TreasuryManager: "0x6aa9645bc2083D623134D50bd86a2B354e8Bb1D3",
    ProfitManager: "0x6e44B6d48AFe3123C9906E9959f1C7C5A21f5e80",
    ConditionManager: "0x5E9714A6D073B4F53C40f636421aE95226753AF1",
    AaveFlashAdapter: "0x0f840e0DeA1c11b2aB35A8f18A3ab4ac47cF5262",
    UniV3Adapter: "0x3eD1013d060401fA6435cfd6a96cb6cD4BFCc6c0",
    AaveV3LendingAdapter: "0x4a4AbC511067Ba3fD9FA32875D19B8b96Ff45eA5",
    FlashLoanManager: "0xdd345972941c3acfAEFf6b14FA20b4Eea3c32F76",
    SwapManager: "0xE0C701bDc519BCfB0C36B1fFbAf44308A3D0672c",
    LendingManager: "0x75f433A440Ec08EB3188532977aEcD0f7554D1a3",
    ActionExecutor: "0xd190A715Ee25bfd2Ebfc19292A3d1c0544c6EA28",
    StrategyRegistry: "0xF30f02c6b2bb2D2345C72cCD759F56B8e924D8b1",
    SimulationHelper: "0x80EF502f3CDC6bE44c77b4DBCF9c0B347eE036eB",
    SolverRegistry: "0x1Cf2f897AfDF98688bEdC15EB4e3AaE2eDFCD164",
    IntentSettlement: "0xC8a378BD783aDFD0D745CbC76341c5DB97cF9B55",
    ERC7756QuicTransport: "0x463D733832cBD497C29a0521ad3030a19f64f712",
    CrossChainIntentInbox: "0x3315f6233351f20Aa333d92a5f1b3B255471EB08",
    StrategyExecutorKernel: "0x40021c19a16d2Ca7640D0B93A487023F9f6250B2",
    BandleRouter: "0x2266Fed2f61508dA465AdaF98c194A5b3DEcc074",
    MockLendingAdapter: "0x5fEBfb9096f4EE02FEdc7eBB9CCF8061D95143Ee",
    CanvasFlashLoanBlock: "0x0000000000000000000000000000000000000000",
    AaveV3FlashAdapter: "0x0000000000000000000000000000000000000000",
    UniswapV3FlashAdapter: "0x0000000000000000000000000000000000000000",
    UniswapV4FlashAdapter: "0x0000000000000000000000000000000000000000",
    FlashLoanBlockRegistry: "0x0000000000000000000000000000000000000000",
    UniV3AdapterMockSwap: "0x0000000000000000000000000000000000000000",
    SushiSwapAdapter: "0x38d0c7563D9bD718a3430816E78D862ce01DBB82",
    BalancerAdapter: "0xab2c8Bed7D880f562Fd23fbeeff8e21bF8545882",
    CurveAdapter: "0xA89c21d602E57323Fc63c86df643E422b8aFE5F0",
    MorphoAdapter: "0x239611B17C78D0A6dED41161a73ed076f089b35e",
    DyDxFlashAdapter: "0x4966146B31bbcFAe81B78Fa2FF347b3817db341d",
    LidoAdapter: "0x5A7d58A02E206a98631C64115775E983084FB88E",
    CowSwapAdapter: "0x0cc4261E43f35432F4458d9D11bE0b00669De8B3",
  },
  // Sonic Mainnet (146)
  146: {
    PermissionManager: "0x612b1D28bD19AD4d9738F152836538BF239d256a",
    TreasuryManager: "0x9b9F98F769A28dE7DA277A1257977895aab501dd",
    ProfitManager: "0x14d8aAb378316549E870BB03497B3A0592Ad5aA5",
    ConditionManager: "0xcc90033c767Be97228dBec26b215F5b86e332933",
    AaveFlashAdapter: "0x78A326Cb86512Be28CBCcFD4FEe2995d21d770Fd",
    UniV3Adapter: "0x82b31D1B4876c138d5d6198d38CA31164621DF98",
    AaveV3LendingAdapter: "0xaC676f1d752C2354F347ed72A73164042b3E4E38",
    FlashLoanManager: "0x79DC4cc775cE0B3DF86E5C204Fbd3D843F0c2787",
    SwapManager: "0x5B57B2cc852096106314867349F0a16c40098B93",
    LendingManager: "0x7316562A1d68823337023b93E8ddb42F1Ed0C74b",
    ActionExecutor: "0x2eFC29c41A9E185D8e69888c9eF45E208925D78C",
    StrategyRegistry: "0x1C2E4b9e80799Dd7E92d43fF9774A0fE79428D02",
    SimulationHelper: "0xC8f896683574Ad3bad8151Ab97A0080aFc7Fb41b",
    SolverRegistry: "0x73affA426711A2281215B2e0d8be1F82c4E33839",
    IntentSettlement: "0x67D445f5bAE4754345de4C56647699518F42EA7C",
    ERC7756QuicTransport: "0xA720561A37022f5021AF460bE96006F0D7A0e359",
    CrossChainIntentInbox: "0xFA2F7d335C73e64B056B5a3dc0A145d4522DA872",
    StrategyExecutorKernel: "0x020a7cA6133f4E6f89b4D32865Dc0C9DD6086756",
    BandleRouter: "0xaee02D25feC9110Dda511631513dce51B1929A91",
    MockLendingAdapter: "0xfE82C447300F39178938c410A6f621C3207aAc18",
    CanvasFlashLoanBlock: "0x0000000000000000000000000000000000000000",
    AaveV3FlashAdapter: "0x0000000000000000000000000000000000000000",
    UniswapV3FlashAdapter: "0x0000000000000000000000000000000000000000",
    UniswapV4FlashAdapter: "0x0000000000000000000000000000000000000000",
    FlashLoanBlockRegistry: "0x0000000000000000000000000000000000000000",
    UniV3AdapterMockSwap: "0xFFe20bDEd13A34470699ee87bbfEEd03Be73dc25",
    SushiSwapAdapter: "0x212fAd20b2A9Ff051f9Ee75272aB45494fa2e4B8",
    BalancerAdapter: "0x1AfafC3187cD6f7A11aef0D1269f95D112A3FBA1",
    CurveAdapter: "0x2459E6Efa2Db586f86cB02BbA4F443E4a58D03b3",
    MorphoAdapter: "0xdc085e8144fbb4548c3C3D7b9113D2f18C3fF32B",
    DyDxFlashAdapter: "0xEB667E25cDaab772017564cE74aa9A87E850da49",
    LidoAdapter: "0xc40D865191c505194B73d2b68CA6DC09747d2111",
    CowSwapAdapter: "0x5FcD961CD156eEF0A6E1b2F3Bf6a8F1B5aA9ec5C",
  }
};

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
      { internalType: 'address[]', name: 'sweepTokens', type: 'address[]' },
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
