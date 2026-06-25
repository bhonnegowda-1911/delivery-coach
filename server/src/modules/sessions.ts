import { Router } from 'express'
import { pool } from '../db.js'

// Generic, kind-agnostic session store. A "session" is any activity/analysis — a behavioral
// take, a system-design interview, and (later) a JD-fit eval, resume tune, skill-gap run.
// The kind-specific shape lives in `payload` (jsonb); the columns are just what the history
// list needs to render and sort without parsing JSON. This router has zero knowledge of any
// particular feature, which is what lets new features land without backend changes.

export const sessions = Router()

const LIST_COLUMNS = 'id, kind, status, title, level, created_at, updated_at, completed_at'

// GET /api/sessions?kind=&status=  → the signed-in user's rows WITHOUT payload, newest first.
sessions.get('/', async (req, res) => {
  const { kind, status } = req.query
  const params: unknown[] = [req.userId]
  const where: string[] = ['user_id = $1']
  if (typeof kind === 'string' && kind) {
    params.push(kind)
    where.push(`kind = $${params.length}`)
  }
  if (typeof status === 'string' && status) {
    params.push(status)
    where.push(`status = $${params.length}`)
  }
  const { rows } = await pool.query(
    `SELECT ${LIST_COLUMNS} FROM sessions WHERE ${where.join(' AND ')} ORDER BY updated_at DESC`,
    params,
  )
  res.json(rows)
})

// GET /api/sessions/:id  → full row including payload (owner only).
sessions.get('/:id', async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM sessions WHERE id = $1 AND user_id = $2`, [
    req.params.id,
    req.userId,
  ])
  if (!rows.length) return res.status(404).json({ error: 'not found' })
  res.json(rows[0])
})

// PUT /api/sessions/:id  → upsert (owner only). Body: { kind, status, title, level, payload }.
sessions.put('/:id', async (req, res) => {
  const { id } = req.params
  const { kind, status, title = null, level = null, payload } = req.body ?? {}
  if (!kind || !status || payload === undefined) {
    return res.status(400).json({ error: 'kind, status and payload are required' })
  }
  const completedAt = status === 'completed' ? new Date() : null
  // The ON CONFLICT WHERE guards against one user overwriting another's row by guessing its id:
  // a conflict on a row owned by someone else updates nothing and returns no row.
  const { rows } = await pool.query(
    `INSERT INTO sessions (id, user_id, kind, status, title, level, payload, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET
       kind = EXCLUDED.kind,
       status = EXCLUDED.status,
       title = EXCLUDED.title,
       level = EXCLUDED.level,
       payload = EXCLUDED.payload,
       updated_at = now(),
       completed_at = COALESCE(sessions.completed_at, EXCLUDED.completed_at)
     WHERE sessions.user_id = $2
     RETURNING ${LIST_COLUMNS}`,
    [id, req.userId, kind, status, title, level, payload, completedAt],
  )
  if (!rows.length) return res.status(409).json({ error: 'conflict' })
  res.json(rows[0])
})

// DELETE /api/sessions/:id (owner only). Linked assets are NULLed (ON DELETE SET NULL); the client
// clears orphaned assets explicitly when it wants them gone.
sessions.delete('/:id', async (req, res) => {
  await pool.query(`DELETE FROM sessions WHERE id = $1 AND user_id = $2`, [req.params.id, req.userId])
  res.json({ ok: true })
})
