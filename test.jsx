const React = require("react")
const Element = React.createElement

module.exports = function Test() {
  return (Element('div', null, Element('div', null), Element('div', null)))
}