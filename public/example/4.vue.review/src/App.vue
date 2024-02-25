<script setup lang="ts">
import AsyncComponent from './components/AsyncComponent.vue'
</script>
<template>
  <Suspense>
    <template #default>
      <AsyncComponent></AsyncComponent>
    </template>
    <template #fallback> loading </template>
  </Suspense>
</template>
