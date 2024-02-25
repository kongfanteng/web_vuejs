## 路由的模式

- 前端路由的特点：根据路径的变化，渲染对应的组件；

- hash(#); history(h5API); memory(内存型，不修改 URL 地址);
- hash: 无法做 ssr；history: 可以做 ssr；原因：hash 是前端的锚点，不会发送给后端；hash: 不支持 SEO 优化；
- hash 特点：刷新不出现 404；原因：服务端无法获取；
- hash 缺点：丑；无法 SEO 优化；优点：浏览器兼容性好；

- h5api 优点：好看，用起来方便；缺点：刷新可能出现 404；解决方案：访问无资源重定向首页；

- hash 模式如何实现路径的跳转和监控？ onhashchange + location.hash + popstate（监控 hash 变化）；
- history 模式如何实现路径的跳转和监控？ pushState(跳转) + popstate(前进后退)；
- history.pushState + popstate 来实现即可，不用 hash（不考虑兼容性，采用 pushState 实现两种路由方案）

## 完整的导航解析流程

1. 导航被触发
2. 在失活的组件里调用 beforeRouterLeave 守卫
3. 调用全局的 beforeEach 守卫
4. 在重用的组件里调用 beforeRouteUpdate 守卫
5. 在路由配置里调用 beforeEnter
6. 解析异步路由组件
7. 在被激活的组件里调用 beforeRouteEnter
8. 调用全局的 beforeResolve 守卫
9. 导航被确认
10. 调用全局的 afterEach 钩子
11. 触发 DOM 更新
12. 调用 beforeRouteEnter 守卫中传给 next 的回调函数，创建好的组件实例会作为回调函数的参数传入

- 组件离开 -> 进入另一个组件（先全局，再配置，后组件内） -> 全局的解析完成，全局结束

## 路由逻辑

1. vue 路由中有两种方式 hash+h5Api -> h5Api = popstate + pushState 前端路由
2. 根据路径找到对应匹配的组件，进行安装顺序来渲染，为了保证响应式 shallowRef
3. 生命周期全局钩子 + 将钩子抽离出来 + 转化成 promise + 在组合运行
4. addRoute 动态路由添加
