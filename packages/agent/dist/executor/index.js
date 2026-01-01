import { privateKeyToAccount } from "viem/accounts";
import { decrypt } from "../utils/crypto.js";
import { toMetaMaskSmartAccount, Implementation, ExecutionMode, } from "@metamask/smart-accounts-kit";
import { http, encodeFunctionData, concat, encodePacked, createPublicClient } from "viem";
import { createSmartAccountClient } from "permissionless";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { entryPoint07Address } from "viem/account-abstraction";
import { sepolia } from "viem/chains";
export class Executor {
    async executeAdapter(input) {
        const { userAddress, adapter, session, installedAdapterData, runtimeParams, permissionDelegationData, } = input;
        console.log(`\n=== Executing adapter ${adapter.id} for ${userAddress} ===`);
        const privateKey = decrypt(session.encryptedPrivateKey);
        const account = privateKeyToAccount(privateKey);
        const publicClient = createPublicClient({
            chain: sepolia,
            transport: http(process.env.RPC_URL),
        });
        const smartAccount = await toMetaMaskSmartAccount({
            client: publicClient,
            implementation: Implementation.Hybrid,
            deployParams: session.deployParams,
            deploySalt: "0x",
            signer: { account },
        });
        console.log("Smart account address:", smartAccount.address);
        const adapterContext = {
            userAddress,
            config: installedAdapterData.config,
            permissionData: permissionDelegationData,
            runtimeParams,
        };
        const proposedTx = await adapter.proposeTransaction(adapterContext);
        if (!proposedTx) {
            return {
                success: true,
                decision: "ALLOW",
                reason: "No transaction required",
            };
        }
        console.log(`Proposed: ${proposedTx.description}`);
        // Encode execution call data
        const executionEncoded = concat([
            proposedTx.target,
            encodePacked(["uint256"], [proposedTx.value || 0n]),
            proposedTx.callData,
        ]);
        const redeemCallData = encodeFunctionData({
            abi: [
                {
                    name: "redeemDelegations",
                    type: "function",
                    stateMutability: "payable",
                    inputs: [
                        { name: "permissionsContexts", type: "bytes[]" },
                        { name: "modes", type: "bytes32[]" },
                        { name: "executionCallDatas", type: "bytes[]" },
                    ],
                    outputs: [],
                },
            ],
            functionName: "redeemDelegations",
            args: [
                [permissionDelegationData.context],
                [ExecutionMode.SingleDefault],
                [executionEncoded],
            ],
        });
        // Pimlico client
        const pimlicoClient = createPimlicoClient({
            chain: sepolia,
            transport: http(process.env.BUNDLER_URL),
            entryPoint: { address: entryPoint07Address, version: "0.7" },
        });
        const smartAccountClient = createSmartAccountClient({
            account: smartAccount,
            chain: sepolia,
            bundlerTransport: http(process.env.BUNDLER_URL),
            paymaster: pimlicoClient,
            userOperation: {
                estimateFeesPerGas: async () => (await pimlicoClient.getUserOperationGasPrice()).fast,
            },
        });
        try {
            const userOpHash = await smartAccountClient.sendUserOperation({
                calls: [
                    {
                        to: permissionDelegationData.signerMeta.delegationManager,
                        data: redeemCallData,
                        value: 0n,
                    },
                ],
            });
            const receipt = await smartAccountClient.waitForUserOperationReceipt({
                hash: userOpHash,
            });
            return {
                success: true,
                decision: "ALLOW",
                reason: "Transaction approved and executed",
                txHash: receipt.receipt.transactionHash,
            };
        }
        catch (error) {
            return {
                success: false,
                decision: "ERROR",
                reason: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
export const executor = new Executor();
