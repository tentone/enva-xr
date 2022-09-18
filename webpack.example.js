const path = require('path');
const Webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

const source = path.resolve(__dirname, "./example");
const output = path.resolve(__dirname, "./build");

module.exports = {
	mode: 'development',
	entry: ['./src/example/main.js'],
	
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
			template: './src/example/index.html'
		}),
		new Webpack.HotModuleReplacementPlugin()
	],
	module: {
		rules: [
			{
				test: /\.glsl$/i,
				use: "raw-loader"
			}
		]
	}
};
