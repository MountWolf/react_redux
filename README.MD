## 从0安装react + redux
### 1、 基础依赖： react, react-dom
```
npm i --save react react-dom
```
### 2、 webpack
这里 webpack-cli 作为一个命令行工具，接收一些参数并用于 webpack 的编译器，webpack-dev-server 是一个基于 express 的开发服务器，还提供了 live reloading 的功能，在开发的时候使用它还是很方便的，它还有两个 hook api 以方便我们扩展自己想要的功能.
```
npm i --save-dev webpack webpack-cli webpack-dev-server
```
### 3、 编译插件
```
npm i --save-dev babel-core babel-loader babel-preset-env babel-preset-react html-webpack-plugin
```
### 4、webpack.config.js
```
// webpack.config.js
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
module.exports = {
  // 让 webpack 知道以哪个模块为入口，做依赖收集
  // 具体参考 https://webpack.js.org/concepts/#entry
  entry: './src/index.js',
  // 告诉 webpack 打包好的文件存放在哪里，以及怎么命名
  // 具体参考 https://webpack.js.org/concepts/#output
  output: {
    path: path.join(__dirname, '/dist'),
    filename: 'bundle.js'
  },
  module: {
    // 使用 babel-loader 编译 es6/7/8 和 jsx 语法
    // 注意：这里没有配置 preset，而是在 .babelrc 文件里面配置
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  plugins: [
    // 这里我们通常想要指定自己的 html 文件模板，也可以指定生成的 html 的文件名
    // 如果不传参数，会有一个默认的模板文件
    // 具体参考 https://github.com/jantimon/html-webpack-plugin
    new HtmlWebpackPlugin({
      template: './src/index.html'
    })
  ]
}
```

### 5、 babel preset
```
// .babelrc
{
  "presets": ["env", "react"]
}
```

### 6、热启动
```
// package.json
{
  "scripts": {
    "start": "webpack-dev-server --mode development --open --hot",
    "build": "webpack --mode production"
  }
}
```

### 7、 添加redux
- 添加 @reduxjs/toolkit 和 react-redux packages
- 使 用RTK 的 configureStore API 创建 Redux store，并传入至少一个 reducer 函数。
- 在应用程序的入口文件（比如 src/index.js）中引入 Redux store。
- 用 react-redux 中的 <Provider> 组件来包裹 React 根组件。


## 配置devServer
webpack-dev-server 为我们提供了很多 api 可以做定制化的需求（可以参考文档：[webpack.js.org/configurati…](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Fconfiguration%2Fdev-server%2F) ），比如本地模拟异步请求数据.

一个项目往往有很多数据需要通过请求异步接口拿到，在项目开始的时候，后端还没有为我们提供这些接口，这时候我们不得不自己造一些假的接口用于调度我们的代码，这时候我们可以使用 devServer 的 after 选项来为 devServer 添加自己的异步接口。


### 1、创建mock文件夹用于存放本地模拟数据相关的代码
```
├ mock
│ ├ server.js // express 中间件文件，为 devServer 添加接口路由及处理程序
│ ├ config.js // 路由配置项，接口 URL 地址和本地数据文件的映射
│ └ index.json // 一个接口模拟数据文件
```

### 2、在webpack.config.js中配置devServer选项
```
const mockServer = require('./mock/server')
module.exports = {
  devServer: {
    after: (app) => {
      mockServer(app)
    }
  }
}
```
除了可以自己模拟接口外，devServer 还提供了 proxy 可以代理远端的接口，这个适合于后端已经准备好接口，需要进行前后端联调的时候，从本地请求远端的接口。

## 多页面应用配置

如果我们的应用不止一个页面，我们需要对上面的配置进行改造，主要包括 entry、output 和 HtmlWebpackPlugin 等几项。比如我们增加一个 about 页面。

### 目录结构：
```
webpack-react-startup
├ src
| ├ components // 放置 react 组件
│ │ ├ App.js
│ │ └ About.js
| └ pages // 放置各页面及入口模块
│   ├ about.html
│   ├ about.js
│   ├ index.html
│   └ index.js
├ .babelrc
├ package-lock.json
└ package.json
```

### 修改 webpack.config.js
```
// webpack.config.js
module.exports = {
  // 这里 entry 是一个对象，每个页面和它的入口模块是一个 key/value 对
  entry: {
    index: './src/pages/index.js',
    about: './src/pages/about.js'
  },
  output: {
    // 这里 filename 有所改变，[name] 表示 entry 里面的 key
    // 表示每个页面的 bundle 文件以自己的名称命名
    filename: '[name].js'
  },
  plugins: [
    // index 页面
    new HtmlWebpackPlugin({
      template: './src/pages/index.html',
      // 要注入的 entry 模块，如果不指定，会把所有 entry 模块都注入
      chunks: ['index']
    }),
    // about 页面
    new HtmlWebpackPlugin({
      template: './src/pages/about.html',
      // about 页面的 html 文件名
      filename: 'about.html',
      chunks: ['about']
    })
  ]
}

```

## 公共模块抽离

使用上面的配置，执行 npm run build 命令后，我们会在 dist 目录找到打包后的结果。但我们发现，about.js 和 index.js 这两个文件都很大，因为他们各自都包含了 react 库相关的代码。这里通常的做法是，将公共模块单独打包到一个文件，在页面中分别引用，这里我们要用到 webpack 的另一个插件 SplitChunksPlugin。
> 注：在 webpack 4.0 以前是用的 CommonsChunkPlugin，4.0过后改用了新的 SplitChunksPlugin，具体参考：[webpack.js.org/plugins/spl…](https://link.juejin.cn/?target=https%3A%2F%2Fwebpack.js.org%2Fplugins%2Fsplit-chunks-plugin%2F)

> 这是一个内置插件，我们只需要在 webpack.config.js 文件中写相应的配置就可以了：

```
module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/pages/index.html',
      // 注入公共模块 commons
      chunks: ['commons', 'index']
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/about.html',
      filename: 'about.html',
      // 注入公共模块 commons
      chunks: ['commons', 'about']
    })
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        // 创建一个 commons 块，用于包含所有入口模块共用的代码
        commons: {
          name: "commons",
          chunks: "initial",
          minChunks: 2
        }
      }
    }
  }
}

```