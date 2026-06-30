import { PrismaClient } from "@prisma/client";

// Single shared Prisma client across the app (avoids exhausting connections
// during dev hot-reloads).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
    // The remote DB is high-latency, so the bulk Save transaction needs a
    // generous interactive-transaction budget (default is only 5s).
    transactionOptions: { timeout: 60000, maxWait: 15000 },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// The remote PostgreSQL occasionally drops idle connections (ECONNRESET / 10054,
// P1001/P1017). Retry such transient failures a few times so a brief network
// blip doesn't surface as a failed request.
const TRANSIENT = /reach database|connection|ECONNRESET|P1001|P1017|forcibly closed|terminat/i;

prisma.$use(async (params, next) => {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await next(params);
    } catch (e) {
      const msg = String((e as Error)?.message ?? "");
      const code = (e as { code?: string })?.code ?? "";
      if (!(TRANSIENT.test(msg) || TRANSIENT.test(code)) || attempt === 3) throw e;
      lastErr = e;
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
  }
  throw lastErr;
});
