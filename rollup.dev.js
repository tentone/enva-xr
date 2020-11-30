import serve from "rollup-plugin-serve";

export default {
	input: "source/Main.js",
	plugins: [
		serve({
			open: true,
			contentBase: '.',
			openPage: '/example',
			host: 'localhost',
			port: 8080
		})
	],
	output: [
		{
			globals: {"three": "THREE"},
			format: "umd",
			name: "ARTrack",
			file: "build/ar-track.js",
			indent: "\t"
		},
	]
};
