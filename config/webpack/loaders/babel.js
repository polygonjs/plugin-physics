module.exports = {
	test: /\.m?js$/,
	exclude: /node_modules\/ammojs-typed/,
	use: {
		loader: 'babel-loader',
		options: {
			presets: ['@babel/preset-env'],
		},
	},
};
