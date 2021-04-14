// const React = require("react")
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
/**
 *                    a
 *                   / \
 *                  b   c
 *                 / \   \
 *                d   e   f
 */