import 'dotenv/config'
import pg from 'pg'

// One-time backfill for the single-user → multi-user migration. Existing rows were created before
// auth, so their user_id is NULL. This claims every such row for one owner account (your Clerk user
// id), so your old sessions/stories/projects/jobs/recordings show up once you sign in.
//
//   npm --prefix server run backfill -- user_xxxx  (your Clerk user id, from the Clerk dashboard)
//
// Safe to re-run: it only touches rows where user_id IS NULL.

const userId = (process.argv[2] || process.env.BACKFILL_USER_ID || '').trim()
if (!userId) {
  console.error('Usage: npm --prefix server run backfill -- <clerk-user-id>')
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/delivery_coach',
})

const TABLES = ['sessions', 'assets', 'stories', 'projects', 'facet_drafts', 'job_descriptions', 'profile', 'prep_plan']

async function main() {
  for (const table of TABLES) {
    const { rowCount } = await pool.query(`UPDATE ${table} SET user_id = $1 WHERE user_id IS NULL`, [userId])
    console.log(`${table}: claimed ${rowCount} row(s) for ${userId}`)
  }
  await pool.end()
  console.log('Backfill complete.')
}

main().catch((e) => {
  console.error('Backfill failed:', e)
  process.exit(1)
})
