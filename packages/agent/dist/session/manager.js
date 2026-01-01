import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { toMetaMaskSmartAccount, Implementation, } from "@metamask/smart-accounts-kit";
import { encrypt } from "../utils/crypto.js";
class SessionManager {
    publicClient = createPublicClient({
        chain: sepolia,
        transport: http(process.env.RPC_URL),
    });
    async createSession(userAddress, adapterId) {
        const normalizedUser = userAddress.toLowerCase();
        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);
        const deployParams = [account.address, [], [], []];
        const smartAccount = await toMetaMaskSmartAccount({
            client: this.publicClient,
            implementation: Implementation.Hybrid,
            deployParams,
            deploySalt: "0x",
            signer: { account },
        });
        return {
            address: smartAccount.address,
            userAddress: normalizedUser,
            adapterId,
            encryptedPrivateKey: encrypt(privateKey),
            deployParams,
        };
    }
    getPublicClient() {
        return this.publicClient;
    }
}
export const sessionManager = new SessionManager();
