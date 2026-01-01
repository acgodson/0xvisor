import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";
import { db } from "../db";

export const createTRPCContext = cache(async () => {
  //TODO: add OAUTH
  return { user: "demo_0xvisor", db };
});

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  // transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
