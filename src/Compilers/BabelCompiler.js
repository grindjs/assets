import './Compiler'

import { MissingPackageError } from 'grind-framework'
import { FS } from 'grind-support'

const path = require('path')
const optional = require('optional')
const Browserify = optional('browserify')
const Babelify = optional('babelify')

export class BabelCompiler extends Compiler {
	wantsHashSuffixOnPublish = true
	supportedExtensions = [ 'js', 'jsx', 'es', 'es6', 'es7', 'esx' ]
	browserifyOptions = [ ]
	priority = 1000

	constructor(app, ...args) {
		super(app, ...args)

		this.browserifyOptions = app.config.get('assets.compilers.babel.browserify', { })

		if(this.browserifyOptions.debug.isNil) {
			this.browserifyOptions.debug = this.sourceMaps === 'auto'
		}
	}

	supports(pathname) {
		if(!super.supports(pathname)) {
			return false
		}

		return pathname.includes('babel') || pathname.includes('LiveReload')
	}

	async compile(pathname) {
		if(Browserify.isNil) {
			return Promise.reject(new MissingPackageError('browserify', 'dev'))
		}

		if(Babelify.isNil) {
			return Promise.reject(new MissingPackageError('babelify', 'dev'))
		}

		const imports = await this.getLiveReloadImports(pathname)

		return new Promise((resolve, reject) => {
			const browserify = Browserify(Object.assign({ }, this.browserifyOptions, {
				basedir: path.dirname(pathname)
			}))

			browserify.transform('babelify')
			browserify.add(pathname)
			browserify.bundle((err, contents) => {
				if(!err.isNil) {
					return reject(err)
				}

				if(!this.liveReload || imports.length === 0) {
					return resolve(contents)
				}

				const resources = this.app.paths.base('resources')
				if(pathname.startsWith(resources)) {
					pathname = pathname.substring(resources.length)
				}

				contents = contents.toString()
				contents += '// LIVE_RELOAD_START\n'
				contents += 'window.__liveReloadImports = window.__liveReloadImports || { }\n'
				contents += `window.__liveReloadImports['${pathname}'] = ${JSON.stringify(imports)}\n`
				contents += '// LIVE_RELOAD_END\n'

				resolve(contents)
			})
		})
	}

	async enumerateImports(pathname, callback) {
		const exists = await FS.exists(pathname)

		if(!exists) {
			return
		}

		const contents = await FS.readFile(pathname)
		const importPaths = [ ]

		contents.toString().replace(/import\s*\{[^}]+\}\s*from\s*((["'`]).+?(\2))/igm, (_, importPath) => {
			importPaths.push(importPath)
		})

		contents.toString().replace(/import\s*((["'`]).+?(\2))/ig, (_, importPath) => {
			importPaths.push(importPath)
		})

		contents.toString().replace(/require\s*\(([^)]+)\)/ig, (_, importPath) => {
			importPaths.push(importPath)
		})

		for(let importPath of importPaths) {
			const dirname = path.dirname(pathname)
			importPath = path.join(dirname, importPath.replace(/["'`]/g, '').trim())

			const ext = path.extname(importPath).substring(1)
			const files = [ ]

			if(ext.indexOf(this.supportedExtensions) === -1) {
				for(const ext of this.supportedExtensions) {
					files.push(`${importPath}.${ext}`)
				}
			} else {
				files.push(importPath)
			}

			for(const file of files) {
				const exists = await FS.exists(file)

				if(!exists) {
					continue
				}

				await callback(file)
				break
			}
		}
	}

	mime() {
		return 'application/javascript'
	}

	type() {
		return 'js'
	}

	extension() {
		return 'js'
	}

}
