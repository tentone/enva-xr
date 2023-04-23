import path from 'path';

export default {
	mode: 'production',
	entry: './src/Main.ts',
	output: {
		filename: '[name].bundle.js',
		path: path.resolve('./build'),
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