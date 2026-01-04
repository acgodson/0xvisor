import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import {
  toMetaMaskSmartAccount,
  Implementation,
  ExecutionMode,
} from "@metamask/smart-accounts-kit";
import {
  http,
  encodeFunctionData,
  concat,
  encodePacked,
  createPublicClient,
  parseEther,
} from "viem";
import {
  prepareUserOperation,
  signUserOperation,
} from "viem/account-abstraction";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { entryPoint07Address } from "viem/account-abstraction";
import { sepolia } from "viem/chains";

async function testOfflineSigning() {
  console.log("\n🧪 Testing Offline Signing Flow\n");

  const sessionPrivateKey = generatePrivateKey();
  const sessionAccount = privateKeyToAccount(sessionPrivateKey);

  console.log("Session EOA:", sessionAccount.address);
  console.log("Private Key:", sessionPrivateKey);

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.RPC_URL),
  });

  const smartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [sessionAccount.address, [], [], []],
    deploySalt: "0x",
    signer: { account: sessionAccount },
  });

  console.log("\n✅ Smart Account:", smartAccount.address);
  console.log("\n📝 Fund this address with Sepolia ETH and USDC");
  console.log("Then press Enter to continue...\n");

  await new Promise((resolve) => process.stdin.once("data", resolve));

  const pimlicoClient = createPimlicoClient({
    chain: sepolia,
    transport: http(process.env.BUNDLER_URL!),
    entryPoint: { address: entryPoint07Address, version: "0.7" },
  });

  const bundlerClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.BUNDLER_URL),
  });

  const recipientAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  console.log("📤 Sending 0.001 ETH to", recipientAddress);

  let userOperation = await prepareUserOperation({
    account: smartAccount,
    entryPoint: entryPoint07Address,
    chain: sepolia,
    calls: [
      {
        to: recipientAddress,
        value: parseEther("0.001"),
        data: "0x",
      },
    ],
  });

  console.log("\n1️⃣ UserOperation prepared");

  const sponsored = await pimlicoClient.sponsorUserOperation({
    userOperation,
    entryPoint: entryPoint07Address,
  });

  userOperation = {
    ...userOperation,
    paymasterAndData: sponsored.paymasterAndData,
    preVerificationGas: sponsored.preVerificationGas,
    verificationGasLimit: sponsored.verificationGasLimit,
    callGasLimit: sponsored.callGasLimit,
  };

  console.log("2️⃣ UserOperation sponsored by Pimlico");

  const signedUserOperation = await signUserOperation({
    userOperation,
    entryPoint: entryPoint07Address,
    chain: sepolia,
    signer: sessionAccount,
  });

  console.log("3️⃣ UserOperation signed OFFLINE ✅");

  const userOpHash = await bundlerClient.request({
    method: "eth_sendUserOperation",
    params: [signedUserOperation, entryPoint07Address],
  });

  console.log("4️⃣ UserOperation broadcasted:", userOpHash);

  console.log("\n⏳ Waiting for receipt...");

  let receipt = null;
  let attempts = 0;
  while (!receipt && attempts < 30) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      receipt = await bundlerClient.request({
        method: "eth_getUserOperationReceipt",
        params: [userOpHash],
      });
    } catch (e) {
      attempts++;
    }
  }

  if (receipt) {
    console.log("\n✅ Transaction confirmed!");
    console.log("TX Hash:", receipt.receipt.transactionHash);
  } else {
    console.log("\n⚠️ Timeout waiting for receipt");
  }
}

testOfflineSigning().catch(console.error);
