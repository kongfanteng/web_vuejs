import { isReactive, toRaw, toRef } from 'vue'

export * from './createPinia'
export * from './store'

export function storeToRefs(store) {
  store = toRaw(store) // proxy -> object
  const result = {}
  for (let key in store) {
    const v = store[key]
    if (isRef(v) || isReactive(v)) {
      result[key] = toRef(store, key)
    }
  }
  return result
}
