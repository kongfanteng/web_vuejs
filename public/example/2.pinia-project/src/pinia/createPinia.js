import { effectScope, ref } from 'vue'
import { piniaSymbol } from './rootStore'

export function createPinia() {
  const scope = effectScope()
  // 整个应用的状态稍后 defineStore 的时候，就会在这里增加状态
  const state = scope.run(() => ref({}))
  const _p = []
  // vue3 中能用 map 全部用的 map
  const pinia = {
    install(app) {
      // 所有组件都可以通过 inject 来访问，只能在 setup 中访问；
      app.provide(piniaSymbol, pinia)
      // 所有组件都可以通过 this 来访问到 pinia
      app.config.globalProperties.$pinia = pinia
    },
    use(plugin) {
      // 注入插件...，自定义插件
      _p.push(plugin)
      return pinia
    },
    _p,
    state, // counter -> store.state; todo -> store.state;
    _e: scope,
    _s: new Map(), // 记录有哪些 store 的
    // counter -> store
  }
  return pinia
}

// 暂停更新 effectScope
// state.counter.computed
// state.stop()

// state.counter -> store
// state.todo -> store
