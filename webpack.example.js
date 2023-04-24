import path from 'path';
import Webpack from 'webpack';
import Config  from './webpack.config.js';
import HtmlWebpackPlugin from 'html-webpack-plugin';

export default Object.assign(Config, {
	mode: 'development',
	entry: path.resolve('./example/ts/main.ts'),
	devServer: {
		static: {
			directory: path.join('.'),
		},
		compress: true,
		hot: true,
		port: 9000,
	},
	plugins: [
		new HtmlWebpackPlugin({
			filename: 'index.html',
			template: path.resolve('./example/ts/index.html')
		}),
		new Webpack.HotModuleReplacementPlugin()
	]
});
