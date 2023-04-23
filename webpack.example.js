import path from 'path';
import Webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';

export default {
	mode: 'development',
	entry: ['./example/main.ts'],
	output: {
		filename: '[name].bundle.js',
		path: path.resolve("./build")
	},
	devServer: {
		static: {
			directory: path.join(__dirname, 'public'),
		},
		compress: true,
		hot: true,
		port: 9000,
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{
					from: path.resolve("./assets"),
					to: path.resolve("./build/assets"),
					force: true
				}
			],
			options: {concurrency: 100}
		}),
		new HtmlWebpackPlugin({
			filename: 'index.html',
			template: './example/index.html'
		}),
		new Webpack.HotModuleReplacementPlugin()
	],
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
