<template>
  <div>组件真正要渲染的内容</div>
</template>
<script setup lang="ts">
await new Promise((resolve) => {
  setTimeout(() => {
    resolve('')
  }, 3000)
})
</script>
