const path = require('path');
const Webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

const source = path.resolve(__dirname, "./example");
const output = path.resolve(__dirname, "./build");

module.exports = {
	mode: 'development',
	entry: ['./example/main.ts'],
	output: {
		filename: '[name].bundle.js',
		path: output
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
					from: path.resolve(__dirname, "./assets"),
					to: path.resolve(__dirname, output + "/assets"),
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
