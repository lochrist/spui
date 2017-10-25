import sourceMaps from 'rollup-plugin-sourcemaps';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

const path = require('path');
const fs = require('fs');

const inputBasePath = 'es';
const outputBasePath = 'dist';

function createBundleConfig(input, outputName = undefined, bundleName = undefined) {
    const inputFile = path.join(inputBasePath, input);
    const outFile = path.join(outputBasePath, outputName || input);
    return {
        input: inputFile,
        output: {
            file: outFile,
            format: "umd"
        },
        sourcemap: true,
        name: bundleName,
        plugins: [
            commonjs(),
            resolve(),
            sourceMaps()
        ]
    }
}

const examples = fs.readdirSync('examples').map(exampleDir => {
    const example = path.join('examples', exampleDir, 'index.ts');
    if (fs.existsSync(example)) {
        return example.replace('.ts', '.js');
    }
}).filter(exampleFile => !!exampleFile);

const exampleConfigs = examples.map(input => createBundleConfig(input));

export default [
    createBundleConfig('spui/index.js', 'spui.js', 'spui'),
    createBundleConfig('tests/spec.js'),
    ...exampleConfigs
]
