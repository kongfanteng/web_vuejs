import { isObject } from '@vue/shared'
import { createVNode, isVNode } from './createVNode'

export function h(type, propsOrChildren, children) {
  // createElement 用户使用的创建虚拟 DOM 方法
  const len = arguments.length
  if (len == 2) {
    // createVNode 要求儿子为文本或数组
    if (isObject(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        // const VDom = h('div', h('hello'))
        return createVNode(type, null, [propsOrChildren])
      }
      // const VDom = h('div', { style: { color: 'red'  } )
      return createVNode(type, propsOrChildren)
    } else {
      // const VDom = h('div', 'hello')
      // const VDom = h('div', [h('span'), h('span')])
      return createVNode(type, null, propsOrChildren)
    }
  } else {
    if (len > 3) {
      // const VDom = h('div', {}, h('span'), h('span'), h('span'), h('span'))
      children = Array.from(arguments).slice(2)
    } else {
      // const VDom = h('div', {}, h('span'))
      if (len == 3 && isVNode(children)) {
        children = [children]
      }
    }
  }
  // const VDom = h('div', {}, 'hello kft')
  // const VDom = h('div', {} , [h('span'), h('span')])
  return createVNode(type, propsOrChildren, children)
}

// const VDom = h('div')
// const VDom = h('div', h('hello kft'))
// const VDom = h('div', { style: { color: 'red'  } })
// const VDom = h('div', {}, [h('span'), h('span')])
// const VDom = h('div', h('span'), h('span'))
// const VDom = h('div', {}, h('span'), h('span'))
