import { currentInstance, setCurrentInstance } from './component'

export const enum Lifecycles {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um',
  BEFORE_DESTROY = 'bd',
  DESTROYED = 'd',
  ACTIVATE = 'a',
  DEACTIVATE = 'da',
  RESUME = 'r',
  SUSPEND = 's',
  RENDER_PROPS = 'rp',
  RENDER_CHILDREN = 'rc',
  RENDER = 'r',
}

// 发布"订阅"
function createHook(type) {
  return (hook, target = currentInstance) => {
    // hook 是用户传递的函数
    // const target = currentInstance // 通过闭包缓存变量
    if (target) {
      const hooks = target[type] || (target[type] = [])
      const wrapper = () => {
        // 事件订阅，保存执行信息；
        setCurrentInstance(target)
        hook()
        setCurrentInstance(null)
      }
      // invokeHooks
      hooks.push(wrapper) // hook 中的 currentInstance
    }
  }
}

export const onBeforeMount = createHook(Lifecycles.BEFORE_MOUNT)
export const onMounted = createHook(Lifecycles.MOUNTED)
export const onBeforeUpdate = createHook(Lifecycles.BEFORE_UPDATE)
export const onUpdated = createHook(Lifecycles.UPDATED)
export const onBeforeUnmount = createHook(Lifecycles.BEFORE_UNMOUNT)
export const onUnmounted = createHook(Lifecycles.UNMOUNTED)
