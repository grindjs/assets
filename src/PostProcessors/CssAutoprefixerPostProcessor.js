import './PostProcessor'

import optional from 'optional'

const PostCSS = optional('postcss')
const Autoprefixer = optional('autoprefixer')

export class CssAutoprefixerPostProcessor extends PostProcessor {
	priority = 100
	supportedExtensions = [ 'css' ]
	options = { }

	constructor(app, shouldOptimize, sourceMaps) {
		super(app, shouldOptimize, sourceMaps)

		this.options = app.config.get('assets.post_processors.css.autoprefix', { })
		this.shouldOptimize = this.options.enabled || true

		if(this.options.sourceMap.isNil && this.sourceMaps === 'auto') {
			this.options.sourceMap = true
		}
	}

	process(sourcePath, targetPath, contents) {
		if(!this.shouldOptimize) {
			return Promise.resolve(contents)
		}

		if(Autoprefixer.isNil) {
			Log.error('autoprefixer missing, unable to minify. please run `npm install --save-dev autoprefixer`')
			return Promise.resolve(contents)
		}

		if(PostCSS.isNil) {
			Log.error('postcss missing, unable to minify. please run `npm install --save-dev postcss`')
			return Promise.resolve(contents)
		}

		return PostCSS([ Autoprefixer ]).process(contents).then(result => result.css).catch(err => {
			err.file = sourcePath
			throw err
		})
	}

}
