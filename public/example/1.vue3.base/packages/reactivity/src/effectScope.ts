export let activeEffectScope: EffectScope
class EffectScope {
  effects = []
  parent = null
  scopes: EffectScope[] = [] // 父亲存储儿子的空间
  constructor(detached: boolean) {
    if (!detached && activeEffectScope) {
      activeEffectScope.scopes.push(this)
    }
  }
  run(fn) {
    try {
      activeEffectScope = this
      this.parent = activeEffectScope
      return fn()
    } finally {
      activeEffectScope = this.parent
    }
  }
  stop() {
    // 停止收集所有 effect
    for (let i = 0; i < this.effects.length; i++) {
      this.effects[i].stop()
    }
    // 停止儿子中的 effect
    if (this.scopes.length) {
      for (let i = 0; i < this.scopes.length; i++) {
        this.scopes[i].stop()
      }
    }
  }
}

// 将 effect 放入到当前作用域中
export function recordEffectScope(effect) {
  if (activeEffectScope) {
    activeEffectScope.effects.push(effect)
  }
}

export function effectScope(detached = false) {
  return new EffectScope(detached)
}
