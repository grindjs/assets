import { FS } from 'grind-support'
const path = require('path')

export class Compiler {

	app = null
	priority = 0
	supportedExtensions = [ ]
	wantsHashSuffixOnPublish = true
	sourceMaps = 'auto'
	liveReload = false

	constructor(app, sourceMaps, liveReload) {
		this.app = app
		this.sourceMaps = sourceMaps
		this.liveReload = liveReload
	}

	// eslint-disable-next-line no-unused-vars
	supports(pathname) {
		return this.supportedExtensions.indexOf(path.extname(pathname).replace(/^\./, '')) >= 0
	}

	// eslint-disable-next-line no-unused-vars
	compile(pathname, context = null) {
		return Promise.reject('Abstract method, subclasses must implement.')
	}

	lastModified(pathname, newest = 0) {
		return FS.stat(pathname).then(stats => {
			const timestamp = (new Date(stats.mtime)).getTime() / 1000.0
			newest = Math.max(newest, timestamp)

			return this.enumerateImports(pathname,
				pathname => this.lastModified(pathname, newest).then(timestamp => {
					newest = Math.max(newest, timestamp)
				})
			).then(() => newest)
		}).catch(err => {
			if(err.code === 'ENOENT') {
				return newest
			}

			throw err
		})
	}

	async getLiveReloadImports(pathname, resources = null) {
		const imports = [ ]

		if(this.liveReload) {
			if(resources.isNil) {
				resources = this.app.paths.base('resources')
			}

			await this.enumerateImports(pathname, async i => {
				if(!i.startsWith(resources)) {
					return
				}

				imports.push(
					i.substring(resources.length),
					...(await this.getLiveReloadImports(i, resources))
				)
			})
		}

		return imports
	}

	// eslint-disable-next-line no-unused-vars
	enumerateImports(file, callback) {
		// Does nothing by default, subclasses that support imports
		// should override and provider their own implementation.
		return Promise.resolve()
	}

	/* eslint-disable no-unused-vars */
	mime(asset) { throw new Error('Abstract method, subclasses must implement.') }
	type(asset) { throw new Error('Abstract method, subclasses must implement.') }
	extension(asset) { throw new Error('Abstract method, subclasses must implement.') }
	/* eslint-enable no-unused-vars */

}
