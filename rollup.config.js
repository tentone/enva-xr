import strip from '@rollup/plugin-strip';

export default {
	input: "source/Main.js",
	plugins: [
		strip(
		{
			functions: ["assert.*", "debug", "alert"],
			debugger: false,
			sourceMap: false
		}),
	],
	
	output: [
		{
			format: "es",
			file: "build/ar-track.module.js",
			indent: "\t"
		},
		{	
			globals: {"three": "THREE"},
			format: "umd",
			name: "ARTrack",
			file: "build/ar-track.js",
			indent: "\t"
		}
	]
};
