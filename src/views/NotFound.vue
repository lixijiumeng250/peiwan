<template>
  <div class="not-found">
    <h1>404</h1>
    <p>页面未找到</p>
    <router-link to="/" class="home-link">返回首页</router-link>
  </div>
</template>

<script>
export default {
  name: 'NotFound'
}
</script>

<style scoped>
.not-found {
  text-align: center;
  padding: 80px 20px;
}

.not-found h1 {
  font-size: 72px;
  color: #909399;
  margin-bottom: 20px;
}

.not-found p {
  color: #606266;
  font-size: 18px;
  margin-bottom: 30px;
}

.home-link {
  color: #409eff;
  text-decoration: none;
  font-size: 16px;
}

.home-link:hover {
  color: #66b1ff;
}
</style>