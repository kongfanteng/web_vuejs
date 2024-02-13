# Vue3 中 runtime-dom 节点操作

- reactivity
  - Vue3 中区分了编译（模板编译）和运行时（不关心模板编译）
  - Vue3 区分了是否根据环境来区分操作
- runtime-dom（浏览器操作 api，dom 的增删改查）；runtime-core（不关心调用了哪些 api）；
- compiler-dom（针对 dom 的编译）；compiler-core（非平台相关编译）；
