import './PostProcessor'
import '../Support/optional'

import { FS } from 'grind-support'

const CleanCSS = optional('clean-css', '>=4')

export class CssMinifyPostProcessor extends PostProcessor {

	supportedExtensions = [ 'css' ]
	options = { }

	constructor(app, shouldOptimize, sourceMaps) {
		super(app, shouldOptimize, sourceMaps)

		this.options = app.config.get('assets.post_processors.css.minify', { })

		if(typeof this.options.enabled === 'boolean') {
			this.shouldOptimize = this.options.enabled
		}
	}

	process(sourcePath, targetPath, contents) {
		if(!this.shouldOptimize || sourcePath.indexOf('.min.') >= 0) {
			return Promise.resolve(contents)
		}

		if(!CleanCSS.resolve()) {
			return Promise.resolve(contents)
		}

		const options = Object.assign({ }, this.options)

		if(this.sourceMaps === 'auto') {
			if(!targetPath.isNil) {
				options.sourceMap = true
			} else {
				options.sourceMapInlineSources = true
			}
		}

		return new Promise((resolve, reject) => {
			try {
				(new CleanCSS.pkg(options)).minify(contents, (err, result) => {
					if(!err.isNil) {
						return reject({
							file: sourcePath,
							message: err[0]
						})
					}

					if(targetPath.isNil || result.sourceMap.isNil) {
						return resolve(result.styles)
					}

					FS.writeFile(`${targetPath}.map`, result.sourceMap)
					.then(() => resolve(result.styles))
					.catch(reject)
				})
			} catch(err) {
				return reject(err)
			}
		})
	}

}
