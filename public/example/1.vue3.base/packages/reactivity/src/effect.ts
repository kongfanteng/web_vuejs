export let activeEffect: ReactiveEffect = undefined
class ReactiveEffect {
  parent = undefined
  deps = [] // effect 中记录那些属性在 effect
  constructor(public fn) {}
  run() {
    try {
      this.parent = activeEffect
      // 利用js单线程特性，先放在全局，在取值
      activeEffect = this
      // 运行时，将属性和对应effect关联
      this.fn() // 触发属性的 get
    } finally {
      activeEffect = undefined
      activeEffect = this.parent
    }
  }
}
// QR: 属性和 effect 关系？n:n
export function effect(fn) {
  // 用户函数变成响应式函数
  const _effect = new ReactiveEffect(fn)
  // 默认执行一次
  _effect.run()
}
