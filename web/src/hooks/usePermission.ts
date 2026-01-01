"use client";

import { useState, useCallback, useEffect } from "react";
import { createWalletClient, custom } from "viem";
import { sepolia } from "viem/chains";
import { erc7715ProviderActions } from "@metamask/smart-accounts-kit/actions";
import { trpc } from "../trpc/client";

const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

interface PermissionRequest {
  sessionAddress: string;
  tokenAddress: string;
  amount: string;
  period: number;
  adapterId: string;
}

interface Permission {
  id: number;
  permissionType: string;
  tokenAddress: string;
  delegationHash: string;
  grantedAt: string;
  isActive: boolean;
}

export function usePermission(userAddress: string | null) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPermissionMutation = trpc.permissions.create.useMutation();
  const permissionsQuery = trpc.permissions.list.useQuery(
    { userAddress: userAddress! as `0x${string}` },
    { enabled: !!userAddress }
  );

  // Use trpc utils to manually fetch session when needed
  const trpcUtils = trpc.useContext();

  const requestPermission = useCallback(
    async (request: PermissionRequest) => {
      if (!userAddress) {
        setError("Wallet not connected");
        return null;
      }

      setIsRequesting(true);
      setError(null);

      try {
        if (!window.ethereum) {
          throw new Error("MetaMask not installed");
        }

        // Fetch session address using tRPC with the correct adapterId
        const sessionData = await trpcUtils.session.get.fetch({
          userAddress: userAddress as `0x${string}`,
          adapterId: request.adapterId,
        });

        if (!sessionData?.sessionAddress) {
          throw new Error("Failed to get session address");
        }

        const sessionAddress = sessionData.sessionAddress;
        console.log("Using session address for adapter", request.adapterId, ":", sessionAddress);

        const walletClient = createWalletClient({
          transport: custom(window.ethereum),
        }).extend(erc7715ProviderActions());

        const currentTime = Math.floor(Date.now() / 1000);
        const expiry = currentTime + 604800; // 7 days from now

        const permissions = await walletClient.requestExecutionPermissions([
          {
            chainId: sepolia.id,
            expiry,
            isAdjustmentAllowed: true,
            signer: {
              type: "account",
              data: { address: sessionAddress as `0x${string}` },
            },
            permission: {
              type: "erc20-token-periodic",
              data: {
                tokenAddress: request.tokenAddress as `0x${string}`,
                periodAmount: BigInt(request.amount),
                periodDuration: request.period,
                justification: `Permission to transfer up to ${request.amount} tokens every ${
                  request.period / 86400
                } day(s)`,
              },
            },
          },
        ]);

        console.log("Permissions granted:", permissions);

        const grantedPermission = permissions[0];

        // Create permission 
        const result = await createPermissionMutation.mutateAsync({
          userAddress: userAddress as `0x${string}`,
          type: "erc20-token-periodic",
          tokenAddress: request.tokenAddress as `0x${string}`,
          sessionAddress: sessionAddress as `0x${string}`,
          amount: request.amount,
          period: request.period,
          delegation: grantedPermission,
        });

        setPermissions((prev) => [...prev, result.permission as any]);
        return result.permission;
      } catch (err: any) {
        console.error("Permission request error:", err);
        setError(err.message || "Failed to request permission");
        return null;
      } finally {
        setIsRequesting(false);
      }
    },
    [userAddress, trpcUtils, createPermissionMutation]
  );

  const fetchPermissions = useCallback(async () => {
    if (!userAddress) return;
    await permissionsQuery.refetch();
  }, [userAddress, permissionsQuery]);


  useEffect(() => {
    if (permissionsQuery.data?.permissions) {
      setPermissions(permissionsQuery.data.permissions as any);
    }
  }, [permissionsQuery.data]);

  return {
    permissions,
    isRequesting,
    error,
    requestPermission,
    fetchPermissions,
    USDC_ADDRESS,
  };
}
