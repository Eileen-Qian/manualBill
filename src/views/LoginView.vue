<script>
import axios from 'axios';

export default {
  data() {
    return {
      
    };
  },
  mounted() {
    console.log(axios);
  },
};
</script>

<template>
  <div class="login">
    <h1>This is an login page</h1>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .login {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
