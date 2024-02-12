import { isFunction, isObject } from '@vue/shared'
import { ReactiveEffect } from './effect'
import { isReactive } from './reactive'

function traverse(source, seen = new Set()) {
  if (!isObject(source)) {
    return source
  }
  if (seen.has(source)) {
    return source
  }
  seen.add(source)
  for (let k in source) {
    // 访问了对象中所有属性
    traverse(source[k], seen)
  }
  return source
}

export function watch(source, cb, options: any = {}) {
  let getter
  if (isReactive(source)) {
    getter = () => traverse(source)
  } else if (isFunction(source)) {
    getter = source
  }
  let oldValue
  let clean
  const onCleanup = (fn) => {
    clean = fn
  }
  const job = () => {
    if (clean) clean()
    const newValue = effect.run()
    cb(newValue, oldValue, onCleanup)
    oldValue = newValue
  }
  const effect = new ReactiveEffect(getter, job)
  if (options.immediate) {
    job()
  }
  oldValue = effect.run()
}
