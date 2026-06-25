import { Router } from 'express'
import { pool } from '../db.js'

// The candidate's profile — resume text + target level. Single-user for now, so there is one
// row keyed 'default'. Interview mode reads the resume + target level; coaching mode adds the
// story bank on top. GET lazily creates the default row so the client never 404s on first load.

export const profile = Router()

const COLUMNS = 'id, resume_text, roles, target_level, updated_at'

// GET /api/profile → the signed-in user's profile row (created on first access). One row per user,
// keyed by user_id (the id column carries the user id for new rows; legacy 'default' rows are keyed
// purely on user_id after backfill).
profile.get('/', async (req, res) => {
  const uid = req.userId
  await pool.query(`INSERT INTO profile (id, user_id) VALUES ($1, $1) ON CONFLICT (user_id) DO NOTHING`, [uid])
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM profile WHERE user_id = $1`, [uid])
  res.json(rows[0])
})

// PUT /api/profile → upsert this user's resume_text / roles / target_level.
profile.put('/', async (req, res) => {
  const uid = req.userId
  const { resumeText = null, roles = [], targetLevel = 'senior' } = req.body ?? {}
  const { rows } = await pool.query(
    `INSERT INTO profile (id, user_id, resume_text, roles, target_level, updated_at)
     VALUES ($1, $1, $2, $3, $4, now())
     ON CONFLICT (user_id) DO UPDATE SET
       resume_text = EXCLUDED.resume_text,
       roles = EXCLUDED.roles,
       target_level = EXCLUDED.target_level,
       updated_at = now()
     RETURNING ${COLUMNS}`,
    [uid, resumeText, JSON.stringify(roles), targetLevel],
  )
  res.json(rows[0])
})
