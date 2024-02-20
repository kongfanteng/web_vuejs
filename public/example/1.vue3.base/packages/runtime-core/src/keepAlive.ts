import { onMounted, onUpdated } from './lifecycle'
import { getCurrentInstance } from './component'
import { ShapeFlags } from '@vue/shared'

export const KeepAlive = {
  __isKeepAlive: true,
  props: {
    max: Number,
  },
  setup(props, { slots }) {
    const keys = new Set() // 存储组件唯一标识
    const cache = new Map() // 存储映射表
    const instance = getCurrentInstance()
    let {
      createElement,
      move,
      patch,
      unmount: _unmount,
    } = instance.ctx.renderer
    // 将卸载的 DOM 放入容器用以复用
    const storageContainer = createElement('div')
    instance.ctx.activated = function (vnode, container) {
      move(vnode, container)
    }
    instance.ctx.deactivated = function (vnode) {
      move(vnode, storageContainer)
    }
    let pendingCacheKey = null
    function toCache() {
      cache.set(pendingCacheKey, instance.subTree)
    }
    onMounted(toCache)
    onUpdated(toCache)
    function unmount(vnode) {
      let flag = vnode.shapeFlag
      if (flag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
        flag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
      }
      if (flag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
        flag -= ShapeFlags.COMPONENT_KEPT_ALIVE
      }
      vnode.shapeFlag = flag
      _unmount(vnode, instance)
    }
    function pruneCacheEntry(key) {
      unmount(cache.get(key))
      keys.delete(key)
      cache.delete(key)
    }
    return () => {
      // keepalive 缓存真实 DOM
      const vnode = slots.default()
      const key = vnode.type
      pendingCacheKey = key
      const cacheVnode = cache.get(key)
      if (cacheVnode) {
        vnode.component = cacheVnode.component
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE
        keys.delete(key)
        keys.add(key) // 最新访问放置尾部
      } else {
        keys.add(key)
        if (props.max && keys.size > props.max) {
          // 缓存的个数超过了最大值
          pruneCacheEntry(keys.values().next().value)
        }
      }
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
      return vnode
    }
  },
}

// 判断当前虚拟节点是否是 keepAlive 虚拟节点
export const isKeepAlive = (vonde) => vonde.type.__isKeepAlive
