<script>
import axios from 'axios';
import router from '@/router';

const Api = 'http://219.85.163.90:5010'

export default {
  data() {
    return {
      // login
      user: {
        account: '',
        password: '',
      },
    }
  },
  methods: {
    // login
    login() {
      const loginApi = `${Api}/redeemdb/main/login`;
      axios
        .post(loginApi, { target: this.user })
        .then((response) => {
          if (response.data.returnCode == 0) {
            const account = btoa(escape(response.data.data.account))
            alert(response.data.message);
            this.$router.push({ name: 'home' });
            sessionStorage.setItem("car_in_manual", response.data.data.token);
            sessionStorage.setItem("account", account);
            sessionStorage.setItem("id", response.data.data.id);
            sessionStorage.setItem("c", response.data.data.companyId);
          } else if (response.data.returnCode == 400) {
            alert(response.data.message)
          }
        })
    },
    checkLogin() {
      if (sessionStorage.getItem('car_in_manual')) {
        alert("已登入，即將跳轉頁面")
        router.push({ name: 'home' });
      }
    },
  },
  mounted() {
    this.checkLogin();
  }
};
</script>

<template>
  <div class="container">
    <div class="row justify-content-center position-absolute top-50 start-50 translate-middle ">
      <h1 class="h3 font-weight-normal text-center loginTitle">
        人工開票
      </h1>
      <div class="col-12 loginForm">
        <form id="form" class="form-signin" @submit.prevent="login">
          <div class="form-floating mb-3">
            <input type="text" class="form-control" v-model="user.account" id="account" placeholder="abcd" required
              autofocus>
            <label for="account">請輸入登入帳號</label>
          </div>
          <div class="form-floating">
            <input type="password" class="form-control" v-model="user.password" id="password" placeholder="Password"
              required>
            <label for="password">請輸入密碼</label>
          </div>
          <button class="btn btn-lg btn-warning text-black d-flex justify-content-center w-50 mx-auto mt-3"
            type="submit">
            登入
          </button>
        </form>
      </div>
    </div>
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

.loginForm {
  background: #ffd965;
  padding: 20px;
}

.loginTitle {
  background: #ffd965;
  padding: 10px;
}

.btnMain {
  background: #FEC107;
}

.btnMain:hover {
  background: #ffc825;
}
</style>
