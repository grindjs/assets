import './Compiler'
import '../Support/Require'

const sass = Require.optionally('node-sass')

export class ScssCompiler extends Compiler {
	supportedExtensions = [ 'scss', 'sass' ]
	options = { }
	priority = 1000

	constructor(app, autoMinify) {
		super(app, autoMinify)

		this.options = app.config.get('assets.compilers.scss', { })
	}

	compile(path, context) {
		if(sass.isNil) {
			return Promise.reject(new Error('node-sass missing, please run `npm install node-sass --save`'))
		}

		return new Promise((resolve, reject) => {
			sass.render(Object.assign({ }, this.options, {
				file: path,
				outputStyle: context || (this.autoMinify ? 'compressed' : 'nested')
			}), (err, result) => {
				if(!err.isNil) {
					return reject(err)
				}

				resolve(result.css)
			})
		})
	}

	mime() {
		return 'text/css'
	}

	type() {
		return 'css'
	}

	extension() {
		return 'css'
	}

}
