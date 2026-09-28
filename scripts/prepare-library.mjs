import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { compileLibrary } from './lib/library.mjs'
import { migrateInitialContent } from './lib/migrate.mjs'

export { compileLibrary, migrateInitialContent }

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isCli) {
  try {
    const rootArg = process.argv.indexOf('--root')
    const root = rootArg >= 0
      ? path.resolve(process.argv[rootArg + 1] || '.')
      : path.resolve(import.meta.dirname, '..')
    const migration = await migrateInitialContent(root)
    const library = await compileLibrary(root)
    await fs.mkdir(path.join(root, 'data'), { recursive: true })
    await fs.writeFile(path.join(root, 'data', 'library.json'), JSON.stringify(library, null, 2) + '\n')
    console.log((migration.migrated ? 'Imported original electrostatics note and 20 images. ' : '')
      + 'Compiled ' + library.categories.length + ' categories, '
      + library.chapters.length + ' chapters, ' + library.assets.length + ' assets.')
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
