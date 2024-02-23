import { defineStore } from 'pinia'

// id 必须是唯一的，否则会覆盖；
// ssr -> state 要求都是函数；date: {}; date(){};
export const useCounterStore = defineStore('counter', {
  state: () => {
    return {
      count: 0,
    }
  },
  getters: {
    double() {
      return this.count * 2
    },
  },
  actions: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    },
  },
  persist: true,
})
// {counter -> store
// todo -> store
// user -> store}
