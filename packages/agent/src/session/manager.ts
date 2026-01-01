import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import {
  toMetaMaskSmartAccount,
  Implementation,
} from "@metamask/smart-accounts-kit";
import { encrypt } from "../utils/crypto.js";

export interface SessionAccount {
  address: `0x${string}`;
  userAddress: `0x${string}`;
  adapterId: string;
  encryptedPrivateKey: string;
  deployParams: [
    owner: `0x${string}`,
    keyIds: string[],
    xValues: bigint[],
    yValues: bigint[]
  ];
}

class SessionManager {
  private publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.RPC_URL),
  });

  async createSession(
    userAddress: `0x${string}`,
    adapterId: string
  ): Promise<SessionAccount> {
    const normalizedUser = userAddress.toLowerCase() as `0x${string}`;

    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    const deployParams: [owner: `0x${string}`, keyIds: string[], xValues: bigint[], yValues: bigint[]] = [account.address, [], [], []];

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
