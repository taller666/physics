import path from 'node:path'
import { createSiteServer } from './site-server.mjs'
const port = Number(process.env.PORT || 3031)
const { server } = createSiteServer(path.resolve(import.meta.dirname, '../dist'))
server.listen(port, '127.0.0.1', () => console.log(`Website ready: http://127.0.0.1:${port}/`))
