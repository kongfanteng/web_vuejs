import {
  computed,
  effectScope,
  getCurrentInstance,
  inject,
  isRef,
  reactive,
  toRefs,
  watch,
} from 'vue'
import { piniaSymbol } from './rootStore'

function isComputed(o) {
  return !!(isRef(o) && o.effect)
}

// 对于 pinia 而言，修改状态有三种方式 1. state.xxx ''; 2. store.action(); 3. store.$patch;

function isObject(val) {
  return val !== null && typeof val === 'object'
}

function createOptionStore(id, options, pinia) {
  const { state, getters = {}, actions = {} } = options

  function setup() {
    // 根据用户的状态将其保存到 pinia 中
    pinia.state.value[id] = state ? state() : {}
    const localState = toRefs(pinia.state.value[id])
    return Object.assign(
      localState,
      actions,
      Object.keys(getters).reduce((gettersObj, getterName) => {
        gettersObj[getterName] = computed(() => {
          const store = pinia._s.get(id)
          return getters[getterName].call(store)
        })
        return gettersObj
      }, {})
    ) // 自己生产的 store
  }
  const store = createSetupStore(id, setup, pinia)
  store.$reset = function () {
    const newState = state ? state() : {}
    store.$patch(newState)
  }
}

function merge(target, partialState) {
  for (const key in partialState) {
    const newState = partialState[key]
    const oldState = target[key]
    if (isObject(oldState) && isObject(newState) && !isRef(newState)) {
      target[key] = merge(oldState, newState)
    } else {
      target[key] = newState
    }
  }
  return target
}

function createSetupStore(id, setup, pinia) {
  const store = reactive({
    $patch(partialStateOrMutator) {
      // 部分状态和全部状态左一个合并即可
      if (typeof partialStateOrMutator === 'function') {
        partialStateOrMutator(pinia.state.value[id])
      } else {
        merge(pinia.state.value[id], partialStateOrMutator)
      }
    },
    $subscribe(callback) {
      scope.run(() =>
        watch(pinia.state.value[id], (state) => {
          callback(state, id)
        })
      )
    },
    $dispose() {
      scope.stop() // 放弃这个 store
      pinia._s.delete(id) // 删除映射关系
    },
  }) // store
  let scope

  function wrapAction(action) {
    return function () {
      let result = action.call(store, ...arguments)
      // todo...
      return result
    }
  }
  const setupStore = pinia._e.run(() => {
    // 划分父子作用域
    scope = effectScope()
    return scope.run(() => setup())
  })

  let isSetupStore = false
  if (!pinia.state.value[id]) {
    isSetupStore = true
    pinia.state.value[id] = {} // vue3 无 state 则增加一个空对象
  }
  for (const key in setupStore) {
    const v = setupStore[key]
    if (typeof v === 'function') {
      setupStore[key] = wrapAction(v)
    } else if (isSetupStore && !isComputed(v)) {
      // 只有 setupStore 才需要将其他属性赋值
      // 除了函数的都作为 state 放入
      pinia.state.value[id][key] = v
    }
  }

  Object.assign(store, setupStore)
  Object.defineProperty(store, '$state', {
    get() {
      return pinia.state.value[id]
    },
    set: (newState) => {
      console.log('newState:', newState)
      store.$patch(newState)
    },
  })
  // 调用插件，并且将当前的 store 传递给插件。用户可以自己监控 store 中的变化；
  pinia._p.forEach((plugin) => scope.run(() => plugin({ store, id })))
  pinia._s.set(id, store) // store -> reactive({ count: 0 })

  // 为了后续方便，我们将这个初始化的流程放到一个函数里
  return store
}

export function defineStore(idOptions, setup) {
  let id
  let options
  const isSetupStore = typeof setup === 'function'
  if (typeof idOptions === 'string') {
    id = idOptions
    options = setup // 选项式 api（可能 setup 函数）
  } else {
    id = idOptions.id
    options = idOptions
  }
  function useStore() {
    const instance = getCurrentInstance()
    const pinia = instance && inject(piniaSymbol)
    if (!pinia._s.has(id)) {
      // 没有就创建一个 store，将 store 存储到 _s 中
      if (isSetupStore) {
        createSetupStore(id, options, pinia)
      } else {
        createOptionStore(id, options, pinia)
      }
    }
    const store = pinia._s.get(id)
    return store
  }

  return useStore
}
// const useSotre = defineStore()
// const store = useStore()
