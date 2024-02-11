import { isObject } from '@vue/shared'
import { activeEffect } from './effect'
import { reactive } from './reactive'

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
    let result = Reflect.get(target, key, receiver)
    if (isObject(result)) {
      // 如果属性是对象，递归处理
      return reactive(result)
    }
    return result
  },
  set(target, key, value, receiver) {
    // console.log('设置新的值时，触发更新')
    let oldValue = target[key]
    let flag = Reflect.set(target, key, value, receiver)
    if (value !== oldValue) {
      trigger(target, key, value, receiver)
    }
    return flag
  },
}

function trigger(target, key, value, receiver) {
  // { name: 'jw', age: 30 } -> name -> [effect, effect]
  // 寻找对应 effect 执行
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }
  let effects = depsMap.get(key)
  triggerEffects(effects)
}

export function triggerEffects (effects) {
  if (effects) {
    effects = [...effects] // vue2 中是数组，这里先拷贝再循环
    effects.forEach((effect) => {
      // 当前正在执行和现在时同一个进行屏蔽
      if (activeEffect !== effect) {
        if (effect.scheduler) {
          effect.scheduler()
        } else {
          effect.run() // 包含删除和添加的逻辑
        }
      }
    })
  }
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
    trackEffects(dep)
  }
}

export function trackEffects(dep) {
  let shouldTrack = !dep.has(activeEffect)
  if (shouldTrack) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
    // effect 记录自有属性
  }
}
