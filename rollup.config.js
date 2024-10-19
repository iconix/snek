import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

var configs = {
    name: 'snek',
    files: ['main.js', 'debug__orientation.js'],
    formats: ['es'],
    default: 'es',
    pathIn: 'src/js',
    pathOut: 'dist',
    includeUnminify: false,
    sourceMap: true
};

var banner = `/*! ${configs.name ? configs.name : pkg.name} v${pkg.version} | (c) ${new Date().getFullYear()} ${pkg.author.name} | ${pkg.license} License | ${pkg.repository.url} */`;

var createOutput = function (filename, minify) {
	if (filename === 'main') {
		filename = 'snek';
	}

    return configs.formats.map(function (format) {
        var output = {
            file: `${configs.pathOut}/${filename}${format === configs.default ? '' : `.${format}`}${minify ? '.min' : ''}.js`,
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

var createExport = function () {
    return configs.files.map(function (file) {
        const filename = file.replace('.js', '');
        return {
            input: `${configs.pathIn}/${file}`,
            output: createOutput(filename, true).concat(configs.includeUnminify ? createOutput(filename, false) : [])
        };
    });
};

export default createExport();
