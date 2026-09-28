import fs from 'node:fs/promises'
import path from 'node:path'

const dist = path.resolve(import.meta.dirname, '../dist')
await fs.access(path.join(dist, 'index.html'))
// Workers uses wrangler.jsonc for SPA fallback. Slidev's Pages catch-all
// must not rewrite requests for JavaScript, styles, fonts, or screenshots.
await fs.rm(path.join(dist, '_redirects'), { force: true })
console.log('Workers assets ready; SPA navigation is configured in wrangler.jsonc.')
