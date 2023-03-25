const path = require('path');

module.exports = {
	mode: 'production',
	entry: './src/main.js',
	output: {
		filename: 'build.js',
		path: path.resolve(__dirname, 'build'),
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js', '.glsl'],
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