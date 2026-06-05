// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title DexToken
/// @notice Minimal ERC-20 used as part of the DEX system-under-test.
/// @dev Deliberately minimal — extends audited OpenZeppelin ERC20.
///      The engineering value of this repo is in the test architecture,
///      not this contract.
contract DexToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("Dex Token", "DEX") {
        _mint(msg.sender, initialSupply);
    }
}
