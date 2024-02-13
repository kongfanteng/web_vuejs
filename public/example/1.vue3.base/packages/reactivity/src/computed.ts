import { isFunction } from '@vue/shared'
import { ReactiveEffect, activeEffect } from './effect'
import { trackEffects, triggerEffects } from './baseHandler'

class ComputedRefImpl {
  effect: ReactiveEffect
  _value
  dep = new Set()
  __v_isRef = true
  _dirty = true
  constructor(public getter, public setter) {
    // 计算属性是effect，让 getter 中的属性收集这个 effect
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true // 计算属性标记脏值
        triggerEffects(this.dep)
      }
    })
  }
  get value() {
    if (activeEffect) {
      // value => [effect]
      trackEffects(this.dep)
    }

    if (this._dirty) {
      this._dirty = false
      // 取值让 getter 执行拿到返回值，作为计算属性的值
      this._value = this.effect.run()
    }

    return this._value
  }
  set value(val) {
    // 修改时触发 setter 即可
    this.setter(val)
  }
}

export function computed(getterOrOptions) {
  const isGetter = isFunction(getterOrOptions)
  let getter
  let setter
  if (isGetter) {
    getter = getterOrOptions
    setter = () => {
      console.warn('computed is readonly')
    }
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  return new ComputedRefImpl(getter, setter)
}
