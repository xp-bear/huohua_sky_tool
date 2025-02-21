// axiosConfig.js
const axios = require("axios");
const { readCache } = require("./tool.js");

// 创建一个 axios 实例
const instance = axios.create({
  headers: {},
});

// 添加请求拦截器
instance.interceptors.request.use(
  function (config) {
    // 在发送请求之前做些什么
    // console.log("Request sent:", config.url);
    return config;
  },
  function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// 添加响应拦截器
instance.interceptors.response.use(
  function (response) {
    // 对响应数据做点什么
    // console.log("Response received:", response.config.url);
    return response.data;
  },
  function (error) {
    // 对响应错误做点什么
    return Promise.reject(error);
  }
);

// 导出配置好的 axios 实例
module.exports = instance;
