## vuex vs pinia

- `pnpm create vite`; name => 2.pinia-project
- `cd 2.pinia-project`; `pnpm install pinia`;
- pinia 直接用 ts 来编写的，类型提示友好 vuex4 是为了 vue3 来服务的，vuex3 是为 vue2 服务的（vue4 只是简单改了一下 vuex3 让它支持了 vue3），vue3 的开发配合 pinia 更好一些
- vuex mutation 和（action?）的区别
  - component -> dispatch(action) 公共的异步逻辑??? -> commit(mutation)
  - component -> commit(mutation)
- pinia 中直接通过 action 来操作状态即可
- vuex optionsAPI 辅助方法（mapGetter mapMutation, createNameSpaceHelpers）this
- pinia 支持 compositionApi 可以不再通过 this 了
- vuex 模板的概念，modules: { namespaced: true } 树结构，操作数据调用的时候太长，命名冲突问题； $store.state.a.a
- vuex 是单例的，pinia 用的多个，每一个功能一个 store。不用担心命名冲突问题，不再有嵌套问题；
- pinia 支持 devtool，也支持 optionsApi
<!--
const state = {
  state: {},
  modules: {
    a: {
      state: {a: 1}
    },
    b: {}
  }
}
-->

## piniaApi

- createPinia
- defineStore
- scope 最外层状态，作用域；
- scope.stop 停止更新；
- id+options
- options = {id: xx}
- id+setup
- 无，缓存 store
- option -> setup
- $set
