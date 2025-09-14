<template>
  <div class="layout">
    <Header />
    <main class="main-content">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script>
import Header from './Header.vue'
import Footer from './Footer.vue'

export default {
  name: 'Layout',
  components: {
    Header,
    Footer
  }
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  width: 100%;
  padding: 16px;
}

@media (max-width: 768px) {
  .main-content {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 8px;
  }
}
</style>