// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const mockServer = require('./mock/server');
module.exports = {
    entry: './src/index.js',
    output: {
        path: path.join(__dirname, './dist'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                }
            }
        ]
    },
    plugins: [
        // 指定html文件模板
        new HtmlWebpackPlugin({
            template: './src/index.html'
        }),
    ],
    devServer: {
        after: (app) => {
            mockServer(app)
        }
    }
};