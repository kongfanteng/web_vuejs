<script setup lang="ts">
import { ref } from 'vue'
const isOpen = ref(false)
</script>

<template>
  <button @click="isOpen = true">打开弹窗</button>
  <Teleport to="body">
    <div v-if="isOpen">
      Teleport 弹窗 <button @click="isOpen = false">关闭</button>
    </div>
  </Teleport>
</template>

