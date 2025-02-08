// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { IOrderMixin } from "@1inch/limit-order-protocol-contract/contracts/interfaces/IOrderMixin.sol";
import { ITakerInteraction } from "@1inch/limit-order-protocol-contract/contracts/interfaces/ITakerInteraction.sol";

import { Address, AddressLib } from "@1inch/solidity-utils/contracts/libraries/AddressLib.sol";

import { LibDerivative } from "./opium/libs/LibDerivative.sol";
import { ICore } from "./opium/interfaces/ICore.sol";

contract Arbitrage is ITakerInteraction {
    using AddressLib for Address;

    error FailedExternalCall(bytes reason);

    address public constant LOP = 0x111111125421cA6dc452d289314280a0f8842A65;
    
    address public constant OPIUM_TOKEN_SPENDER = 0x0A9A6CD7485Dd77c6cec28FB1bd64D5969B79132;
    ICore public constant OPIUM_CORE = ICore(0x1497A23a2abC0DAFFb8e333183cfC181b24bB570);

    constructor() {}

    function create(
        bytes memory _calldata
    ) external {
        (bool success, bytes memory reason) = LOP.call(_calldata);
        if (!success) revert FailedExternalCall(reason);
    }

    /**
     * @dev This callback allows to interactively handle maker aseets to produce takers assets, doesn't supports ETH as taker assets
     * @notice Callback method that gets called after maker fund transfer but before taker fund transfer
     * @param order Order being processed
     * @param extension Order extension data
     * @param orderHash Hash of the order being processed
     * @param taker Taker address
     * @param makingAmount Actual making amount
     * @param takingAmount Actual taking amount
     * @param remainingMakingAmount Order remaining making amount
     * @param extraData Extra data
     */
    function takerInteraction(
        IOrderMixin.Order calldata order,
        bytes calldata extension,
        bytes32 orderHash,
        address taker,
        uint256 makingAmount,
        uint256 takingAmount,
        uint256 remainingMakingAmount,
        bytes calldata extraData
    ) external {
        bytes1 cmd = bytes1(extraData[0:]); // 1 byte

        // Check if filling right order
        if (cmd != 0xff) {
            (bool success, bytes memory reason) = LOP.call(extraData);
            if (!success) revert FailedExternalCall(reason);
        } else {
            // Otherwise create positions
            (LibDerivative.Derivative memory derivative) = abi.decode(extraData[1:], (LibDerivative.Derivative));

            ERC20(derivative.token).approve(OPIUM_TOKEN_SPENDER, type(uint256).max);
            OPIUM_CORE.createAndMint(
                derivative,
                takingAmount,
                [address(this), address(this)]
            );
            uint256 remainingBalance = ERC20(derivative.token).balanceOf(address(this));
            if (remainingBalance > 0) {
                ERC20(derivative.token).transfer(tx.origin, remainingBalance);
            }
        }
        ERC20(order.takerAsset.get()).approve(LOP, type(uint256).max); 
    }
}
