/**
 * 对DOM树做遍历，对于每个当前遍历的节点，需要在 m_classRules 中(暂且先实现 class 简化)找到对应的 cssRule 
 * 维护一个 DOM-CSS map，其中记录已经查找到的DOM节点与CSSRule对应关系。遍历完成后，为每个DOM添加一个独有ID，
 * 将CSS文件全部改写，不再采用class选择，转而采用id选择器
 */
import searchTree from "./parseReactDOM.js"
import {
  m_idRules,
  idBloomFilter,
  m_classRules,
  classBloomFilter,
  m_tagRules,
  tagBloomFilter,
  m_shadowPseudoElementRules,
  shadowPseudoElementBloomFilter
} from "./parseCSS.js"
const DOM2CSS = new Map()    // 内部维护每个DOM与其对应的CSS规则对象
// console.log(searchTree)
/**
 * run 函数是整个程序的入口函数，搭建了层序遍历架子，寻找每个 DOM 节点对应的 CSSRule
 * @param {object} root 
 * @returns 
 */
function run(root) {
  if(!root) return
  const nodeArray = []
  nodeArray.push(root)
  while(nodeArray.length) {
    const currentNode = nodeArray.pop()
    currentNode.children.forEach(child => nodeArray.push(child))
    searchCSSByClass(currentNode)         // 暂时先实现依照 class 匹配
  }
}
function searchCSSByClass(node) {
  const resultRules = []                       // 这里存放所有与当前 Node 节点相符合的所有 Rules
  const nodeClassList = node.props.className.split(' ') // 提取node的className
  nodeClassList.forEach(nodeClass => {
    const className = '.' + nodeClass
    if(classBloomFilter.no(className)) {
      console.log(`在classHash中未找到 ${className}`)
      return
    } else {
      const matchedRules = m_classRules[className]
      if(!matchedRules || matchedRules.length === 0) return
      matchedRules.forEach(rule => {
        if(isMatched(node, rule)) {
          resultRules.push(rule)
        }
      })
    }
  })
  DOM2CSS.set(node, resultRules)              // 将当前 DOM 节点与其所对应的 CSS Rules 关联起来
}
function isMatched(node, rule) {
  let currentNode = node
  // node: react node
  // rule: postcss rule
  // 处理流程： 
  // 首先提取 rule 中完整的选择器查询顺序，这个顺序已经被处理好放在 searchPath 属性中了
  // 然后，将 searchPath 规划为栈，沿 node 继承链向上查询，如果遇到匹配栈顶的 node 就出栈一个
  // 直到 node 向上走完，看看栈中是否还有元素
  const searchPath = [...rule.searchPath]
  currentNode = currentNode.parent
  searchPath.shift()
  while(currentNode && searchPath.length) {
    const currentClassList = currentNode.props.className.split(' ')
    const currentSelector = searchPath[0].slice(1)         // 把 selector 刚开头的 . 切掉
    if(currentClassList.includes(currentSelector)) {
      searchPath.shift()
    }
    currentNode = currentNode.parent
  }
  if(!searchPath.length) {
    return true
  } else return false
}
run(searchTree)
console.log(DOM2CSS)