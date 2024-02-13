import { recordEffectScope } from "./effectScope"

export let activeEffect: ReactiveEffect = undefined

function cleanupEffect(effect: ReactiveEffect) {
  // { name: set(effect) } 属性对应的effect
  // 找到 deps 中的 set，清理掉 effect 才可以
  let deps = effect.deps
  for (let i = 0; i < deps.length; i++) {
    // effect.deps  =[newSet(),newSet(),newSet()]
    deps[i].delete(effect) // 删除掉 set 中的 effect
  }
  effect.deps.length = 0 // 清空 deps
}

export class ReactiveEffect {
  parent = undefined
  deps = [] // effect 中记录那些属性在 effect
  active = true
  constructor(public fn, public scheduler?) {
    recordEffectScope(this)
  }
  run() {
    if (!this.active) {
      return this.fn()
    }
    try {
      this.parent = activeEffect
      // 利用js单线程特性，先放在全局，在取值
      activeEffect = this
      cleanupEffect(this)
      // 运行时，将属性和对应effect关联
      return this.fn() // 触发属性的 get
    } finally {
      activeEffect = undefined
      activeEffect = this.parent
    }
  }
  stop() {
    if (this.active) {
      cleanupEffect(this)
      this.active = false
    }
  }
}
// QR: 属性和 effect 关系？n:n
export function effect(fn, options: any = {}) {
  // 用户函数变成响应式函数
  const _effect = new ReactiveEffect(fn, options.scheduler)
  // 默认执行一次
  _effect.run()
  const runner = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}
