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
  // 递归添加路由
  routes.forEach((route) => addRoute(route))
  console.log('matchers:', matchers)
  return {
    addRoute,
  }
}

export function createRouter({ history, routes }) {
  // 路由匹配
  const matcher = createRouterMatcher(routes)
  const router = {
    install(app) {
      // 核心注册两个组件
      app.component('RouterLink', {
        render: (proxy) => {
          return <a>{proxy.$slots.default()}</a>
        },
      })
      app.component('RouterView', {
        render: (proxy) => {
          return <div></div>
        },
      })
      // 让所有的子组件可以获取到路由 provide globalProperties
    },
  }
  return router
}
