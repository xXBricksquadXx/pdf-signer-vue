<template>
  <div class="app">
    <header class="app-header">
      <h1>Doc → PDF & Signer</h1>
      <nav>
        <RouterLink to="/sign">Sign PDF</RouterLink>
        <RouterLink to="/convert">Convert Document</RouterLink>
      </nav>
    </header>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup></script>

<style scoped>
.app {
  min-height: 100vh;
  background: #020617;
  color: #e5e7eb;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #1f2937;
}
nav {
  display: flex;
  gap: 1rem;
}
a {
  color: #9ca3af;
  text-decoration: none;
  font-size: 0.9rem;
}
a.router-link-active {
  color: #f9fafb;
  font-weight: 600;
}
.app-main {
  padding: 1.5rem;
}
</style>
