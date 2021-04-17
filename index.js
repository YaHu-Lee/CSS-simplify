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
  shadowPseudoElementBloomFilter,
  cssTree
} from "./parseCSS.js"
const DOM2CSS_Class = new Map()    // 内部维护每个DOM与其对应的CSS规则对象
const DOM2CSS_Tag = new Map()
const DOM2CSS_Id = new Map()
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
  DOM2CSS_Class.set(node, resultRules)              // 将当前 DOM 节点与其所对应的 CSS Rules 关联起来
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
function renderCSS(combine = false) {
  // 此函数为CSS出口函数，其作用是将每个DOM所对应的CSS映射到文件内
  // 为每个DOM创建专属id，其对应的类选择器被映射为专属id选择器

  // 参数 combine 作用：合并匹配到同一 DOM 的多个选择器
  let css = ''
  let currentId = 0
  DOM2CSS_Class.forEach((rules, dom) => {
    // cssText: `#L1234{}`
    const Id = '#L' + "RABBITCSSPACK" + currentId
    currentId++
    dom.id = Id
    let domRule = ''
    rules.forEach(rule => {
      let currentRule = ''
      const declarations = rule.nodes
      declarations.forEach(declaration => {
        currentRule = currentRule + declaration.prop + ':' + declaration.value + ';'
      })
      if(!combine) domRule = domRule + Id + `{${currentRule}}`
      else domRule = domRule + currentRule
    })
    if(!combine) css = css + domRule
    else css = css + Id + `{${domRule}}`
  })
  return css
}
function renderDOM(root) {
  // 此函数将内存中的DOM元素渲染成文件形式
  // 渲染过程是递归过程
  function renderSingleDOM(dom, fnString = 'creatElement') {
    if(!dom.children || !dom.children.length) {
      return `${fnString}(${dom.type}, ${JSON.stringify(Object.assign({},  {id: dom.id}))})`   // 此处缺少dom的原props！
    } else {
      const childrenText = dom.children.map((child) => renderSingleDOM(child))
      let text = `${fnString}(${dom.type}, ${JSON.stringify(Object.assign({},  {id: dom.id}))}`
      childrenText.forEach(child => {
        text += `, ${child}`
      })
      text += ')'
      return text
    }
  }
  return renderSingleDOM(root)
}
run(searchTree)
console.log(renderCSS(true))
console.log(renderDOM(searchTree))
// #LRABBITCSSPACK0{background-color:aliceblue;}
// #LRABBITCSSPACK1{background-color:aqua;color:aliceblue;}
// #LRABBITCSSPACK2{background-color:black;}
// #LRABBITCSSPACK3{background-color:antiquewhite;}
// #LRABBITCSSPACK4{background-color:beige;color:aliceblue;}
// #LRABBITCSSPACK5{background-color:aquamarine;}

// createElement(div, {"id":"#LRABBITCSSPACK0"}, 
//   createElement(div, {"id":"#LRABBITCSSPACK3"}, 
//     createElement(div, {"id":"#LRABBITCSSPACK5"}), 
//     createElement(div, {"id":"#LRABBITCSSPACK4"})
//   ), 
//   createElement(div, {"id":"#LRABBITCSSPACK1"}, 
//     createElement(div, {"id":"#LRABBITCSSPACK2"})
//   )
// )

