<template>
  <div>
    Emit 组件<button>我是按钮</button>
    <h5>hello</h5>
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const color = ref('red')
setTimeout(() => (color.value = 'blue'), 1000)
</script>
<style scoped>
:sloted(.child) {
  color: red;
}
</style>
