<template>
  <div class="about">
    <h1>This is an about page</h1>
  </div>
</template>
<script>
export default {
  name: 'AboutView',
  beforeRouteEnter() {
    console.log('组件进入 beforeRouteEnter')
  },
}
</script>
