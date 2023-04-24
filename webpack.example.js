import path from 'path';
import Webpack from 'webpack';
import Config  from './webpack.config.js';

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
		new Webpack.HotModuleReplacementPlugin()
	]
});
