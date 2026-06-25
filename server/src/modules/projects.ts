import { Router } from 'express'
import { pool } from '../db.js'

// Project CRUD. A project is the rich, level-aware ground truth (summary + competency facets) a
// story is mined from; coaching mode reads matched projects' facets to critique content. Mirrors
// the SQL style of stories.ts / sessions.ts; no feature knowledge beyond the shape below.

export const projects = Router()

const COLUMNS = 'id, title, role_ref, summary, facets, target_level_at_capture, created_at, updated_at'

// GET /api/projects → the user's projects, newest activity first.
projects.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM projects WHERE user_id = $1 ORDER BY updated_at DESC`,
    [req.userId],
  )
  res.json(rows)
})

// GET /api/projects/:id → full row (owner only).
projects.get('/:id', async (req, res) => {
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM projects WHERE id = $1 AND user_id = $2`, [
    req.params.id,
    req.userId,
  ])
  if (!rows.length) return res.status(404).json({ error: 'not found' })
  res.json(rows[0])
})

// PUT /api/projects/:id → upsert (owner only). Body: { title, roleRef, summary, facets, targetLevelAtCapture }.
projects.put('/:id', async (req, res) => {
  const { id } = req.params
  const { title = null, roleRef = null, summary = null, facets = {}, targetLevelAtCapture = null } = req.body ?? {}
  if (!title) return res.status(400).json({ error: 'title is required' })
  const { rows } = await pool.query(
    `INSERT INTO projects (id, user_id, title, role_ref, summary, facets, target_level_at_capture, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       role_ref = EXCLUDED.role_ref,
       summary = EXCLUDED.summary,
       facets = EXCLUDED.facets,
       target_level_at_capture = EXCLUDED.target_level_at_capture,
       updated_at = now()
     WHERE projects.user_id = $2
     RETURNING ${COLUMNS}`,
    [id, req.userId, title, roleRef, summary, JSON.stringify(facets), targetLevelAtCapture],
  )
  if (!rows.length) return res.status(409).json({ error: 'conflict' })
  res.json(rows[0])
})

// DELETE /api/projects/:id (owner only). Linked stories keep their project_id (no cascade).
projects.delete('/:id', async (req, res) => {
  // facet_drafts has no FK to projects (drafts can predate the project's first save), so clear here.
  await pool.query(`DELETE FROM facet_drafts WHERE project_id = $1 AND user_id = $2`, [req.params.id, req.userId])
  await pool.query(`DELETE FROM projects WHERE id = $1 AND user_id = $2`, [req.params.id, req.userId])
  res.json({ ok: true })
})
