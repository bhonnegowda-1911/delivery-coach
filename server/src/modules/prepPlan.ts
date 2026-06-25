import { Router } from 'express'
import { pool } from '../db.js'

// The single, cross-application prep plan — one merged day-by-day schedule built from every active
// interview. Single-user for now, so there is one row keyed 'default' (mirrors profile). GET returns
// { plan } (null until the client first generates one); PUT upserts the whole plan payload.

export const prepPlan = Router()

// GET /api/prep-plan → { plan: GlobalPrepPlan | null } for this user.
prepPlan.get('/', async (req, res) => {
  const { rows } = await pool.query(`SELECT payload FROM prep_plan WHERE user_id = $1`, [req.userId])
  res.json({ plan: rows[0]?.payload ?? null })
})

// PUT /api/prep-plan → upsert this user's plan payload, returns { plan }. One row per user.
prepPlan.put('/', async (req, res) => {
  const uid = req.userId
  const plan = req.body ?? null
  const { rows } = await pool.query(
    `INSERT INTO prep_plan (id, user_id, payload, updated_at)
     VALUES ($1, $1, $2, now())
     ON CONFLICT (user_id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()
     RETURNING payload`,
    [uid, plan === null ? null : JSON.stringify(plan)],
  )
  res.json({ plan: rows[0]?.payload ?? null })
})
