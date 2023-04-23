import path from 'path';
import Webpack from 'webpack';

export default {
	mode: 'development',
	entry: './src/Main.ts',
	output: {
		filename: '[name].bundle.js',
		path: path.resolve("./build")
	},
	devServer: {
		static: {
			directory: path.join('.'),
		},
		compress: true,
		hot: true,
		port: 9000,
	},
	plugins: [
		new Webpack.HotModuleReplacementPlugin()
	],
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
