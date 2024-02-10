import { isObject } from '@vue/shared'
import { ReactiveFlags, mutableHandlers } from './baseHandler'

export function reactive(target) {
  return createReactiveObject(target)
}

const reactiveMap = new WeakMap() // 防止内存泄露

// 响应式对象核心逻辑
function createReactiveObject(target) {
  if (!isObject(target)) {
    return
  }
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }
  // 防止同一个对象被代理两次，返回的永远是同一个代理对象
  let existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }
  const proxy = new Proxy(target, mutableHandlers)
  reactiveMap.set(target, proxy)
  return proxy
}
