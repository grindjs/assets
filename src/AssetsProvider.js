import './AssetFactory'
import './Http/Controller'

import './Compilers/JavascriptCompiler'
import './Compilers/RawCompiler'
import './Compilers/ScssCompiler'

import path from 'path'

function expandMacros(config, macros) {
	const isArray = Array.isArray(config)
	let reindex = false

	for(const key of Object.keys(config)) {
		const value = config[key]

		if(typeof value === 'object' && value !== null) {
			config[key] = expandMacros(value, macros)
			continue
		} else if(typeof value !== 'string') {
			continue
		}

		for(const macro of macros) {
			const pattern = macro[0]
			const replacement = macro[1]

			if(!replacement.isNil) {
				config[key] = value.replace(pattern, replacement)
			} else if(value.match(pattern)) {
				reindex = isArray
				delete config[key]
			}
		}
	}

	if(reindex) {
		config = Array.from(config).filter(value => value.isNil === false)
	}

	return config
}

export function AssetsProvider(app) {
	app.config.loadDefault('assets', path.join(__dirname, '../config/assets.json'))
	let config = Object.assign({ }, app.config.get('assets'))

	const macros = [
		[ 'node_modules', config.node_modules || app.paths.base('node_modules') ]
	]

	for(const macro of macros) {
		macro[0] = new RegExp(`\\{\\{\\s*${macro[0]}\\s*\\}\\}`, 'g')
	}

	config = expandMacros(config, macros)
	app.config.set('assets', config)

	const autoMinify = !config.auto_minify ? config.auto_minify : !app.debug
	const factory = new AssetFactory(app, autoMinify)

	factory.registerCompiler(JavascriptCompiler)
	factory.registerCompiler(RawCompiler)
	factory.registerCompiler(ScssCompiler)

	app.routes.group({ prefix: 'assets', controller: new Controller(app, factory) }, routes => {
		routes.get(':type/:a?/:b?/:c?/:d?/:e?', 'compile')
	})

}
