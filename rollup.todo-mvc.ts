import sourceMaps from 'rollup-plugin-sourcemaps';

export default {
    input: "es/examples/todo-mvc/index.js",
    output: {
        file: "dist/examples/todo-mvc/index.js",
        format: "umd"
    },
    sourcemap: true,
    plugins: [
        sourceMaps()
    ]
}
