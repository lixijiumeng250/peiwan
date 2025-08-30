<template>
  <footer class="footer">
    <div class="footer-content">
      <p>&copy; 2024 陪玩管理系统. All rights reserved.</p>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'Footer'
}
</script>

<style scoped>
.footer {
  background-color: #f5f7fa;
  border-top: 1px solid #e4e7ed;
  padding: 20px 0;
}

.footer-content {
  max-width: 1280px;
  margin: 0 auto;
  text-align: center;
  padding: 0 20px;
}

.footer-content p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

@media (max-width: 768px) {
  .footer-content {
    max-width: 375px;
    padding: 0 15px;
  }
}
</style>