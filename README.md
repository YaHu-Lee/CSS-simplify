# CSS-simplify

解释浏览器DOM树查询CSS样式的过程。

一般地，我们容易在项目中写出如下的CSS代码：

```css
// css
.classA {
  ...
}
.classA .classB {
  ...
}
.classA .classB .classC {
  ...
}
```
像这样的“声明继承”格式的`css`代码，假如页面中的元素太多，又或者写的时候粗心命名，很容易一不小心出现“重复选择”的情况--也就是某两个或多个规则匹配到同一个DOM元素。不过还好，我们有类似于`Less`、`Sass`之类的`css`预处理器。预处理器最大的好处(对我来说)就是可以嵌套书写。比如上面的`css`代码可以用以下的`Less`代码来替换：
```Less
// less
.classA {
  ...
  .classB {
    ...
    .classC {
      ...
    }
  }
}
```
对于开发者而言，问题似乎得到了解决。但对于浏览器来说，情况如何呢？如果读者尝试打印`lessc`对`css`文件的编译结果，就会发现情况并没有改变。因为预处理器只提供简写，**不负责优化**。他们只负责将代码**翻译**成`css`。
当然，这也并不能怪预处理器们。要想针对`css`查询性能做优化，还必须要获取到页面元素的真实结构才行。本项目就是为了这一目的编写的。
## 要处理的情况
为了优化`css`的结构，必须模拟出浏览器解析`DOM`与查询`css`的过程。对这一过程描述如下：
### 1. 解析DOM结构
在现代浏览器中，为了同时保证`HTML`文件解析结果的正确性与兼容性，往往需要细致的处理。在本项目中为了确保简洁，我借助了`react.js`中的`createElement`方法来创建一个类似的树形结构(这也意味着如果要把这个想法融入实际项目，我将首先考虑怎样适配`react`)
```js
import React from "react"
const Element = React.createElement

export default function Test() {
  return (
    Element('div', {className: 'a'}, 
      Element('div', {className: 'b'}, 
        Element('div', {className: 'd'}), 
        Element('div', {className: 'e'})
      ), 
      Element('div', {className: 'c'}, 
        Element('div', {className: 'f'})
      )
    )
  )
}
```
这样创建的树形结构并不完全满足要求，为了查询方便，我为每个节点添加了父节点指针。
### 2. 解析CSS文件
使用`postcss`来解析`css`文件。强烈推荐！
在这一步中，对于每条样式规则，按照他的"最后一个选择器"的类型，将他们分为四组：id组，class组，tag组，伪类组。分组的同时或许还可以用布隆过滤器来做一下记录，以避免将来可能发生的不必要的查询
### 3. 查询
查询过程遍历`DOM`树，根据元素的`class id tagName`等信息到上一步产生的四个组中查询。如果查到了，就将`DOM`元素与该`CSS`规则对应起来(我采用的办法是维护一个`Map`)
### 4. 生成代码
遍历第三步产生的对应关系，对每一个`DOM`节点，给它赋予一个唯一Id，给它所对应的所有匹配规则赋予相同的Id选择器

## 示例输入与输出
在本项目中，我构建的树形结构以及样式表是这样的：
```css
/**
 *                    a
 *                   / \
 *                  b   c
 *                 / \   \
 *                d   e   f
 */
 .a {
   background-color: aliceblue;
 }
 .a .b {
   background-color: antiquewhite;
 }
 .a .c {
   background-color: aqua;
 }
 .a .b .d {
   background-color: aquamarine;
 }
 .a .b .e {
   background-color: beige;
 }
 .a .c .f {
   background-color: black;
 }
 .c {
   color: aliceblue;
 }
 .e { 
   color: aliceblue;
 }
```
经过处理后，输出如下：
```
#LRABBITCSSPACK0{background-color:aliceblue;}
#LRABBITCSSPACK1{background-color:aqua;color:aliceblue;}
#LRABBITCSSPACK2{background-color:black;}
#LRABBITCSSPACK3{background-color:antiquewhite;}
#LRABBITCSSPACK4{background-color:beige;color:aliceblue;}
#LRABBITCSSPACK5{background-color:aquamarine;}

createElement(div, {"id":"#LRABBITCSSPACK0"}, 
  createElement(div, {"id":"#LRABBITCSSPACK3"}, 
    createElement(div, {"id":"#LRABBITCSSPACK5"}), 
    createElement(div, {"id":"#LRABBITCSSPACK4"})
  ), 
  createElement(div, {"id":"#LRABBITCSSPACK1"}, 
    createElement(div, {"id":"#LRABBITCSSPACK2"})
  )
)
```
层叠的类选择器不见了，取而代之的是能够让浏览器快速查找到的Id选择器，芜湖！
