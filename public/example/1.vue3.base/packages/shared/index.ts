export function isObject(val) {
  return typeof val === 'object' && val !== null
}
export function isFunction(val) {
  return typeof val === 'function'
}
export function isString(val) {
  return typeof val === 'string'
}

export enum ShapeFlags {
  ELEMENT = 1, // 元素
  FUNCTIONAL_COMPONENT = 1 << 1, // 2
  STATEFUL_COMPONENT = 1 << 2, // 4
  TEXT_CHILDREN = 1 << 3, // 文本儿子
  ARRAY_CHILDREN = 1 << 4, // 数组儿子
  SLOTS_CHILDREN = 1 << 5, // 组件插槽
  TELEPORT = 1 << 6, // 传送门
  SUSPENSE = 1 << 7, // SUSPENSE 组件
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8, // keep-alive
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}
