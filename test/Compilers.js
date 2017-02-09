/* eslint-disable max-len */

import test from 'ava'
import './helpers/Grind'

import '../src/Compilers/ScssCompiler'
import '../src/Compilers/BabelCompiler'
import '../src/Compilers/RawCompiler'

function compile(compiler, file, ...args) {
	const app = new Grind
	app.config.loadDefault('assets', app.paths.base('../../config/assets.json'))

	return (new compiler(app)).compile(app.paths.base('assets', file), ...args)
}

test('scss', async t => {
	const scss = await compile(ScssCompiler, 'scss/test.scss', 'compressed')
	t.is(scss.toString().trim(), 'body{margin:0;padding:0}body strong{font-weight:900}')
})

test('babel', async t => {
	let js = await compile(BabelCompiler, 'babel/test.js')

	// Strip linebreaks to avoid needing to include a multiline string
	js = js.toString().trim().replace(/\s*\n\s*/g, ';').replace(/;+/g, ';')

	t.is(js, '(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module \'"+o+"\'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){;\'use strict\';Object.defineProperty(exports, "__esModule", {;value: true;});var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };var Test = exports.Test = function () {;function Test() {;_classCallCheck(this, Test);};_createClass(Test, [{;key: \'test\',;value: function test() {;return document.body.getElementById(\'test\');};}]);return Test;}();},{}]},{},[1]);')
})

test('raw', async t => {
	const svg = await compile(RawCompiler, 'img/test-raw.svg')
	t.is(svg.toString().trim(), '<?xml version="1.0" encoding="UTF-8"?>\n<svg></svg>')
})
