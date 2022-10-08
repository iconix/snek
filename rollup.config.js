// Plugins
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';


// Configs
var configs = {
	name: 'BuildToolsCookbook',
	files: ['main.js'],
	formats: ['es'],
	default: 'es',
	pathIn: 'src/js',
	pathOut: 'dist',
	includeUnminify: false,
	sourceMap: true
};

var exportFileName = 'snek';

// Banner
var banner = `/*! ${configs.name ? configs.name : pkg.name} v${pkg.version} | (c) ${new Date().getFullYear()} ${pkg.author.name} | ${pkg.license} License | ${pkg.repository.url} */`;

var createOutput = function (minify) {
	return configs.formats.map(function (format) {
		var output = {
			file: `${configs.pathOut}/${exportFileName}${format === configs.default ? '' : `.${format}`}${minify ? '.min' : ''}.js`,
			format: format,
			banner: banner,
		};
		if (format === 'iife') {
			output.name = configs.name ? configs.name : pkg.name;
		}
		if (minify) {
            output.plugins = [terser()];
        }

		output.sourcemap = configs.sourceMap

		return output;
	});
};

/**
 * Create output formats
 * @param  {String} filename The filename
 * @return {Array}           The outputs array
 */
var createOutputs = function () {
    var outputsMin = createOutput(true);

    // If not including un-minify version, return minify
    if (!configs.includeUnminify) return outputsMin;

    var outputs = createOutput();

    // Merge and return the two outputs
	return outputsMin.concat(outputs);
};

/**
 * Create export object
 * @return {Array} The export object
 */
var createExport = function (file) {
	return configs.files.map(function (file) {
		return {
			input: `${configs.pathIn}/${file}`,
			output: createOutputs()
		};
	});
};

export default createExport();
