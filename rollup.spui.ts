import sourceMaps from 'rollup-plugin-sourcemaps';

export default {
    input: "es/spui/index.js",
    output: {
        file: "dist/spui.js",
        format: "umd"
    },
    sourcemap: true,
    name: "spui",
    plugins: [
        sourceMaps()
    ]
}
