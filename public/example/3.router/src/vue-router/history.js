function createCurrentLocation(base) {
  // 构建当前的路径信息和状态
  const { pathname, search, hash } = window.location
  let pos = base.indexOf('#')
  if (pos > -1) {
    return hash.slice(1) || '/' // 获取 hash 路径
  }
  return pathname + search + hash
}
function buildState(
  back,
  current,
  forward,
  replaced = false,
  computedScroll = false
) {
  return {
    back,
    current,
    forward,
    replaced,
    computedScroll: computedScroll
      ? { x: window.pageXOffset || 0, y: window.pageYOffset || 0 }
      : {},
    position: window.history.length - 1,
  }
}
function useHistoryStateNavigation(base) {
  // 构建当前的路径信息和状态
  const { history, location } = window
  // vue ref
  let currentLocation = {
    value: createCurrentLocation(base),
  }
  let historyState = {
    // 当前路径信息
    value: history.state,
  }
  if (!historyState.value) {
    // 根据页面构建出初始状态
    changeLocation(
      currentLocation.value,
      buildState(null, currentLocation.value, null, true),
      true
    )
  }
  function changeLocation(to, state, replaced = false) {
    const pos = base.indexOf('#')
    to = pos > -1 ? base + to : to
    window.history[replaced ? 'replaceState' : 'pushState'](state, null, to)
    historyState.value = state
  }
  function push(to, state) {
    // 跳转
    const currentState = Object.assign({}, historyState.value, {
      forward: to,
      computedScroll: { x: window.pageXOffset, y: window.pageYOffset },
    })
    // 跳转前，先将 state 更新到 historyState 中
    changeLocation(currentState.current, currentState, true)
    // 跳转后
    const nextState = Object.assign(
      {},
      buildState(currentState.current, to, null),
      state
    )
    changeLocation(to, nextState)
    currentLocation.value = to // 更新跳转路径
  }
  function replace(to, state) {
    const currentState = Object.assign(
      {},
      buildState(historyState.value.back, to, historyState.value.forward),
      state
    )
    changeLocation(to, currentState, true)
    currentLocation.value = to // 更新跳转路径 replace；
  }
  return {
    location: currentLocation, // 当前路径状态
    state: historyState, // 浏览器历史的信息状态
    push,
    replace,
  }
}

function useHistoryListeners({ location, state: historyState }, base) {
  let listeners = []
  const handler = ({ state }) => {
    const to = createCurrentLocation(base)
    const from = location.value
    const fromState = historyState.value
    location.value = to // 更改后当前的状态需要更新
    historyState.value = state
    listeners.forEach((callback) => callback(to, from, {}))
  }
  window.addEventListener('popstate', handler) // 用户前进后退的逻辑
  function listen(callback) {
    listeners.push(callback)
  }
  return {
    listen,
  }
}

export function createWebHistory(base = '') {
  const historyNavigation = useHistoryStateNavigation(base) // 路径是什么，数据就是什么；
  const historyListeners = useHistoryListeners(historyNavigation, base)
  const routerHistory = Object.assign({}, historyNavigation, historyListeners)
  return routerHistory
}
export function createWebHashHistory() {
  return createWebHistory('#')
}
