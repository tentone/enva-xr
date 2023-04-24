import path from 'path';

export default {
	mode: 'production',
	entry: path.resolve('./src/enva.ts'),
	output: {
		clean: true,
		filename: 'enva.module.js',
		path: path.resolve('./build'),
		library: {
			name: 'enva',
			type: 'commonjs',
		},
	},
	externals: {
		three: 'three'
	},
	resolve: {
		extensions: ['.ts', '.js', '.glsl'],
	},
	module: {
		rules: [
			{
				test: /\.glsl$/i,
				use: "raw-loader"
			},
			{
				test: /\.ts?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			  },
		]
	}
};