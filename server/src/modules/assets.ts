import { Router } from 'express'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { pool } from '../db.js'
import { putObject, getObject, deleteObject } from '../storage.js'

// Media assets for every feature: behavioral voice recordings, system-design images/video,
// and (later) resume/JD files. Bytes go to object storage (MinIO); this table holds metadata
// plus the object key. Transfer is proxied through the backend — simple to run locally and no
// browser-side MinIO/CORS config — and can move to presigned URLs later without schema change.

export const assets = Router()

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } })

// POST /api/assets  (multipart: file + fields kind, sessionId?)  → { id, kind, contentType, sizeBytes }
assets.post('/', upload.single('file'), async (req, res) => {
  const file = req.file
  if (!file) return res.status(400).json({ error: 'file is required' })
  const kind = String(req.body.kind || inferKind(file.mimetype))
  const sessionId = req.body.sessionId ? String(req.body.sessionId) : null
  const id = randomUUID()
  const objectKey = `${kind}/${id}`

  await putObject(objectKey, file.buffer, file.mimetype)
  await pool.query(
    `INSERT INTO assets (id, session_id, kind, object_key, content_type, size_bytes, original_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, sessionId, kind, objectKey, file.mimetype, file.size, file.originalname || null],
  )
  res.json({ id, kind, contentType: file.mimetype, sizeBytes: file.size })
})

// GET /api/assets/:id  → stream the bytes (usable directly as an <img>/<audio>/<video> src).
assets.get('/:id', async (req, res) => {
  const { rows } = await pool.query(`SELECT object_key, content_type FROM assets WHERE id = $1`, [
    req.params.id,
  ])
  if (!rows.length) return res.status(404).json({ error: 'not found' })
  try {
    const obj = await getObject(rows[0].object_key)
    if (rows[0].content_type) res.setHeader('Content-Type', rows[0].content_type)
    if (obj.contentLength) res.setHeader('Content-Length', String(obj.contentLength))
    obj.body.pipe(res)
  } catch {
    res.status(404).json({ error: 'object missing' })
  }
})

// DELETE /api/assets/:id  → remove the object and the row.
assets.delete('/:id', async (req, res) => {
  const { rows } = await pool.query(`SELECT object_key FROM assets WHERE id = $1`, [req.params.id])
  if (rows.length) {
    try {
      await deleteObject(rows[0].object_key)
    } catch {
      // object already gone — fall through and drop the row
    }
    await pool.query(`DELETE FROM assets WHERE id = $1`, [req.params.id])
  }
  res.json({ ok: true })
})

function inferKind(mime: string): string {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime === 'application/pdf') return 'pdf'
  return 'file'
}
