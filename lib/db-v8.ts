import "server-only";

import contractJson from "@/prisma/schema.json" with { type: "json" };

export const recruitmentContract = contractJson;

function createPrisma8Client() {
  console.warn(
    "[AI Studio] Prisma 8 contract client using in-memory no-op mock."
  );
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: { data?: Record<string, unknown> }) => d?.data ?? {},
    update: async (d: { data?: Record<string, unknown> }) => d?.data ?? {},
    delete: async () => ({}),
  };
  return new Proxy({}, { get: () => noOp });
}

type Prisma8Client = ReturnType<typeof createPrisma8Client>;

const globalForPrisma8 = globalThis as typeof globalThis & {
  recruitmentPrisma8?: Prisma8Client;
};

export const recruitmentDb =
  globalForPrisma8.recruitmentPrisma8 ?? createPrisma8Client();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma8.recruitmentPrisma8 = recruitmentDb;
}
