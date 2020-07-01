/**
 * Webpack config.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Node dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * External dependencies
 */
const CircularDependencyPlugin = require( 'circular-dependency-plugin' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const TerserPlugin = require( 'terser-webpack-plugin' );
const WebpackBar = require( 'webpackbar' );
const { ProvidePlugin } = require( 'webpack' );

const projectPath = ( relativePath ) => {
	return path.resolve( fs.realpathSync( process.cwd() ), relativePath );
};

const noAMDParserRule = { parser: { amd: false } };

const siteKitExternals = {
	'googlesitekit-api': [ 'googlesitekit', 'api' ],
	'googlesitekit-data': [ 'googlesitekit', 'data' ],
	'googlesitekit-modules': [ 'googlesitekit', 'modules' ],
	'googlesitekit-widgets': [ 'googlesitekit', 'widgets' ],
};

const externals = { ...siteKitExternals };

const rules = [
	noAMDParserRule,
	{
		test: /\.js$/,
		exclude: /node_modules/,
		use: [
			{
				loader: 'babel-loader',
				query: {
					presets: [ [ '@babel/env', {
						useBuiltIns: 'entry',
						corejs: 2,
					} ], '@babel/preset-react' ],
				},
			},
			{
				loader: 'eslint-loader',
				options: {
					quiet: true,
					formatter: require( 'eslint' ).CLIEngine.getFormatter( 'stylish' ),
				},
			},
		],
		...noAMDParserRule,
	},
];

const resolve = {
	alias: {
		'@wordpress/api-fetch__non-shim': require.resolve( '@wordpress/api-fetch' ),
		'@wordpress/api-fetch$': path.resolve( 'assets/js/api-fetch-shim.js' ),
		'@wordpress/element__non-shim': require.resolve( '@wordpress/element' ),
		'@wordpress/element$': path.resolve( 'assets/js/element-shim.js' ),
		'@wordpress/hooks__non-shim': require.resolve( '@wordpress/hooks' ),
		'@wordpress/hooks$': path.resolve( 'assets/js/hooks-shim.js' ),
	},
	modules: [ projectPath( '.' ), 'node_modules' ],
};

const webpackConfig = ( mode ) => {
	return [
		// Build the settings js..
		{
			entry: {
				// New Modules (Post-JSR).
				'googlesitekit-api': './assets/js/googlesitekit-api.js',
				'googlesitekit-data': './assets/js/googlesitekit-data.js',
				'googlesitekit-datastore-site': './assets/js/googlesitekit-datastore-site.js',
				'googlesitekit-datastore-user': './assets/js/googlesitekit-datastore-user.js',
				'googlesitekit-datastore-forms': './assets/js/googlesitekit-datastore-forms.js',
				'googlesitekit-modules': './assets/js/googlesitekit-modules.js',
				'googlesitekit-widgets': './assets/js/googlesitekit-widgets.js',
				'googlesitekit-modules-adsense': './assets/js/googlesitekit-modules-adsense.js',
				'googlesitekit-modules-analytics': './assets/js/googlesitekit-modules-analytics.js',
				'googlesitekit-modules-pagespeed-insights': 'assets/js/googlesitekit-modules-pagespeed-insights.js',
				'googlesitekit-modules-search-console': './assets/js/googlesitekit-modules-search-console.js',
				'googlesitekit-modules-tagmanager': './assets/js/googlesitekit-modules-tagmanager.js',
				'googlesitekit-modules-optimize': './assets/js/googlesitekit-modules-optimize.js',
				// Old Modules
				'googlesitekit-activation': './assets/js/googlesitekit-activation.js',
				'googlesitekit-settings': './assets/js/googlesitekit-settings.js',
				'googlesitekit-dashboard': './assets/js/googlesitekit-dashboard.js',
				'googlesitekit-dashboard-details': './assets/js/googlesitekit-dashboard-details.js',
				'googlesitekit-dashboard-splash': './assets/js/googlesitekit-dashboard-splash.js',
				'googlesitekit-wp-dashboard': './assets/js/googlesitekit-wp-dashboard.js',
				'googlesitekit-adminbar-loader': './assets/js/googlesitekit-adminbar-loader.js',
				'googlesitekit-admin': './assets/js/googlesitekit-admin.js',
				'googlesitekit-module': './assets/js/googlesitekit-module.js',
				// Needed to test if a browser extension blocks this by naming convention.
				'pagead2.ads': './assets/js/pagead2.ads.js',
			},
			externals,
			output: {
				filename: '[name].js',
				path: __dirname + '/dist/assets/js',
				chunkFilename: '[name]-[chunkhash].js',
				publicPath: '',
				/**
				 * If multiple webpack runtimes (from different compilations) are used on the same webpage,
				 * there is a risk of conflicts of on-demand chunks in the global namespace.
				 *
				 * @see (@link https://webpack.js.org/configuration/output/#outputjsonpfunction)
				 */
				jsonpFunction: '__googlesitekit_webpackJsonp',
			},
			performance: {
				maxEntrypointSize: 175000,
			},
			module: {
				rules,
			},
			plugins: [
				new ProvidePlugin( {
					React: 'react',
				} ),
				new WebpackBar( {
					name: 'Module Entry Points',
					color: '#fbbc05',
				} ),
				new CircularDependencyPlugin( {
					exclude: /node_modules/,
					failOnError: true,
					allowAsyncCycles: false,
					cwd: process.cwd(),
				} ),
			],
			optimization: {
				minimizer: [
					new TerserPlugin( {
						parallel: true,
						sourceMap: false,
						cache: true,
						terserOptions: {
							// We preserve function names that start with capital letters as
							// they're _likely_ component names, and these are useful to have
							// in tracebacks and error messages.
							keep_fnames: /__|_x|_n|_nx|sprintf|^[A-Z].+$/,
							output: {
								comments: /translators:/i,
							},
						},
						extractComments: false,
					} ),
				],
				runtimeChunk: false,
				splitChunks: {
					cacheGroups: {
						vendor: {
							chunks: 'initial',
							name: 'googlesitekit-vendor',
							filename: 'googlesitekit-vendor.js',
							enforce: true,
							test: /[\\/]node_modules[\\/]/,
						},
					},
				},
			},
			resolve,
		},

		// Build the main plugin admin css.
		{
			entry: {
				admin: './assets/sass/admin.scss',
				adminbar: './assets/sass/adminbar.scss',
				wpdashboard: './assets/sass/wpdashboard.scss',
			},
			module: {
				rules: [
					{
						test: /\.scss$/,
						use: [
							MiniCssExtractPlugin.loader,
							{
								loader: 'css-loader',
								options: {
									minimize: ( 'production' === mode ),
								},
							},
							'postcss-loader',
							{
								loader: 'sass-loader',
								options: {
									includePaths: [ 'node_modules' ],
								},
							},
						],
					},
					{
						test: /\.(png|woff|woff2|eot|ttf|svg|gif)$/,
						use: { loader: 'url-loader?limit=100000' },
					},
				],
			},
			plugins: [
				new MiniCssExtractPlugin( {
					filename: '/assets/css/[name].css',
				} ),
				new WebpackBar( {
					name: 'Plugin CSS',
					color: '#4285f4',
				} ),
			],
		},
	];
};

const testBundle = () => {
	return {
		entry: {
			'e2e-api-fetch': './tests/e2e/assets/e2e-api-fetch.js',
			'e2e-redux-logger': './tests/e2e/assets/e2e-redux-logger.js',
		},
		output: {
			filename: '[name].js',
			path: __dirname + '/dist/assets/js',
			chunkFilename: '[name].js',
			publicPath: '',
		},
		module: {
			rules,
		},
		plugins: [
			new WebpackBar( {
				name: 'Test files',
				color: '#34a853',
			} ),
		],
		externals,
		resolve,
	};
};

module.exports = {
	externals,
	noAMDParserRule,
	projectPath,
	resolve,
	rules,
	siteKitExternals,
};

module.exports.default = ( ...args ) => {
	const { includeTests, mode } = args[ 1 ];
	const config = webpackConfig( mode );

	if ( mode !== 'production' || includeTests ) {
		// Build the test files if we aren't doing a production build.
		config.push( testBundle() );
	}

	return config;
};
