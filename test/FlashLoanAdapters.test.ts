import { describe, it, expect, beforeAll } from '@jest/globals';
import { ethers } from 'hardhat';

/**
 * Test Flash Loan Adapters on Sepolia
 */

describe('Flash Loan Adapters', () => {
  let aaveAdapter, uniswapV3Adapter, uniswapV4Adapter, canvasBlock;
  let deployer;

  beforeAll(async () => {
    const [signer] = await ethers.getSigners();
    deployer = signer;

    // Load deployed addresses (update with actual Sepolia deployment)
    const AAVE_ADAPTER = process.env.AAVE_FLASH_ADAPTER;
    const UNI_V3_ADAPTER = process.env.UNI_V3_FLASH_ADAPTER;
    const UNI_V4_ADAPTER = process.env.UNI_V4_FLASH_ADAPTER;
    const CANVAS_BLOCK = process.env.CANVAS_FLASH_LOAN_BLOCK;

    aaveAdapter = await ethers.getContractAt('AaveV3FlashLoanAdapter', AAVE_ADAPTER);
    uniswapV3Adapter = await ethers.getContractAt('UniswapV3FlashLoanAdapter', UNI_V3_ADAPTER);
    uniswapV4Adapter = await ethers.getContractAt('UniswapV4FlashLoanAdapter', UNI_V4_ADAPTER);
    canvasBlock = await ethers.getContractAt('CanvasFlashLoanBlock', CANVAS_BLOCK);
  });

  it('should verify Aave adapter is initialized', async () => {
    const name = await aaveAdapter.providerName();
    expect(name).toBe('Aave V3');
  });

  it('should verify Uniswap V3 adapter is initialized', async () => {
    const name = await uniswapV3Adapter.providerName();
    expect(name).toBe('Uniswap V3');
  });

  it('should verify Uniswap V4 adapter is initialized', async () => {
    const name = await uniswapV4Adapter.providerName();
    expect(name).toBe('Uniswap V4');
  });

  it('should get all adapters info from Canvas block', async () => {
    const [names, addresses, fees] = await canvasBlock.getAdaptersInfo();
    
    expect(names.length).toBe(3);
    expect(addresses.length).toBe(3);
    expect(fees.length).toBe(3);

    console.log('Adapters:');
    for (let i = 0; i < names.length; i++) {
      console.log(`  ${i + 1}. ${names[i]} - Fee: ${fees[i]} bps`);
    }
  });

  it('should verify Aave supports USDC', async () => {
    const USDC = '0x94a9D9AC8a22534E3FaCa9F88AbF5d1da0c4def8';
    const supports = await aaveAdapter.supportsToken(USDC);
    expect(supports).toBe(true);
  });

  it('should calculate Aave flash loan fee correctly', async () => {
    const USDC = '0x94a9D9AC8a22534E3FaCa9F88AbF5d1da0c4def8';
    const amount = ethers.parseUnits('1000', 6); // 1000 USDC (6 decimals)
    const fee = await aaveAdapter.getFlashLoanFee(USDC, amount);
    
    // Aave fee is 0.09% = 9 bps
    const expectedFee = amount * 9n / 10000n;
    expect(fee).toBe(expectedFee);
  });

  it('should verify Uniswap V3 has 0 flash loan fee', async () => {
    const mockToken = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'; // UNI
    const amount = ethers.parseUnits('100', 18);
    const fee = await uniswapV3Adapter.getFlashLoanFee(mockToken, amount);
    
    expect(fee).toBe(0n); // V3 has no fees!
  });

  it('should verify Uniswap V4 has 0 flash loan fee', async () => {
    const mockToken = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'; // UNI
    const amount = ethers.parseUnits('100', 18);
    const fee = await uniswapV4Adapter.getFlashLoanFee(mockToken, amount);
    
    expect(fee).toBe(0n); // V4 has no fees!
  });
});

describe('Canvas Flash Loan Block Integration', () => {
  let canvasBlock, registry;
  let deployer;

  beforeAll(async () => {
    const [signer] = await ethers.getSigners();
    deployer = signer;

    const CANVAS_BLOCK = process.env.CANVAS_FLASH_LOAN_BLOCK;
    const REGISTRY = process.env.FLASH_LOAN_REGISTRY;

    canvasBlock = await ethers.getContractAt('CanvasFlashLoanBlock', CANVAS_BLOCK);
    registry = await ethers.getContractAt('FlashLoanBlockRegistry', REGISTRY);
  });

  it('should list all blocks in registry', async () => {
    const blocks = await registry.listBlocks();
    console.log(`Found ${blocks.length} registered blocks`);
    
    for (const block of blocks) {
      console.log(`  - ${block.name} at ${block.blockAddress}`);
    }
  });

  it('should verify Canvas block is registered', async () => {
    const block = await registry.getBlock('CanvasFlashLoanBlock-Sepolia-v1');
    expect(block.active).toBe(true);
  });
});
