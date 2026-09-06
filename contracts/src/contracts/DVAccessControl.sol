// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";

/**
 * @title DVAccessControl
 * @notice Standalone on-chain role registry for DecentraVault.
 *         Defines all roles used across the system.
 *         Not upgradeable — role semantics must be stable.
 */
contract DVAccessControl is AccessControlEnumerable {
    bytes32 public constant ADMIN_ROLE    = keccak256("ADMIN_ROLE");
    bytes32 public constant MANAGER_ROLE  = keccak256("MANAGER_ROLE");
    bytes32 public constant AUDITOR_ROLE  = keccak256("AUDITOR_ROLE");
    bytes32 public constant USER_ROLE     = keccak256("USER_ROLE");
    bytes32 public constant BACKEND_ROLE  = keccak256("BACKEND_ROLE");

    event ContractInitialized(address indexed admin, uint256 timestamp);

    constructor(address admin) {
        require(admin != address(0), "DVAccessControl: zero address");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(BACKEND_ROLE, admin);
        emit ContractInitialized(admin, block.timestamp);
    }

    /**
     * @notice Check if address has admin-level access
     */
    function isAdmin(address account) external view returns (bool) {
        return hasRole(ADMIN_ROLE, account);
    }

    /**
     * @notice Check if address has manager-level access
     */
    function isManager(address account) external view returns (bool) {
        return hasRole(MANAGER_ROLE, account);
    }
}
