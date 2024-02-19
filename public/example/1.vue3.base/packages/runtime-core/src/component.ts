import { proxyRefs, reactive } from '@vue/reactivity'
import { initProps } from './componentProps'
import { isObject } from '@vue/shared'

export function createInstance(n2) {
  const instance = {
    setupState: {},
    // 组件的实例，记录组件中属性
    state: {},
    isMounted: false, // 是否挂载成功
    vnode: n2, // 组件的虚拟节点
    subTree: null, // 组件渲染的虚拟节点
    update: null, // 组件更新方法
    propsOptions: n2.type.props, // 用户传递的 props
    props: {},
    attrs: {},
    proxy: null, // 组件的代理对象 proxyRefs
  }
  return instance
}

export function setupComponent(instance) {
  const { type, props } = instance.vnode
  const publicProperties = {
    $attrs: (instance) => instance.attrs,
    $props: (instance) => instance.props,
  }
  instance.proxy = new Proxy(instance, {
    get: (target, key) => {
      const { state, props, setupState } = target
      if (key in state) {
        return state[key]
      } else if (key in setupState) {
        return setupState[key]
      } else if (key in props) {
        return props[key]
      }
      const getter = publicProperties[key]
      if (getter) {
        return getter(instance) // 传递 instance
      }
    },
    set: (target, key, value) => {
      const { state, props, setupState } = target
      if (key in state) {
        state[key] = value
        return true
      } else if (key in setupState) {
        setupState[key] = value
        return true
      } else if (key in props) {
        console.warn(`props[${key as string}] is readonly`)
        return false
      }
      return true
    },
  })
  initProps(instance, props)

  const setup = type.setup
  if (setup) {
    const setupResult = setup()
    if (isObject(setupResult)) {
      // 返回 setup 提供的数据源头
      instance.setupState = proxyRefs(setupResult)
    }
  }

  const data = type.data
  if (data) {
    instance.state = reactive(data())
  }
  instance.render = type.render
}
