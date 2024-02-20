import { ref } from '@vue/reactivity'
import { Fragment } from './createVNode'
import { h } from './h'
import { isFunction } from '@vue/shared'

export function defineAsyncComponent(options) {
  if (isFunction(options)) {
    options.loader = options
  }
  return {
    setup() {
      const { loader } = options
      let Comp = null
      const loaded = ref(false)
      const error = ref(false)
      const loading = ref(false)
      if (options.timeout) {
        setTimeout(() => {
          error.value = true // 时间过期失败
        }, options.timeout)
      }
      if (options.delay) {
        setTimeout(() => {
          loading.value = true // 延迟加载
        }, options.delay)
      }

      function load() {
        return loader()
          .then((c) => {
            Comp = c?.default ? c.default : c
            loaded.value = true
          })
          .catch((err) => {
            if (options.onError) {
              return new Promise((resolve, reject) => {
                const retry = () => resolve(load())
                const fail = () => reject(err)
                options.onError(err, retry, fail)
              })
            }
            error.value = true
          })
      }
      load()

      return () => {
        if (loaded.value) {
          return h(Comp)
        } else if (error.value && options.errorComponent) {
          return h(options.errorComponent)
        } else if (loading.value && options.loadingComponent) {
          return h(options.loadingComponent)
        }
        return h(Fragment, [])
      }
    },
  }
}
