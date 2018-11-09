/* eslint-disable max-len */
import test from 'ava'
import { FS } from 'grind-support'

import './helpers/Grind'

import {
	CssMinifyPostProcessor,
	CssPostCssPostProcessor,
	JavascriptMinifyPostProcessor,
	SvgOptimizePostProcessor
} from '../src'

async function make(processor, file, hook = () => { }) {
	const app = new Grind
	app.config.loadDefault('assets', app.paths.base('../../config/assets.json'))
	hook(app)

	file = app.paths.base('resources/assets', file)

	return {
		app,
		file,
		contents: (await FS.readFile(file)).toString(),
		processor: new processor(app, app.config.get('assets.should_optimize'), app.config.get('assets.source_maps'))
	}
}

test('css-minify', async t => {
	const { processor, file, contents } = await make(CssMinifyPostProcessor, 'css/test.css')
	const css = await processor.process(file, null, contents)

	t.is(css.toString().trim(), 'body{margin:0;padding:0;background:#fff}strong{font-weight:900}')
})

test('css-postcss', async t => {
	const { processor, file, contents } = await make(CssPostCssPostProcessor, 'css/test-autoprefix.css')
	const css = await processor.process(file, null, contents)

	t.is(css.toString().trim(), 'div { -webkit-transform: scale(0.5, 0.5); transform: scale(0.5, 0.5); }')
})

test('js-minify', async t => {
	const { processor, file, contents } = await make(JavascriptMinifyPostProcessor, 'js/test.js')
	const js = await processor.process(file, null, contents)

	t.is(js.toString().trim(), 'document.body.getElementById("test").style.border="none";')
})

test('babel-minify', async t => {
	const { processor, file, contents } = await make(JavascriptMinifyPostProcessor, 'babel/test.js', app => {
		app.config.set('assets.post_processors.js.minify.package', 'uglify-es')
	})

	const js = await processor.process(file, null, contents)

	t.is(js.toString().trim(), 'export class Test{test(){return document.body.getElementById("test")}};')
})

test('svg-optimize', async t => {
	const { processor, file, contents } = await make(SvgOptimizePostProcessor, 'img/test.svg')
	const svg = await processor.process(file, null, contents)

	t.is(svg.toString().trim(), '<svg width="108" height="108" xmlns="http://www.w3.org/2000/svg"><path fill="#000" d="M4 2h100v100H4z" fill-rule="evenodd"/></svg>')
})
