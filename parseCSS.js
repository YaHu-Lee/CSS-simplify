/**
 * 本文件的用途是，将需要简化的 CSS 文件中所有匹配规则 (Rules) 提取出来 (借助postcss)，根据其最后一个选择器的类型，分别存入 4 个 hash 表中
 * 这四个 hash 表的名字分别是：m_idRules，m_classRules，m_tagRules，m_shadowPseudoElementRules
 * 同时，使用 bloom filter 对这 4 个 hash 表进行访问过滤以模拟真实浏览器的样式计算策略。
 * 
 * 对 CSS 的语法语义分析是通过 postcss 来实现的。
 * 使用 postcss 处理后，调用 walkRules 方法来遍历整个 css 文件中的 Rules。
 * 单个 Rule 的数据结构如下：
 * Rule {
 *   raws： { before: '', between: '', semicolon: true, after: ''}  // 此为 css 文件中的注释
 *   type: 'rule',
 *   nodes: Array<Declaration>,
 *   parent: Root,                                                  // 此 Root 为 整个样式表 的标记
 *   source: {                                                      // 此 source 是重要的数据结构，最终改良后的 css 文件需基于此改进
 *     start: { offset: 0, line: 1, column: 1 },
 *     input: Input {
 *       css: 'css string',                                         // 此 css 字符串除 selector 外，最终将会被原封不动地转移到新的 css 文件中
 *       hasBOM: false,
 *       id: '<input css 38nK5D>'
 *     },
 *     end: { offset: 38, line: 3, column: 1 }
 *   },
 *   selector: '.a',
 * }
 * 
 * 本文件对整理好的 css Rules 的处理思路：
 */
import fs from "fs"
import path from "path"
import postcss from "postcss"
import BloomFilter from "./bloomFilter.js"
const css = fs.readFileSync('test.css').toString()
const cssTree = postcss.parse(css)
const m_idRules = {},
      m_classRules = {},
      m_tagRules = {},
      m_shadowPseudoElementRules = {},
      idBloomFilter = new BloomFilter(),
      classBloomFilter = new BloomFilter(),
      tagBloomFilter = new BloomFilter(),
      shadowPseudoElementBloomFilter = new BloomFilter()
const tagReg = /div|p|span|img|br|a/g                                         // 写代码的时候瞎诹的

cssTree.walkRules(rule => {
  const selectors = rule.selector.split(',') || []
  selectors.forEach(selector => {
    const selectorPhrase = selector.trim().split(' ')
    const searchPath = [...selectorPhrase].reverse()
    const currentSelector = selectorPhrase[selectorPhrase.length - 1].trim()  // 取到一串选择器的最后一项
    // 判断这一项属于哪一类
    if(currentSelector.indexOf('#') === 0) {                                  // id选择器
      if(!m_idRules[currentSelector]) {
        m_idRules[currentSelector] = []
      }
      m_idRules[currentSelector].push(Object.assign({}, rule, {selector, searchPath}))
      idBloomFilter.set(currentSelector)
    } else if(currentSelector.indexOf('.') === 0) {                           // 类选择器
      if(!m_classRules[currentSelector]) {
        m_classRules[currentSelector] = []
      }
      m_classRules[currentSelector].push(Object.assign({}, rule, {selector, searchPath}))
      classBloomFilter.set(currentSelector)
    } else if(tagReg.test(currentSelector)) {                                    // 标签选择器
      if(!m_tagRules[currentSelector]) {
        m_tagRules[currentSelector] = []
      }
      m_tagRules[currentSelector].push(Object.assign({}, rule, {selector, searchPath}))
      tagBloomFilter.set(currentSelector)
    }
    // 当前缺少伪类选择器的处理逻辑！！！因为我还没想清楚伪类选择器与其他选择器的共存关系T_T.
  })
})
export {
  m_idRules,
  idBloomFilter,
  m_classRules,
  classBloomFilter,
  m_tagRules,
  tagBloomFilter,
  m_shadowPseudoElementRules,
  shadowPseudoElementBloomFilter,
  cssTree
} 