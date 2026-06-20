// System-design problem library. Each problem is DATA. The `hints` are the hybrid grading
// reference: a few high-signal pointers per stage that the interviewer/grader LLM reasons
// from — the analog of the behavioral prompts' tip/trap/avoid. They are deliberately short:
// enough to anchor grading for THIS problem, not a full answer key.

export const PROBLEMS = [
  {
    id: 'url-shortener',
    title: 'Design a URL shortener',
    difficulty: 'Warm-up',
    statement:
      'Design a URL shortening service like Bitly. Users submit a long URL and get back a short link; visiting the short link redirects to the original URL.',
    hints: {
      functionalReqs: [
        'Create a short URL from a long URL',
        'Redirect a short URL to the original',
        'Optional: custom aliases and link expiration',
      ],
      nonFunctionalReqs: [
        'Read-heavy: redirects vastly outnumber creates (plan the read path)',
        'Low-latency redirects (< ~100ms)',
        'High availability for redirects; short codes must be unique',
      ],
      coreEntities: ['User', 'Link (shortCode → longUrl)'],
      api: ['POST /urls (create)', 'GET /{shortCode} (redirect, 302)'],
      deepDives: [
        'Short-code generation: counter+base62 vs hashing vs key-generation service (collisions)',
        'Scaling reads: caching hot links, read replicas',
        'Analytics on clicks without slowing redirects',
      ],
      traps: [
        'Over-engineering generation before nailing the redirect read path',
        'Ignoring collision handling on custom aliases',
      ],
    },
  },
  {
    id: 'twitter-feed',
    title: 'Design a Twitter / X feed',
    difficulty: 'Core',
    statement:
      'Design the core of Twitter: users can post tweets, follow others, and load a home timeline of recent tweets from people they follow.',
    hints: {
      functionalReqs: [
        'Post a tweet',
        'Follow / unfollow a user',
        'Load a home timeline of followees’ recent tweets',
      ],
      nonFunctionalReqs: [
        'Scale to >100M DAU; read-heavy timeline loads',
        'Low-latency feed reads (< ~500ms)',
        'Availability over strong consistency (eventually-consistent timelines are fine)',
      ],
      coreEntities: ['User', 'Tweet', 'Follow (graph edge)'],
      api: [
        'POST /tweets',
        'POST /follows / DELETE /follows',
        'GET /feed?cursor=… (paginated)',
      ],
      deepDives: [
        'Fanout-on-write vs fanout-on-read; the celebrity / hot-user problem',
        'Timeline caching (per-user precomputed feeds in Redis)',
        'Sharding tweets and the social graph; pagination with cursors',
      ],
      traps: [
        'Jumping to fanout before stating the read/write asymmetry',
        'Not handling celebrities (millions of followers) under fanout-on-write',
      ],
    },
  },
  {
    id: 'ride-sharing',
    title: 'Design a ride-sharing service',
    difficulty: 'Hard',
    statement:
      'Design the core of Uber/Lyft: riders request a ride from A to B, the system matches them to a nearby available driver, and both track the trip in real time.',
    hints: {
      functionalReqs: [
        'Rider requests a ride (pickup + destination)',
        'Match rider to a nearby available driver',
        'Real-time location tracking during the trip',
      ],
      nonFunctionalReqs: [
        'Low-latency matching; high write volume of driver location pings',
        'High availability; consistency on a ride’s assigned driver (no double-booking)',
        'Geo-scaled: traffic is regional and bursty',
      ],
      coreEntities: ['Rider', 'Driver', 'Ride/Trip', 'Location'],
      api: [
        'POST /rides (request)',
        'POST /drivers/{id}/location (ping)',
        'GET /rides/{id} (status + live location)',
      ],
      deepDives: [
        'Geospatial indexing for nearby drivers (geohash / quadtree / S2)',
        'High-throughput ingestion of location pings (write path, queues)',
        'Matching + locking a driver to avoid double assignment (consistency)',
        'Real-time updates to clients (websockets / push)',
      ],
      traps: [
        'Treating location pings as normal low-volume writes',
        'No mechanism to prevent assigning one driver to two riders',
      ],
    },
  },
]

export const DEFAULT_PROBLEM = PROBLEMS[0]

export function getProblem(id) {
  return PROBLEMS.find((p) => p.id === id) || DEFAULT_PROBLEM
}
