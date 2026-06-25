import { Router } from 'express'
import { pool } from '../db.js'

// The story bank CRUD. Stories are curated ground-truth work narratives the coaching grader
// reads to critique CONTENT (undersold impact, "we" vs "I", a stronger example) — never seen by
// interview mode. Mirrors the SQL style of sessions.ts; this router has no feature knowledge
// beyond the shape below.

export const stories = Router()

const COLUMNS =
  'id, title, role_ref, star, impact, themes, true_ceiling_level, source_session_ids, status, project_id, created_at, updated_at'

// GET /api/stories?status=&theme=  → list, newest activity first.
stories.get('/', async (req, res) => {
  const { status, theme } = req.query
  const params: unknown[] = [req.userId]
  const where: string[] = ['user_id = $1']
  if (typeof status === 'string' && status) {
    params.push(status)
    where.push(`status = $${params.length}`)
  }
  if (typeof theme === 'string' && theme) {
    params.push(theme)
    where.push(`$${params.length} = ANY(themes)`)
  }
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM stories WHERE ${where.join(' AND ')} ORDER BY updated_at DESC`,
    params,
  )
  res.json(rows)
})

// GET /api/stories/:id → full row (owner only).
stories.get('/:id', async (req, res) => {
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM stories WHERE id = $1 AND user_id = $2`, [
    req.params.id,
    req.userId,
  ])
  if (!rows.length) return res.status(404).json({ error: 'not found' })
  res.json(rows[0])
})

// PUT /api/stories/:id → upsert. Body: { title, roleRef, star, impact, themes, trueCeilingLevel,
// sourceSessionIds, status }.
stories.put('/:id', async (req, res) => {
  const { id } = req.params
  const {
    title = null,
    roleRef = null,
    star = {},
    impact = {},
    themes = [],
    trueCeilingLevel = null,
    sourceSessionIds = [],
    status = 'draft',
    projectId = null,
  } = req.body ?? {}
  if (!title) return res.status(400).json({ error: 'title is required' })
  const { rows } = await pool.query(
    `INSERT INTO stories
       (id, user_id, title, role_ref, star, impact, themes, true_ceiling_level, source_session_ids, status, project_id, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       role_ref = EXCLUDED.role_ref,
       star = EXCLUDED.star,
       impact = EXCLUDED.impact,
       themes = EXCLUDED.themes,
       true_ceiling_level = EXCLUDED.true_ceiling_level,
       source_session_ids = EXCLUDED.source_session_ids,
       status = EXCLUDED.status,
       project_id = EXCLUDED.project_id,
       updated_at = now()
     WHERE stories.user_id = $2
     RETURNING ${COLUMNS}`,
    [
      id,
      req.userId,
      title,
      roleRef,
      JSON.stringify(star),
      JSON.stringify(impact),
      themes,
      trueCeilingLevel,
      JSON.stringify(sourceSessionIds),
      status,
      projectId,
    ],
  )
  if (!rows.length) return res.status(409).json({ error: 'conflict' })
  res.json(rows[0])
})

// DELETE /api/stories/:id (owner only)
stories.delete('/:id', async (req, res) => {
  await pool.query(`DELETE FROM stories WHERE id = $1 AND user_id = $2`, [req.params.id, req.userId])
  res.json({ ok: true })
})
