import sourceMaps from 'rollup-plugin-sourcemaps';

export default {
    input: "es/examples/table-tests/index.js",
    output: {
        file: "dist/examples/table-tests/index.js",
        format: "umd"
    },
    sourcemap: true,
    plugins: [
        sourceMaps()
    ]
}
