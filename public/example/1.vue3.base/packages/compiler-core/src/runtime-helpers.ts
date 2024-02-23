import { NodeTypes } from './ast'

export const TO_DISPLAY_STRING = Symbol('toDisplayString')
export const CREATE_TEXT = Symbol('createTextVNode')
export const CREATE_ELEMENT_VNODE = Symbol('createElementVNode')

export const FRAGMENT = Symbol('Fragment')
export const OPEN_BLOCK = Symbol('openBlock')
export const CREATE_ELEMENT_BLOCK = Symbol('createElementBlock')

export const helperMapping = {
  // 宏
  [TO_DISPLAY_STRING]: 'toDisplayString',
  [CREATE_TEXT]: 'createTextVNode',
  [CREATE_ELEMENT_VNODE]: 'createElementVNode',
  [FRAGMENT]: 'Fragment',
  [OPEN_BLOCK]: 'openBlock',
  [CREATE_ELEMENT_BLOCK]: 'createElementBlock',
}

export function createCallExpression(context, args) {
  let callee = context.helper(CREATE_TEXT)
  // createTextVnode([内容, 1])
  return {
    type: NodeTypes.JS_CALL_EXPRESSION,
    arguments: args,
    callee,
  }
}

export function createElementCall(context, tag, props, children) {
  let callee = context.helper(CREATE_ELEMENT_VNODE)
  return {
    type: NodeTypes.VNODE_CALL,
    tag,
    props,
    children,
    callee,
  }
}
