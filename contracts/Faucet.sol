// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MockERC20 is ERC20, Ownable, ERC20Permit {
    constructor()
        ERC20("ETH Global Wrapped Ethereum", "WETH")
        Ownable(msg.sender)
        ERC20Permit("ETH Global Wrapped Ethereum")
    {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

contract Faucet {
    MockERC20 token;

    constructor() {
        token = new MockERC20();
    }

    function claim() external {
        token.mint(msg.sender, 10 ether);
    }
}
