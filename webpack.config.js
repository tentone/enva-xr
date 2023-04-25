import path from 'path';

export const Config = {
	mode: 'production',
	entry: path.resolve('./src/enva.ts'),
	target: 'web',
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

export default Object.assign(structuredClone(Config), {
	output: {
		clean: true,
		filename: 'enva.js',
		path: path.resolve('./build'),
		library: 'enva',
	}
});