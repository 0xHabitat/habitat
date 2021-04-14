// SPDX-License-Identifier: MPL-2.0
pragma solidity >=0.6.2;

import '@NutBerry/rollup-bricks/src/tsm/contracts/RollupUtils.sol';

contract UpgradableRollup is RollupUtils {
  fallback () external payable {
    assembly {
      calldatacopy(returndatasize(), returndatasize(), calldatasize())
      // keep a copy to be used after the call
      let zero := returndatasize()
      let success := delegatecall(
        gas(),
        sload(not(returndatasize())),
        returndatasize(),
        calldatasize(),
        returndatasize(),
        returndatasize()
      )

      returndatacopy(zero, zero, returndatasize())

      if iszero(iszero(success)) {
        return(zero, returndatasize())
      }
      revert(zero, returndatasize())
    }
  }

  /// @notice Returns the address who is in charge of changing the rollup implementation.
  function ROLLUP_MANAGER () public virtual view returns (address) {
  }

  /// @notice Upgrades the implementation.
  function upgradeRollup (address newImplementation) external {
    require(msg.sender == ROLLUP_MANAGER());
    assembly {
      sstore(not(returndatasize()), newImplementation)
    }
    emit RollupUtils.RollupUpgrade(newImplementation);
  }
}