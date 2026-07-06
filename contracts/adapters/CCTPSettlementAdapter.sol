// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ILendingAdapter} from "../src/interfaces/ILendingAdapter.sol";

interface ITokenMessenger {
    function depositForBurn(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken
    ) external returns (uint64 nonce);
}

/**
 * @title CCTPSettlementAdapter
 * @dev ILendingAdapter implementation that routes USDC payouts to EVM or Stellar via Circle CCTP
 */
contract CCTPSettlementAdapter is ILendingAdapter, Ownable {
    address public tokenMessenger;
    address public usdc;
    address public kernel;

    event CCTPSettlementExecuted(
        address indexed kernel,
        uint256 amount,
        uint32 indexed destinationDomain,
        bytes32 indexed mintRecipient,
        uint64 nonce
    );

    constructor(address _tokenMessenger, address _usdc, address _kernel) Ownable(msg.sender) {
        require(_tokenMessenger != address(0), "tokenMessenger = 0");
        require(_usdc != address(0), "usdc = 0");
        require(_kernel != address(0), "kernel = 0");
        tokenMessenger = _tokenMessenger;
        usdc = _usdc;
        kernel = _kernel;
    }

    function setTokenMessenger(address _tokenMessenger) external onlyOwner {
        require(_tokenMessenger != address(0), "tokenMessenger = 0");
        tokenMessenger = _tokenMessenger;
    }

    function setKernel(address _kernel) external onlyOwner {
        require(_kernel != address(0), "kernel = 0");
        kernel = _kernel;
    }

    function deposit(address asset, uint256 amount, bytes calldata extraData) external override {
        require(asset == usdc, "CCTP only supports USDC");
        require(extraData.length >= 64, "extraData must contain domain + recipient");

        // Parse extraData: (uint32 destinationDomain, bytes32 mintRecipient)
        (uint32 destinationDomain, bytes32 mintRecipient) = abi.decode(extraData, (uint32, bytes32));

        uint256 actualAmount = amount;
        if (actualAmount == 0) {
            actualAmount = IERC20(usdc).balanceOf(kernel);
        }
        require(actualAmount > 0, "Amount must be > 0");

        // Pull USDC from kernel
        IERC20(usdc).transferFrom(kernel, address(this), actualAmount);

        // Approve TokenMessenger
        IERC20(usdc).approve(tokenMessenger, actualAmount);

        // Trigger CCTP Burn
        uint64 nonce = ITokenMessenger(tokenMessenger).depositForBurn(
            actualAmount,
            destinationDomain,
            mintRecipient,
            usdc
        );

        emit CCTPSettlementExecuted(kernel, actualAmount, destinationDomain, mintRecipient, nonce);
    }

    // Unused interface requirements
    function withdraw(address, uint256, bytes calldata) external override pure {
        revert("withdraw not supported");
    }

    function borrow(address, uint256, bytes calldata) external override pure {
        revert("borrow not supported");
    }

    function repay(address, uint256, bytes calldata) external override pure {
        revert("repay not supported");
    }
}
