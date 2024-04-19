<script>
import axios from 'axios';
import router from '@/router';

import 'bootstrap';

import { Modal } from 'bootstrap';

import moment from 'moment';

const Api = 'http://219.85.163.90:5010'

let ticketModal = null;
let deleteTicketModal = null;
let changePasswordModal = null;

export default {
  data() {
        return {
            password: '',
            checkPassword: '',
            isLoading: false,
            tickets: [],
            tempTicket: {},
            isNewTicket: false, // 用來確認新增或編輯場站
            stations: [],
            searchData: {}, // 未繳費列表搜尋
            stationId: '',
            companyId: '',
            userId: '',
            user: '',
            paidSearchData: {}, // 繳費紀錄搜尋區間
            paidTickets: [], // 繳費紀錄列表
        }
    },
    methods: {
        openChangePasswordModal() {
            changePasswordModal.show();
        },
        changePassword() {
            const changePasswordApi = `${Api}/redeemdb/main/updatePassword/${this.userId}`;
            if (this.password !== this.checkPassword) {
                alert('兩次密碼不相符，請再次確認')
            } else {
                axios
                    .put(changePasswordApi, { target: { password: this.password } })
                    .then((response) => {
                        if (response.data.message == '修改成功') {
                            changePasswordModal.hide();
                            this.password = '';
                            alert("修改成功～請重新登入");
                            this.logOut();
                        }
                    })
            }
        },
        logOut() {
            const logOutApi = `${Api}/redeemdb/main/logOut`
            axios
                .post(logOutApi)
                .then((response => {
                    alert(response.data.message);
                    sessionStorage.removeItem("car_in_manual");
                    sessionStorage.removeItem("account");
                    sessionStorage.removeItem("id");
                    sessionStorage.removeItem("companyId");
                    router.push({ name: 'login' });
                }));
        },
        checkLogin() {
            if (sessionStorage.getItem('car_in_manual')) {
                this.companyId = sessionStorage.getItem('c');
                // this.user = sessionStorage.getItem('account');
                this.user = unescape(atob(sessionStorage.getItem('account')));
                this.userId = sessionStorage.getItem('id')
                this.getStations()
                // this.getInfos();
            } else {
                alert("請登入");
                this.$router.push({ name: 'login' });
            }
        },
        // 取場站列表
        getStations() {
            const getStationsApi = `${Api}/redeemdb/main/staionId`;
            axios
                .post(getStationsApi, { target: { companyId: this.companyId } })
                .then((response) => {
                    this.stations = response.data;
                    this.stationId = response.data[0].id // 預設為第一個場站
                    this.paidSearchData.stationId = response.data[0].id // 繳費紀錄頁預設為第一個場站
                    this.getInfos();
                })
        },
        // 取個別未繳費資訊
        getInfos() {
            this.isLoading = true;
            const getInfosApi = `${Api}/redeemdb/main/Info`;
            const cantFindArea = document.querySelector('.cantFind-Area');
            axios
                .post(getInfosApi, { target: { stationId: this.stationId } })
                .then((response) => {
                    this.tickets = response.data;
                    if (this.tickets.length > 0) {
                        this.getOrganizedInfos();
                        cantFindArea.classList.remove('block');
                    } else {
                        cantFindArea.classList.add('block');
                    }
                    this.isLoading = false;
                })
        },
        getOrganizedInfos() {
            // 整合場站名稱至在場資訊列表
            this.stations.forEach(itemA => {
                // 查找所有匹配的項目
                const matchingItemsB = this.tickets.filter(itemB => itemA.id === itemB.stationId);
                // 將每个匹配的項目添加到在場資訊列表中
                matchingItemsB.forEach(matchingItemB => {
                    matchingItemB.name = itemA.name;
                });
            });
        },
        openTicketModal(status, ticket) {
            ticketModal.show();
            if (status === 'create') {
                this.isNewTicket = true;
                this.tempTicket = {};
                if (this.tempTicket.parkingType == "多日車") {
                    this.tempTicket.payAmount = 0;
                }
            } else if (status === 'edit') {
                if (this.tempTicket.arrivalTime != undefined || this.tempTicket.time_limit != undefined) {
                    this.tempTicket.arrivalTime = this.tempTicket.arrivalTime.split('T')[0] + ' ' + this.tempTicket.arrivalTime.split('T')[1];
                    // this.tempTicket.time_limit = this.tempTicket.time_limit.split('T')[0] + ' ' + this.tempTicket.time_limit.split('T')[1];
                }
                this.isNewTicket = false;
                this.tempTicket = Object.assign({}, ticket);
                this.tempTicket.time_limit = this.tempTicket.time_limit.split(' ')[0] + 'T' + this.tempTicket.time_limit.split(' ')[1];
            }
            // 恢复页面滚动位置，保持提交表单前的滚动位置
            const { scrollX, scrollY } = window;
            setTimeout(() => {
                window.scrollTo(scrollX, scrollY);
            }, 0);
        },
        openDeleteTicketModal(ticket) {
            this.tempTicket = Object.assign({}, ticket);
            deleteTicketModal.show();
            // 恢复页面滚动位置，保持提交表单前的滚动位置
            const { scrollX, scrollY } = window;
            setTimeout(() => {
                window.scrollTo(scrollX, scrollY);
            }, 0);
        },
        updateTicket() {
            let updateTicketApi = `${Api}/redeemdb/main/createInfo`
            if (this.isNewTicket) {
                this.tempTicket.arrivalTime = this.tempTicket.arrivalTime.split('T')[0] + ' ' + this.tempTicket.arrivalTime.split('T')[1];
                this.tempTicket.time_limit = moment().add(1, 'days').endOf('day').format("YYYY-MM-DD HH:mm:ss");
                this.tempTicket.createUser = this.user;
                this.tempTicket.companyId = this.companyId;
                axios
                    .post(updateTicketApi, { target: this.tempTicket })
                    .then((response) => {
                        if (this.tempTicket.parkingType == "多日車") {
                            this.tempTicket.payAmount = 0;
                        }
                        alert(response.data.message);
                        this.getInfos();
                    })
                ticketModal.hide();
            } else {
                updateTicketApi = `${Api}/redeemdb/main/updateInfo/${this.tempTicket.id}`;
                this.tempTicket.time_limit = this.tempTicket.time_limit.split('T')[0] + ' ' + this.tempTicket.time_limit.split('T')[1];
                axios
                    .put(updateTicketApi, { target: this.tempTicket })
                    .then((response) => {
                        alert(response.data.message);
                        this.getInfos();
                    })
                ticketModal.hide();
            }
            // 恢复页面滚动位置，保持提交表单前的滚动位置
            const { scrollX, scrollY } = window;
            setTimeout(() => {
                window.scrollTo(scrollX, scrollY);
            }, 0);
        },
        deleteTicket() {
            const deleteTicketApi = `${Api}/redeemdb/main/deleteInfo/${this.tempTicket.id}`;
            axios
                .patch(deleteTicketApi, { target: { deleteUser: this.user } })
                .then((response) => {
                    alert(response.data.message)
                    // console.log(response.data);
                    this.getInfos();
                })
            deleteTicketModal.hide();
            const { scrollX, scrollY } = window;
            setTimeout(() => {
                window.scrollTo(scrollX, scrollY);
            }, 0);
        },
        // 搜尋
        search() {
            this.isLoading = true;
            const searchDataApi = `${Api}/redeemdb/main/searchInfo`;
            const cantFindArea = document.querySelector('.cantFind-Area');
            cantFindArea.classList.remove('block');
            this.searchData.stationId = this.stationId;
            if (this.searchData.plate == '') {
                alert('請輸入車牌號碼搜尋')
            } else {
                axios
                    .post(searchDataApi, { target: this.searchData })
                    .then((response) => {
                        this.tickets = response.data.data;
                        if (response.data.message == '查詢成功') {
                            this.getOrganizedInfos();
                            cantFindArea.classList.remove('block');
                        } else if (response.data.message == '查無車號') {
                            cantFindArea.classList.add('block');
                        }
                        this.isLoading = false;
                    })
            }

        },
        // 清除搜尋
        clearSearch() {
            this.getInfos();
            const cantFindArea = document.querySelector('.cantFind-Area');
            cantFindArea.classList.remove('block');
            document.getElementById('search').value = "";
        },
        // 繳費紀錄搜尋
        paidSearch() {
            this.isLoading = true;
            const paidSearchApi = `${Api}/redeemdb/main/searchTransaction`;
            const cantFindPaidArea = document.querySelector('#cantFind-Area');
            if (this.paidSearchData.startDate == undefined || this.paidSearchData.endDate == undefined) {
                alert('日期不得為空');
                this.isLoading = false;
            } else if (this.paidSearchData.startDate > this.paidSearchData.endDate) {
                alert('選擇區間有誤，請重新選擇');
                this.isLoading = false;
            } else {
                axios
                    .post(paidSearchApi, { target: this.paidSearchData })
                    .then((response) => {
                        this.paidTickets = response.data;
                        if (this.paidTickets.length == 0) {
                            cantFindPaidArea.classList.add('block');
                        } else if (this.paidTickets.length > 0) {
                            cantFindPaidArea.classList.remove('block');
                        }
                        this.isLoading = false;
                    })
            }
        },
        openModal() {
      const myModal = this.$refs.myModal;
      const bootstrapModal = new window.bootstrap.Modal(myModal);
      bootstrapModal.show();
    },
    closeModal() {
      const myModal = this.$refs.myModal;
      const bootstrapModal = new window.bootstrap.Modal(myModal);
      bootstrapModal.hide();
    }
    },
    
    mounted() {
        this.checkLogin();
        // this.getStations();
        // this.getInfos();
        ticketModal = new Modal('#ticketModal');
        deleteTicketModal = new Modal('#deleteTicketModal');
        changePasswordModal = new Modal('#changePasswordModal');
    }
}

</script>

<template>
    <div class="container">
    <div class="header my-3">
      <nav>
        <div class="nav nav-tabs custom-tabs" id="nav-tab" role="tablist">
          <button class="nav-link active" id="nav-unpaid-tab" data-bs-toggle="tab" data-bs-target="#nav-unpaid"
            type="button" role="tab" aria-controls="nav-unpaid" aria-selected="true">未繳費清單</button>
          <button class="nav-link" id="nav-paid-tab" data-bs-toggle="tab" data-bs-target="#nav-paid" type="button"
            role="tab" aria-controls="nav-paid" aria-selected="false">繳費紀錄</button>
        </div>
      </nav>
    </div>

    <div class="tab-content" id="nav-tabContent">
      <!-- unpaid-list -->
      <div class="tab-pane fade show active" id="nav-unpaid" role="tabpanel" aria-labelledby="nav-unpaid-tab">
        <div class="unpaid-md">
          <div class="mb-3 my-3">
            <form class="d-flex justify-content-between align-items-center">
              <div class="w-25 form-floating mb-3">
                <select class="form-select" id="floatingSelect" aria-label="Floating label select example" required
                  v-model="stationId" @change="getInfos">
                  <option disabled>請選擇公司</option>
                  <option v-for="station in stations" :key="station.id" :value="station.id">{{
                    station.name }}</option>
                </select>
                <label for="floatingSelect">請選擇公司</label>
              </div>
              <div>
                <button type="button" class="btn btn-warning text-black me-2"
                  @click="openChangePasswordModal">修改密碼</button>
                <button type="button" class="btn btn-outline-warning text-black" @click="logOut">登出</button>
              </div>
            </form>
            <div class="d-flex justify-content-between">
              <div class="d-flex justify-content-between">
                <form class="d-flex">
                  <input v-model="searchData.plate" class="form-control me-2" type="search" placeholder="輸入車牌搜尋"
                    aria-label="Search" style="width: 150px;" @keyup.enter="search(searchdata)" id="search">
                  <button class="btn btn-warning text-black me-2" type="button" @click="search(searchdata)">搜尋</button>
                  <button class="btn btn-outline-warning text-black" type="submit" @click="clearSearch">清除搜尋結果</button>
                </form>
                <button type="button" class="btn btn-warning mx-5" @click="openTicketModal('create')"
                  data-bs-target="#ticketModal">
                  新增
                </button>
              </div>

            </div>
          </div>
        </div>
        <div class="unpaid-sm">
          <form class="d-flex justify-content-between align-items-center">
            <div class="w-50 form-floating mb-3">
              <select class="form-select" id="unpaidStationId-search" aria-label="Floating label select example"
                required v-model="stationId" @change="getInfos">
                <option disabled>請選擇公司</option>
                <option v-for="station in stations" :key="station.id" :value="station.id">{{
                    station.name }}</option>
              </select>
              <label for="floatingSelect">請選擇公司</label>
            </div>
            <div>
              <button type="button" class="btn btn-warning text-black me-2"
                @click="openChangePasswordModal">修改密碼</button>
              <button type="button" class="btn btn-outline-warning text-black" @click="logOut">登出</button>
            </div>
          </form>

          <form>
            <input v-model="searchData.plate" class="form-control me-2" type="search" placeholder="輸入車牌搜尋"
              aria-label="Search" @keydown.enter="search(searchdata)" id="unpaid-search">
            <div class="d-flex justify-content-between my-2">
              <div>
                <button class="btn btn-warning text-black me-2" type="button" @click="search(searchdata)">搜尋</button>
                <button class="btn btn-outline-warning text-black" type="submit" @click="clearSearch">清除搜尋結果</button>
              </div>
              <button type="button" class="btn btn-warning" @click="openTicketModal('create')"
                data-bs-target="#ticketModal">
                新增
              </button>
            </div>
          </form>

        </div>
        <div v-if="isLoading" class="d-flex justify-content-center">
          <img src="/loading.svg" alt="loading">
        </div>
        <!-- 查無資料 -->
        <div class="cantFind-Area">
          <h3>查無相關資料，請重新輸入</h3>
        </div>
        <div v-if="!isLoading" class="table-responsive">
          <table class="table table-bordered table-striped">
            <thead>
              <tr class="col text-center sticky-top">
                <th class="col text-center bg-warning"></th>
                <th class="col text-center bg-warning">業者</th>
                <th class="col text-center bg-warning">停車地點</th>
                <th class="col text-center bg-warning">車牌號</th>
                <th class="col text-center bg-warning">停車種類</th>
                <th class="col text-center bg-warning">入場時間</th>
                <th class="col text-center bg-warning">金額</th>
                <th class="col text-center bg-warning">繳費期限</th>
                <th class="col text-center bg-warning">備註</th>
                <th class="col text-center bg-warning">修改</th>
                <th class="col text-center bg-warning">建立人員</th>
              </tr>
            </thead>
            <tbody class="fs-6">
              <tr v-for="( ticket ) in tickets" :key="ticket.id" class="text-center">
                <td><img src="/delete.png" @click="openDeleteTicketModal(ticket)" alt="delete"
                    style="width: 25px; cursor: pointer;" class="delete">
                </td>
                <td>{{ ticket.name }}</td>
                <td>{{ ticket.parkName }}</td>
                <td>{{ ticket.plate }}</td>
                <td>{{ ticket.parkingType }}</td>
                <td>{{ ticket.arrivalTime }}</td>
                <td>{{ ticket.payAmount }}</td>
                <td>{{ ticket.time_limit }}</td>
                <td>{{ ticket.message }}</td>
                <td class="d-flex justify-content-around">
                  <a href="#" @click="openTicketModal('edit', ticket)"><img src="/edit.png" alt="edit"
                      style="width: 25px;"></a>
                </td>
                <td>{{ ticket.createUser }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 開票/編輯 modal -->
        <div class="modal fade" id="ticketModal" tabindex="-1" aria-labelledby="ticketModalLabel" aria-hidden="true"
          data-bs-backdrop="static">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header bg-warning">
                <h5 class="modal-title" id="ticketModalLabel">{{ isNewTicket ? '開票' : '編輯開單資訊' }}
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <form id="myForm" v-if="isNewTicket" @submit.prevent="updateTicket">
                  <div class="form-floating mb-3">
                    <select class="form-select" id="floatingSelect" aria-label="Floating label select example" required
                      v-model="tempTicket.stationId">
                      <option disabled>請選擇公司</option>
                      <option v-for="station in stations" :key="station.id" :value="station.id">{{
                    station.name }}</option>
                    </select>
                    <label for="floatingSelect">請選擇公司</label>
                  </div>

                  <div class="form-floating mb-3">
                    <input type="text" class="form-control" id="floatingInput" v-model="tempTicket.parkName" required>
                    <label for="floatingInput">請輸入場站名稱</label>
                  </div>

                  <div class="form-floating mb-3">
                    <input type="text" class="form-control" id="floatingInput" v-model="tempTicket.plate" required>
                    <label for="floatingInput">請輸入車號</label>
                  </div>

                  <div class="form-floating mb-3">
                    <select class="form-select" id="floatingSelect" aria-label="Floating label select example" required
                      v-model="tempTicket.parkingType">
                      <option disabled>請選擇停車種類</option>
                      <option>臨停</option>
                      <option>多日車</option>
                    </select>
                    <label for="floatingSelect">請選擇停車種類</label>
                  </div>

                  <div class="form-floating mb-3">
                    <input type="datetime-local" class="form-control" id="floatingInput" step="1"
                      v-model="tempTicket.arrivalTime" required>
                    <label for="floatingInput">請輸入入場時間</label>
                  </div>

                  <div class="form-floating mb-3" v-if="tempTicket.parkingType != '多日車'">
                    <input type="number" class="form-control" id="floatingInput"
                      v-model="tempTicket.payAmount" required>
                    <label for="floatingInput">請輸入金額</label>
                  </div>

                  <!-- <div class="form-floating mb-3">
                    <input type="datetime-local" class="form-control" id="floatingInput" step="1" v-model="tempTicket.time_limit" required>
                    <label for="floatingInput">請輸入繳費期限</label>
                  </div> -->

                  <div class="form-floating mb-3">
                    <input type="text" class="form-control" id="floatingInput" v-model="tempTicket.message">
                    <label for="floatingInput">請輸入備註</label>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">取消</button>
                    <button type="submit" id="submitButton" class="btn btn-warning">確認</button>
                  </div>
                </form>
                <form id="myForm" v-else @submit.prevent="updateTicket">
                  <div class="form-floating mb-3">
                    <select class="form-select" id="tempStationId" aria-label="Floating label select example" required
                      v-model="tempTicket.stationId" disabled>
                      <option disabled>請選擇公司</option>
                      <option v-for="station in stations" :key="station.id" :value="station.id">{{
                    station.name }}</option>
                    </select>
                    <label for="floatingSelect">請選擇公司</label>
                  </div>

                  <div class="form-floating mb-3">
                    <input type="text" class="form-control" id="tempParkName" v-model="tempTicket.parkName" required
                      disabled>
                    <label for="floatingInput">請輸入場站名稱</label>
                  </div>

                  <div class="form-floating mb-3">
                    <input type="text" class="form-control" id="tempPlate" v-model="tempTicket.plate" required disabled>
                    <label for="floatingInput">請輸入車號</label>
                  </div>

                  <div class="form-floating mb-3">
                    <select disabled class="form-select" id="tmpParkingType" aria-label="Floating label select example"
                      required v-model="tempTicket.parkingType">
                      <option disabled>請選擇停車種類</option>
                      <option>臨停</option>
                      <option>多日車</option>
                    </select>
                    <label for="floatingSelect">請選擇停車種類</label>
                  </div>

                  <div class="form-floating mb-3">
                    <input disabled type="datetime-local" class="form-control" id="tempArrivalTime" step="1"
                      v-model="tempTicket.arrivalTime" required>
                    <label for="floatingInput">請輸入入場時間</label>
                  </div>

                  <div class="form-floating mb-3">
                    <input type="number" class="form-control" id="tempPayAmount" v-model="tempTicket.payAmount"
                      required>
                    <label for="floatingInput">請輸入金額</label>
                  </div>

                  <div class="form-floating mb-3">
                    <input type="datetime-local" class="form-control" id="tempTime_limit" step="1"
                      v-model="tempTicket.time_limit" required>
                    <label for="floatingInput">請輸入繳費期限</label>
                  </div>

                  <div class="form-floating mb-3">
                    <input type="text" class="form-control" id="floatingInput" v-model="tempTicket.message">
                    <label for="floatingInput">請輸入備註</label>
                  </div>

                  <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">取消</button>
                    <button type="submit" id="updateButton" class="btn btn-warning">確認</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <!-- 刪除 modal -->
        <div class="modal fade" id="deleteTicketModal" tabindex="-1" aria-labelledby="deleteTicketModalLabel"
          aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header bg-warning">
                <h5 class="modal-title" id="deleteTicketModalLabel">請確認刪除資訊</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <form id="myDeleteForm" @submit.prevent="deleteTicket">
                  <p>停車地點：<span>{{ tempTicket.parkName }}</span></p>
                  <p>車牌號碼：<span>{{ tempTicket.plate }}</span></p>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">取消</button>
                    <button type="submit" id="submitButton" class="btn btn-warning">確認</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- paid-detail -->
      <div class="tab-pane fade show" id="nav-paid" role="tabpanel" aria-labelledby="nav-paid-tab">
        <div class="paid-md">
          <div class="d-flex justify-content-around mb-2 align-items-center">
            <form class="w-50">
              <div class="form-floating mb-3">
                <select class="form-select" id="paidStationId" aria-label="Floating label select example" required
                  v-model="paidSearchData.stationId">
                  <option disabled>請選擇公司</option>
                  <option v-for="station in stations" :key="station.id" :value="station.id">{{ station.name }}
                  </option>
                </select>
                <label for="floatingSelect">請選擇公司</label>
              </div>
            </form>
            <section>
              <input type="date" class="pe-3 me-2" v-model="paidSearchData.startDate">
              <input type="date" class="pe-3 me-2" v-model="paidSearchData.endDate">
            </section>
            <button type="submit" class="btn btn-warning ms-3" @click="paidSearch(paidSearchData)">
              搜尋
            </button>
            <button type="button" class="btn btn-warning text-black me-2" @click="openChangePasswordModal">修改密碼</button>
            <button type="button" class="btn btn-outline-warning text-black" @click="logOut">登出</button>
          </div>
        </div>
        <div class="paid-sm">
          <form>
            <div class="form-floating mb-3">
              <select class="form-select" id="paidStationId-sm" aria-label="Floating label select example" required
                v-model="paidSearchData.stationId">
                <option disabled>請選擇公司</option>
                <option v-for="station in stations" :key="station.id" :value="station.id">{{ station.name }}
                </option>
              </select>
              <label for="floatingSelect">請選擇公司</label>
            </div>
          </form>
          <section class="d-flex justify-content-between">
            <input type="date" class="pe-3 me-2" v-model="paidSearchData.startDate">
            <input type="date" class="pe-3 me-2" v-model="paidSearchData.endDate">
          </section>
          <div class="d-flex justify-content-between align-items-center">
            <button type="submit" class="btn btn-warning my-2 me-2" @click="paidSearch(paidSearchData)">
              搜尋
            </button>
            <div>
              <button type="button" class="btn btn-warning text-black me-2"
                @click="openChangePasswordModal">修改密碼</button>
              <button type="button" class="btn btn-outline-warning text-black" @click="logOut">登出</button>
            </div>
          </div>
        </div>
        <div v-if="isLoading" class="d-flex justify-content-center">
          <img src="/loading.svg" alt="loading">
        </div>
        <!-- 查無資料 -->
        <div class="cantFind-Area" id="cantFind-Area">
          <h3>查無相關資料，請重新輸入</h3>
        </div>
        <div v-if="!isLoading" class="table-responsive">
          <table class="table table-bordered table-striped">
            <thead class="sticky-top">
              <tr class="tt col text-center">
                <th class="col text-center bg-warning">交易 ID</th>
                <th class="col text-center bg-warning">車號</th>
                <th class="col text-center bg-warning">電話</th>
                <th class="col text-center bg-warning">入場時間</th>
                <th class="col text-center bg-warning">交易時間</th>
                <th class="col text-center bg-warning">交易金額</th>
                <th class="col text-center bg-warning">交易狀態</th>
                <th class="col text-center bg-warning">交易類型</th>
                <th class="col text-center bg-warning">支付交易代號</th>
                <th class="col text-center bg-warning">發票號碼</th>
                <th class="col text-center bg-warning">發票日期</th>
                <th class="col text-center bg-warning">退款原因</th>
              </tr>
            </thead>
            <tbody class="fs-6">
              <tr v-for="( item ) in paidTickets" :key="item.id" class="text-center">
                <td>{{ item.transactionOrderID }}</td>
                <td>{{ item.PlateNumber }}</td>
                <td>{{ item.Phone }}</td>
                <td>{{ item.ArrivalTime }}</td>
                <td>{{ item.PayTime }}</td>
                <td>{{ item.PayAmount }}</td>
                <td>{{ item.Status }}</td>
                <td>{{ item.PayType }}</td>
                <td>{{ item.PlatformTransactionID }}</td>
                <td>{{ item.invoice }}</td>
                <td>{{ item.invoiceDate }}</td>
                <td>{{ item.RefundMessage }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal fade" id="changePasswordModal" tabindex="-1" aria-labelledby="changePasswordModalLabel"
        aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-warning">
              <h5 class="modal-title" id="changePasswordModalLabel">修改密碼</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="changePassword" @submit.prevent="changePassword">
                <div class="form-floating mb-3">
                  <input type="password" class="form-control" id="password" v-model="password" required>
                  <label for="floatingInput">請輸入新密碼</label>
                </div>
                <div class="form-floating mb-3">
                  <input type="password" class="form-control" v-model="checkPassword" required>
                  <label for="floatingInput">請再次輸入新密碼</label>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">取消</button>
                  <button type="submit" id="changePasswordBtn" class="btn btn-warning">確認</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* 無搜尋結果 */
.cantFind-Area {
	display: none;
	margin-top: 70px;
	text-align: center;

	h3 {
		font-size: 2rem;
		margin-bottom: 50px;
		font-weight: bold;
	}

	img {
		margin: 0 auto;
	}
}

.block {
	display: block;
}

/* 修改 nav 文字顏色 */
.custom-tabs .nav-link {
	color: #000000;
}

/* 修改 nav active 樣式 */
.nav-tabs .nav-item.show .nav-link,
.nav-tabs .nav-link.active {
	background-color: #ffc107 !important;
	color: #000000;
}

.paid-sm {
	display: none;
}

.unpaid-sm{
	display: none;
}

.table-responsive {
	width: 100%;
	height: 60vh;
}

@media (max-width: 768px) {
	.paid-md {
		display: none;
	}

	.paid-sm {
		display: block;
	}

	.unpaid-md{
		display: none;
	}

	.unpaid-sm{
		display: block;
	}
}
</style>
