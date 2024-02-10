import { activeEffect } from './effect'

export const enum ReactiveFlags {
  'IS_REACTIVE' = '__v_isReactive',
}

export const mutableHandlers = {
  // 原始对象，属性，代理对象
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }
    track(target, key)
    return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver) {
    console.log('设置新的值时，触发更新')
    return Reflect.set(target, key, value, receiver)
  },
}
// Map = {({ name: 'jw', age: 30 }): name}
// Map = { name: set() }
// { name: 'jw', age: 30 } -> name -> [effect, effect]
const targetMap = new WeakMap()
function track(target, key) {
  if (activeEffect) {
    // 当前属性在effect中才进行收集，否则不收集
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = new Set()))
    }
    let shouldTrack = !dep.has(activeEffect)
    if (shouldTrack) {
      dep.add(activeEffect)
      activeEffect.deps.push(dep)
      // effect 记录自有属性
    }
  }
}
