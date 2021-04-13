/**
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
