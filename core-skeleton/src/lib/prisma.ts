import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

if (!globalForPrisma.prisma) {
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  globalForPrisma.prisma = new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma


