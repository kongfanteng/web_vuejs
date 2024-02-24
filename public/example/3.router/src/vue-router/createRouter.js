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
      console.log('to:', to)
      from = currentLocation.value
      debugger
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

  function pushWithRedirect(to) {
    const from = currentLocation.value
    to = matcher.resolve(to.value || to)
    // 有 to 和 from 监控路径的变化，后续可以更新路径
    // 跳转路由+监听
    finalNavigation(to, from)
  }
  function push(to) {
    return pushWithRedirect(to)
  }
  if (currentLocation.value === START_LOCATION) {
    // 第一次加载路由，根据路径找到组件将他放入到 START_LOCATION 中
    push(history.location) // 默认的跳转
  }
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
  }
  return router
}
