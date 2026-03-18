import { Router } from "express"
import { prisma } from "../lib/prisma"

export const clinicsRouter = Router()

// Basic placeholder route so you can confirm wiring works
clinicsRouter.get("/:id/queue", (req, res) => {
  res.json({ clinicId: req.params.id, queue: [] })
})

// DB smoke test (temporary)
clinicsRouter.get("/db-test", async (req, res, next) => {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`
    res.json({ ok: true, result })
  } catch (err) {
    next(err)
  }
})

