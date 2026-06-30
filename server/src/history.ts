import { prisma } from "./db";

// Append a permanent history entry. Fire-and-forget friendly, but we await so
// callers can guarantee ordering when it matters.
export async function logAction(action: string, details?: unknown): Promise<void> {
  await prisma.history.create({
    data: {
      action,
      details: (details as object | undefined) ?? undefined,
    },
  });
}
