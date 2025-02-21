// 定义了一个基于Web Worker的定时器机制，它允许你在不阻塞主线程的情况下执行setInterval和setTimeout操作。
const blobURL = URL.createObjectURL(
  new Blob(
    [
      "(",

      function () {
        const intervalIds = {};

        // 监听message 开始执行定时器或者销毁
        self.onmessage = function onMsgFunc(e) {
          switch (e.data.command) {
            case "interval:start": // 开启定时器
              const intervalId = setInterval(function () {
                postMessage({
                  message: "interval:tick",
                  id: e.data.id,
                });
              }, e.data.interval);

              postMessage({
                message: "interval:started",
                id: e.data.id,
              });

              intervalIds[e.data.id] = intervalId;
              break;
            case "interval:clear": // 销毁
              clearInterval(intervalIds[e.data.id]);

              postMessage({
                message: "interval:cleared",
                id: e.data.id,
              });

              delete intervalIds[e.data.id];
              break;
          }
        };
      }.toString(),

      ")()",
    ],
    { type: "application/javascript" }
  )
);

const worker = new Worker(blobURL);

URL.revokeObjectURL(blobURL);

const workerTimer = {
  id: 0,
  callbacks: {},
  setInterval: function (cb, interval, context) {
    this.id++;
    const id = this.id;
    this.callbacks[id] = { fn: cb, context: context };
    worker.postMessage({
      command: "interval:start",
      interval: interval,
      id: id,
    });
    return id;
  },
  setTimeout: function (cb, timeout, context) {
    this.id++;
    const id = this.id;
    this.callbacks[id] = { fn: cb, context: context };
    worker.postMessage({ command: "timeout:start", timeout: timeout, id: id });
    return id;
  },

  // 监听worker 里面的定时器发送的message 然后执行回调函数
  onMessage: function (e) {
    switch (e.data.message) {
      case "interval:tick":
      case "timeout:tick": {
        const callbackItem = this.callbacks[e.data.id];
        if (callbackItem && callbackItem.fn) callbackItem.fn.apply(callbackItem.context);
        break;
      }

      case "interval:cleared":
      case "timeout:cleared":
        delete this.callbacks[e.data.id];
        break;
    }
  },

  // 往worker里面发送销毁指令
  clearInterval: function (id) {
    worker.postMessage({ command: "interval:clear", id: id });
  },
  clearTimeout: function (id) {
    worker.postMessage({ command: "timeout:clear", id: id });
  },
};

worker.onmessage = workerTimer.onMessage.bind(workerTimer);

// ************************* 业务逻辑 *************************
let tbody = document.querySelector(".really-tbody");
let table = document.querySelector("table");

// 点击按钮，切换工作状态。
let xiaoxiu = document.querySelector(".xiaoxiu");
let gongzuo = document.querySelector(".gongzuo");
let state_text = document.querySelector(".state_text"); // 状态文本
// .ticket_num
let ticket_num = document.querySelector(".ticket_num"); // 工单数量
// .auto_xiaoxiu
let auto_xiaoxiu = document.querySelector(".auto_xiaoxiu"); // 自动小休输入框
// .appointment_xiaoxiu
let appointment_xiaoxiu = document.querySelector(".appointment_xiaoxiu"); // 预约小休按钮
// .daojishi
let daojishi = document.querySelector(".daojishi"); // 倒计时
// 。wait_num
let wait_num = document.querySelector(".wait_num"); // 等待人数
// .doing_num
let doing_num = document.querySelector(".doing_num"); // 处理人数
// dai_option
let dai_option = document.querySelector(".dai_option"); // 待处理工单
// chu_option
// let chu_option = document.querySelector(".chu_option"); // 处理中工单
// yu_option
// let yu_option = document.querySelector(".yu_option"); // 预约中工单

// .audio_music
let audio_music = document.querySelector(".audio_music"); // 音乐
audio_music.volume = 1; // 设置音量 1
// .layer_img
let layer_img = document.querySelector(".layer_img"); // 图片
// mask_layer
let mask_layer = document.querySelector(".mask_layer"); // 遮罩层
// audio_xiaoxiu
let audio_xiaoxiu = document.querySelector(".audio_xiaoxiu"); // 小休音乐
audio_xiaoxiu.volume = 0.5; // 设置50%音量
// xiaoxiu_music
let xiaoxiu_music = document.querySelector(".xiaoxiu_music"); // 小休音乐声音显示
// nav
let nav = document.querySelector(".nav"); // 导航栏
// jiance
let jiance = document.querySelector(".jiance"); // 检测

//  10 工作，21 小休 ，29 下班 切换状态的请求函数
async function fetchTicketSwitch(state) {
  try {
    let obj = await axios.get("http://127.0.0.1:3000/cache");
    // console.log(obj.data.token); //获取token 切换状态
    const response = await axios.post(
      `https://ticket-gateway.bg.huohua.cn/smart/ticket/it/switch_extract?extractSwitch=${state}`,
      null, // body 数据为 null 因为原生 fetch 的 body 是 null
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "zh",
          accesstoken: obj.data.token,
          "cache-control": "no-cache",
          pragma: "no-cache",
          priority: "u=1, i",
          timezone: "GMT+8",
          "content-type": "application/json", // 确保设置正确的 content-type
        },
        withCredentials: false, // 对应于 credentials: "omit"
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching ticket switch:", error);
    throw error;
  }
}

// 获取当前工作状态  工作 就绪随时可工作
async function getWorkState() {
  try {
    let obj = await axios.get("http://127.0.0.1:3000/cache");
    const response = await axios.get("https://ticket-gateway.bg.huohua.cn/smart/ticket/it/extract_switch", {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "zh",
        accesstoken: obj.data.token,
        timezone: "GMT+8",
      },
    });

    return response.data;
  } catch (error) {
    console.error(error); // 处理错误
  }
}

// 获取目前的课堂数量 待上课程(6396) 正在上课(590)
async function getClassRoom() {
  try {
    let obj = await axios.get("http://127.0.0.1:3000/cache");
    const response = await axios.get("https://ticket-gateway.bg.huohua.cn/smart/ticket/it/my/itTicketStatistics/", {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "zh",
        accesstoken: obj.data.token,
        timezone: "GMT+8",
      },
    });
    return response.data;
  } catch (error) {
    console.error(error); // 处理错误
  }
}

// 获取当前处理的工单 1 预约中 2 处理中 3 待处理
async function getTicketData(state) {
  try {
    let obj = await axios.get("http://127.0.0.1:3000/cache");
    const response = await axios.get(`https://ticket-gateway.bg.huohua.cn/smart/ticket/it/my/?appointedType=${state}`, {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "zh",
        accesstoken: obj.data.token,
        timezone: "GMT+8",
      },
    });
    return response.data;
  } catch (error) {
    console.error(error); // 处理错误
  }
}
// ************************* 每秒请求定时器 *************************
// 1s请求一次数据 使用worker定时器
const timerId = workerTimer.setInterval(() => {
  // 1s 获取工作状态
  getWorkState().then((res) => {
    if (res.data.description.includes("工作")) {
      // console.log("当前是: 工作状态");
      // 处理中工单
      getTicketData(2).then((result) => {
        let num = result.data.tickets.length;
        // console.log("处理中工单", num);
        if (num > 0) {
          // 切换监测状态 关闭
          localStorage.setItem("jiance_state", "false");
        } else {
          // 切换监测状态
          localStorage.setItem("jiance_state", "true");
        }
      });
    }
    state_text.innerHTML = res.data.description + " " + res.data.remark;
    if (state_text.innerHTML.includes("工作")) {
      state_text.style.color = "green";
      // 停止音乐
      audio_xiaoxiu.pause();
    } else if (state_text.innerHTML.includes("小休")) {
      state_text.style.color = "red";
      // 播放音乐
      audio_xiaoxiu.play();
    } else {
      // 停止音乐
      audio_xiaoxiu.pause();
    }
  });

  // 倒计时
  daojishiFun();

  // 获取课堂数量
  getClassRoom().then((res) => {
    wait_num.innerHTML = `待上课程(${res.data.waitingRoomTotalNum})`;
    doing_num.innerHTML = `正在上课(${res.data.openingRoomTotalNum})`;
  });

  // 待处理工单
  getTicketData(3).then((res) => {
    // 1 预约中 2 处理中 3 待处理
    let num = res.data.tickets.length;
    if (num > 0) {
      dai_option.innerHTML = `待处理(${num})`;
      dai_option.style.color = "red";
      dai_option.style.fontWeight = "bold";
      // 显示遮罩层
      mask_layer.classList.add("show");
      mask_layer.classList.remove("hide");
      // 播放音乐
      audio_music.play();
    } else {
      dai_option.innerHTML = `待处理(${num})`;
      dai_option.style.color = "black";
      dai_option.style.fontWeight = "normal";
      // 隐藏遮罩层
      mask_layer.classList.remove("show");
      mask_layer.classList.add("hide");

      // 停止音乐
      audio_music.pause();
    }
  });

  //监测按钮状态  开启或者关闭
  detial_jiance();
}, 1000);

// 500ms 请求一次表格数据
const timerId2 = workerTimer.setInterval(() => {
  // 渲染表格数据
  axios.get("http://localhost:3000/order").then((res) => {
    let data = res.data.data;
    console.log("表格数据:", data);

    ticket_num.innerHTML = ` (${data.length})单`; // 工单数量
    tbody.innerHTML = ""; // 清空表格主体

    //  根据检测状态判断是否开启
    let jiance_state = localStorage.getItem("jiance_state");
    data.forEach((item) => {
      if (jiance_state == "true") {
        // 判断item.appointedTime 是否为null
        if (item.appointedTime == null) {
          // 判断是否高工单。
          if (item.priority == 1) {
            console.log("实时单 高 工单");
            // 判断当前的工作状态是否是工作状态
            getWorkState().then((res) => {
              if (!res.data.description.includes("小休")) {
                fetchTicketSwitch(21).then((res) => {
                  if (res.code == 200) {
                    console.log("小休");
                  }
                });
              }
            });
          }
        } else {
          // "appointedTime": "2025-02-13 19:38:41",
          // 判断当前的时间是否大于 appointedTime
          let now = new Date();
          let appointedTime = new Date(item.appointedTime);
          if (now >= appointedTime) {
            if (item.priority == 1) {
              console.log("预约的实时 高 工单");
              // 判断当前的工作状态是否是工作状态
              getWorkState().then((res) => {
                if (!res.data.description.includes("小休")) {
                  fetchTicketSwitch(21).then((res) => {
                    if (res.code == 200) {
                      console.log("小休");
                    }
                  });
                }
              });
            }
          }
        }
      } else {
        console.log("监测关闭");
      }

      var tr = document.createElement("tr"); // 创建新行
      // 工单编号	孩子名称	工单类型	处理时间	问题描述
      let tds = [
        item.jobSponsorTypeDesc + " " + item.priorityDesc,
        item.id,
        item.studentName,
        item.appointedTime ? "预约单" : "实时单",
        item.appointedTime ? item.appointedTime : item.modifiedTime,
        item.remark.split("<")[0],
      ];
      tds.forEach((col_data) => {
        var td = document.createElement("td"); // 创建单元格
        // 判断如果是预约单，就给字体加橙红色。
        if (col_data == "预约单") {
          td.style.color = "red";
        }
        td.textContent = col_data; // 设置单元格内容
        tr.appendChild(td); // 添加单元格到行
      });
      tbody.appendChild(tr); // 添加行到表格主体
    });
    table.appendChild(tbody); // 添加表格主体到表格
  });
}, 300);

// ************************* 每秒请求定时器 *************************
// 点击小休，切换工作状态
xiaoxiu.addEventListener("click", () => {
  fetchTicketSwitch(21).then((res) => {
    if (res.code == 200) {
      console.log("小休");
    }
  });
});

// 点击工作，切换工作状态
gongzuo.addEventListener("click", () => {
  fetchTicketSwitch(10).then((res) => {
    if (res.code == 200) {
      console.log("工作");
    }
  });
});

let timeControl = null; // 定时器变量

// 处理小休的函数逻辑
function detail_xiaoxiu(time) {
  let diff = 0; //初始化时间差
  if (time) {
    // 这里是时间 16:53:00
    let now = new Date();
    let [hour, minute, second] = time.split(":");
    let date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    date.setSeconds(second);
    diff = date - now;
    // 如果时间大于0，就等待时间到了再切换小休
    if (diff > 0) {
      console.log("预约小休开始倒计时", diff / 1000, "秒");
      localStorage.setItem("diff", diff / 1000); // 倒计时保存到本地

      timeControl = setTimeout(() => {
        fetchTicketSwitch(21).then((res) => {
          if (res.code == 200) {
            console.log("小休");
            auto_xiaoxiu.value = ""; // 清空时间
            localStorage.removeItem("timeFlag"); // 清空时间
            localStorage.removeItem("diff"); // 清空倒计时
          }
        });
      }, diff);
    } else {
      diff = 0;
      auto_xiaoxiu.value = ""; // 清空时间
    }
  }
}
// 选择时间输入框,失去焦点时,执行预约小休
auto_xiaoxiu.addEventListener("change", function (e) {
  let time = e.target.value;
  detail_xiaoxiu(time); // 处理小休
  localStorage.setItem("timeFlag", time); // 保存时间
});
// 本地获取时间,自动小休
let timeFlag = localStorage.getItem("timeFlag");
if (timeFlag) {
  auto_xiaoxiu.value = timeFlag;
  detail_xiaoxiu(timeFlag);
}

// 点击预约小休按钮,清空时间
appointment_xiaoxiu.addEventListener("click", () => {
  auto_xiaoxiu.value = ""; // 清空时间
  localStorage.removeItem("timeFlag"); // 清空时间
  localStorage.removeItem("diff"); // 清空倒计时
  clearTimeout(timeControl); // 清空定时器
});

// 定时器,倒计时
function daojishiFun() {
  let diff = localStorage.getItem("diff");
  // console.log("倒计时", diff);

  if (diff) {
    diff = diff - 1;
    daojishi.innerHTML = "倒计时: " + diff + "s";
    localStorage.setItem("diff", diff);
    if (diff <= 0) {
      daojishi.innerHTML = "倒计时: 0s";
      localStorage.removeItem("diff"); // 清空倒计时
    }
  } else {
    daojishi.innerHTML = "倒计时: 0s";
  }
}

// 监听html元素点击事件。
document.addEventListener("click", function (e) {
  nav.style.display = "none";
});

// 监听全局键盘输入事件。
document.addEventListener("keydown", function (e) {
  console.log(e.key);
  if (e.key == "ArrowRight") {
    // 阻止默认事件。
    e.preventDefault();
    gongzuo.click(); // 工作触发点击事件
  }
  if (e.key == "ArrowLeft") {
    // 阻止默认事件。
    e.preventDefault();
    xiaoxiu.click(); // 小休触发点击事件
    // gongzuo.click(); // 工作触发点击事件
  }
});

// 检测 处理函数
function detial_jiance() {
  // 根据本地存储的状态,切换文本
  let state = localStorage.getItem("jiance_state");

  if (state == "true") {
    jiance.innerHTML = "监测:开启";
    jiance.style.backgroundColor = "red";
    // 保存到本地
    // localStorage.setItem("jiance_state", "true");
  } else if (state == "false") {
    jiance.innerHTML = "监测:关闭";
    jiance.style.backgroundColor = "#ccc";
    // 保存到本地
    // localStorage.setItem("jiance_state", "false");
  }
}

// 检测按钮点击事件
jiance.addEventListener("click", () => {
  let state = localStorage.getItem("jiance_state");
  // 如果开始没有保存,第一次点击
  if (state == null) {
    localStorage.setItem("jiance_state", "true"); // 保存到本地
  }
  // 点击切换状态
  if (state == "true") {
    localStorage.setItem("jiance_state", "false"); // 保存到本地
  } else if (state == "false") {
    localStorage.setItem("jiance_state", "true"); // 保存到本地
  }
  detial_jiance();
});

// 点击小休音乐图标,关闭声音
xiaoxiu_music.addEventListener("click", () => {
  if (audio_xiaoxiu.volume > 0) {
    audio_xiaoxiu.volume = 0;
    xiaoxiu_music.innerHTML = "🔇";
  } else {
    audio_xiaoxiu.volume = 0.5;
    xiaoxiu_music.innerHTML = "🔊";
  }
});
