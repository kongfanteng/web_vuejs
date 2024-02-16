import { ShapeFlags, isNumber, isString } from '@vue/shared'

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

export function createVNode(type, props, children = null) {
  // React.createElement
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0

  const vnode = {
    shapeFlag,
    __v_isVNode: true,
    type,
    props,
    key: props && props.key,
    el: null,
    children,
  }

  if (children) {
    let type = 0
    if (Array.isArray(children)) {
      vnode.children = normalizeChildren(children)
      type = ShapeFlags.ARRAY_CHILDREN
    } else {
      vnode.children = String(children)
      type = ShapeFlags.TEXT_CHILDREN
    }
    vnode.shapeFlag |= type
  }
  return vnode
}
