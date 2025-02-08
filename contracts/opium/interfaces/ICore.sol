// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.28;

import "../libs/LibDerivative.sol";

interface ICore {
    function createAndMint(
        LibDerivative.Derivative calldata _derivative,
        uint256 _amount,
        address[2] calldata _positionsOwners
    ) external;
}
