import path from 'node:path'
import { createSiteServer } from './site-server.mjs'
import { createLocalSpace } from '../server/local-space.mjs'
const port = Number(process.env.PORT || 3031)
const root = path.resolve(import.meta.dirname, '..')
const { server } = createSiteServer(path.join(root, 'dist'), { api: await createLocalSpace(root) })
server.listen(port, '127.0.0.1', () => console.log(`Website ready: http://127.0.0.1:${port}/`))
