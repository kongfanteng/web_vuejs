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
