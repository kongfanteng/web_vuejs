import { ShapeFlags, isNumber, isObject, isString } from '@vue/shared'

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')
export function isVNode(val) {
  return !!(val && val.__v_isVNode)
}

export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}

export function convert(child) {
  if (isString(child) || isNumber(child)) {
    return createVNode(Text, null, child)
  } else {
    return child
  }
}

export function normalizeChildren(children) {
  return children.map(convert)
}

export function createVNode(type, props, children = null, patchFlag = 0) {
  // React.createElement
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT // 元素
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT // 组件
    : 0

  const vnode = {
    shapeFlag,
    __v_isVNode: true,
    type,
    props,
    key: props && props.key,
    el: null,
    children,
    patchFlag,
    dynamicChildren: null,
  }

  if (currentBlock && vnode.patchFlag > 0) {
    currentBlock.push(vnode)
  }

  if (children) {
    let type = 0
    if (Array.isArray(children)) {
      vnode.children = normalizeChildren(children)
      type = ShapeFlags.ARRAY_CHILDREN
    } else if (isObject(children)) {
      type = ShapeFlags.SLOTS_CHILDREN // $slots 可以获取到属性
    } else {
      vnode.children = String(children)
      type = ShapeFlags.TEXT_CHILDREN
    }
    vnode.shapeFlag |= type
  }
  return vnode
}

let currentBlock = null
export function openBlock() {
  currentBlock = []
}
export function closeBlock() {
  currentBlock = null
}

export function createElementBlock(type, props?, children?, patchFlag?) {
  const vnode = createVNode(type, props, children, patchFlag)
  vnode.dynamicChildren = currentBlock // 动态组件
  closeBlock() // 复制后结束收集操作
  return vnode
}

export { createVNode as createElementVNode }
export function toDisplayString(val) {
  return isString(val) ? val : isObject(val) ? JSON.stringify(val) : String(val)
}
