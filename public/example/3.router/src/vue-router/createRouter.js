import { computed, reactive, shallowRef } from 'vue'
import { RouterLink } from './router-link'
import { RouterView } from './router-view'
function normalize(record) {
  return {
    path: record.path,
    name: record.name,
    meta: record.meta || {},
    components: {
      default: record.component,
    },
    children: record.children || [],
    beforeEnter: record.beforeEnter,
  }
}
function createMatcher(record, parent) {
  const matcher = {
    path: record.path,
    record,
    parent,
    children: [],
  }
  if (parent) {
    parent.children.push(matcher)
  }
  return matcher
}
function createRouterMatcher(routes) {
  // 用户登录后才有的
  const matchers = []
  function addRoute(record, parent) {
    let normalizedRecord = normalize(record)
    if (parent) {
      normalizedRecord.path = parent.path + '/' + normalizedRecord.path
    }
    const matcher = createMatcher(normalizedRecord, parent)
    matchers.push(matcher)
    const children = normalizedRecord.children
    for (let i = 0; i < children.length; i++) {
      addRoute(children[i], matcher)
    }
  }

  function resolve(path) {
    let matched = []
    // /my/a 组件
    let matcher = matchers.find((matcher) => matcher.path === path)
    while (matcher) {
      matched.unshift(matcher.record) // /my /my/a
      matcher = matcher.parent
    }
    return {
      path,
      matched,
    }
  }

  // 递归添加路由
  routes.forEach((route) => addRoute(route))
  return {
    addRoute,
    resolve,
  }
}

const START_LOCATION = {
  path: '/',
  matched: [],
}

export function createRouter({ history, routes }) {
  // 路由匹配：根据路径进行匹配
  const matcher = createRouterMatcher(routes)
  // 1. 需要响应式；2. 解构后响应式存在；3. 内部数组元素非响应式；
  const currentLocation = shallowRef(START_LOCATION)

  let ready
  function markReady() {
    if (ready) return
    ready = true
    history.listen((to, from) => {
      to = matcher.resolve(to)
      from = currentLocation.value
      finalNavigation(to, from)
    })
  }
  function finalNavigation(to, from) {
    // 判断 replace 还是 push
    if (from === START_LOCATION) {
      history.replace(to.path)
    } else {
      history.push(to.path)
    }
    currentLocation.value = to // 更新路径
    markReady()
  }

  function extractRecords(to, from) {
    const leavingRecords = []
    const updatingRecords = []
    const enteringRecords = []
    let len = Math.max(to.matched.length, from.matched.length) // 哪个匹配多，哪个为准；
    for (let i = 0; i < len; i++) {
      const fromRecord = from.matched[i]
      if (fromRecord) {
        if (to.matched.find((record) => record.path === fromRecord.path)) {
          updatingRecords.push(fromRecord)
        } else {
          leavingRecords.push(fromRecord)
        }
      }
      const toRecord = to.matched[i]
      if (toRecord) {
        if (!from.matched.find((record) => record.path === toRecord.path)) {
          enteringRecords.push(toRecord)
        }
      }
    }
    return [leavingRecords, updatingRecords, enteringRecords]
  }

  // my -> beforeRouteleave my/a -> beforeRouteleave
  function guardToPromise(guard, to, from, record) {
    return () =>
      new Promise((resolve, reject) => {
        // 返回函数的目的：可以组合多个 guard
        const next = resolve
        const r = guard.call(record, to, from, next)
        Promise.resolve(r).then(next) // 等待 guard 执行完毕后自动调用 next
      })
  }

  function extractGuards(guardType, matched, to, from) {
    let guards = []
    for (let record of matched) {
      let comp = record.components.default
      const guard = comp[guardType]
      guard && guards.push(guardToPromise(guard, to, from))
    }
    return guards
  }

  function runGuardQueue(guards) {
    return guards.reduce(
      (promise, guard) => promise.then(() => guard()),
      Promise.resolve()
    )
  }

  function navigate(to, from) {
    const [leavingRecords, updatingRecords, enteringRecords] = extractRecords(
      to,
      from
    )

    let guards = extractGuards(
      'beforeRouteLeave',
      leavingRecords.reverse(),
      to,
      from
    )
    return runGuardQueue(guards)
      .then(() => {
        guards = []
        for (let guard of beforeGuards.list()) {
          guards.push(guardToPromise(guard))
        }
        return runGuardQueue(guards) // 全局钩子
      })
      .then(() => {
        let guards = extractGuards(
          'beforeRouteUpdate',
          updatingRecords.reverse(),
          to,
          from
        )
        return runGuardQueue(guards)
      })
      .then(() => {
        guards = []
        for (let record of to.matched) {
          const enterGuard = record.beforeEnter
          if (enterGuard) {
            guards.push(guardToPromise(enterGuard))
          }
        }
        return runGuardQueue(guards)
      })
      .then(() => {
        guards = extractGuards('beforeRouteEnter', enteringRecords)
        return runGuardQueue(guards)
      })
      .then(() => {
        guards = []
        for (let guard of beforeResolveGuards.list()) {
          guards.push(guardToPromise(guard))
        }
        return runGuardQueue(guards) // 全局钩子
      })
    // 这里需要将函数组合起来执行 compose
  }

  function pushWithRedirect(to) {
    const from = currentLocation.value
    to = matcher.resolve(to.value || to)
    // 有 to 和 from 监控路径的变化，后续可以更新路径
    // 跳转路由+监听
    navigate(to, from)
      .then(() => {
        return finalNavigation(to, from)
      })
      .then(() => {
        for (let guard of afterGuards.list()) {
          guard(to, from)
        }
      })
  }
  function push(to) {
    return pushWithRedirect(to)
  }
  if (currentLocation.value === START_LOCATION) {
    // 第一次加载路由，根据路径找到组件将他放入到 START_LOCATION 中
    push(history.location) // 默认的跳转
  }

  function useCallbacks() {
    const handlers = [] // 用户函数
    const add = (handler) => handlers.push(handler)
    return {
      add,
      list: () => handlers,
    }
  }

  const beforeGuards = useCallbacks()
  const beforeResolveGuards = useCallbacks()
  const afterGuards = useCallbacks()

  // 当用户访问： /my/a -> { path: '/my/a', matched: [ my, my/a ] }
  const router = {
    push,
    install(app) {
      app.provide('router', router)
      let reactiveObj = {}
      for (let key in START_LOCATION) {
        reactiveObj[key] = computed(() => currentLocation.value[key])
      }
      app.provide('location', reactive(reactiveObj))
      // 核心注册两个组件
      app.component('RouterLink', RouterLink)
      app.component('RouterView', RouterView)
      // 让所有的子组件可以获取到路由 provide globalProperties
    },
    beforeEach: beforeGuards.add,
    beforeResolve: beforeResolveGuards.add,
    afterEach: afterGuards.add,
  }
  return router
}
