/**
 * 本文件的作用是：将结构化文档中的标签转化为树形结构。
 * 目前想法是，仅对 react 的 JSX 语法做一个 demo。(因为俺不会 vue)
 * 遇到的问题：使用 babel 处理后，jsx 文法被转换成 createElement文法，产生的 chunk 如何 require 进别的 js 文件中使用？
 * 显然 webpack 不会遇到这个问题。webpack 仅仅是利用 babel 做了文法上的转换，并没有入侵到代码执行中。他采用CJS CMD ESM等
 * 方式，把文件整合以后提供运行。而在我们当前的环境下，需要在代码确实执行之前就收集到树的结构。我以为有以下几个可能的解决方案：
 * 1. 对文件中的类 HTML 文本做词法语法分析。这种做法的坏处是，对于 react 的自定义组件需要做更多的繁琐工作。
 * 2. 对 JSX 文件用 babel 处理后，提取其 render 部分，直接 eval 处理后拿到对应的树结构
 * 3. 直接引入 react 项目的 <App/>
 * 在使用 React.createElement 构建出的树形结构中，节点信息有如下几个：
 * {
 *   type: 'div',
 *   key: ,
 *   ref: ,
 *   props: { ... },
 *   _owner: null,
 *   _store: {}
 * }
 * 当我们需要遍历树形结构来计算 CSS 属性时，对我们而言最重要的应该是当前节点的父节点，但在以上数据中没有这一项
 * 这意味着，我们在遍历 DOM 结构的时候需要手动维护一个访问链，查询 CSS 规则匹配时，需要沿访问链向上查找。
 */
const React = require("react")
const Element = React.createElement
const Test = require("./test.jsx")
const reactDomTree = Test()
console.log(reactDomTree.props.children[0])
