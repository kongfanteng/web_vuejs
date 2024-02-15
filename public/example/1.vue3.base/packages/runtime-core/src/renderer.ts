export function createRenderer(options) {
  // 此方法并不关心  options 有谁提供
  return {
    render(vdom, container) {
      // 根据 vdom 和容器
      // 通过 vdom 创建真实 DOM 插入到容器中
    },
  }
}
