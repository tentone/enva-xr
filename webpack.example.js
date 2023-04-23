import path from 'path';
import Webpack from 'webpack';
import Config  from './webpack.config';

export default Object.assign(Config, {
	mode: 'development',
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
