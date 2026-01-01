import { createDelegation, getDeleGatorEnvironment } from "@metamask/delegation-toolkit";
import { keccak256, encodePacked } from "viem";
class DelegationService {
    environment = getDeleGatorEnvironment(11155111);
    async createTokenDelegation(params) {
        const { delegator, delegate, token, amount } = params;
        const delegation = createDelegation({
            from: delegator,
            to: delegate,
            environment: this.environment,
            scope: {
                type: "erc20TransferAmount",
                tokenAddress: token,
                maxAmount: amount,
            },
        });
        const delegationHash = keccak256(encodePacked(["address", "address"], [delegation.delegator, delegation.delegate]));
        return {
            delegation,
            delegationHash,
        };
    }
    getDelegationManager() {
        return this.environment.DelegationManager;
    }
    getEnvironment() {
        return this.environment;
    }
}
export const delegationService = new DelegationService();
