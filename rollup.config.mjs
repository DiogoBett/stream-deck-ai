import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
	input: "src/plugin.ts",
	output: {
		file: "io.github.diogo.ai-usage.sdPlugin/bin/plugin.js",
		format: "cjs",
		sourcemap: true,
	},
	external: (id) => id.startsWith("node:"),
	plugins: [nodeResolve({ preferBuiltins: true }), commonjs(), typescript({ tsconfig: "./tsconfig.json" })],
};
