// 切换状态的请求函数 // 10 工作，21 小休 ，29 下班
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

// 判断当前时间是否等于目标时间
function isTimeEqual(targetTimeString) {
  // 创建一个新的 Date 实例，它会自动设置为当前日期和时间
  const now = new Date();

  // 从 Date 对象中提取小时、分钟和秒
  let hours = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();

  // 将它们格式化为两位数并组成 HH:mm:ss 格式的字符串
  const currentTimeString = [String(hours).padStart(2, "0"), String(minutes).padStart(2, "0"), String(seconds).padStart(2, "0")].join(":");

  // 比较当前时间和目标时间字符串
  return currentTimeString === targetTimeString;
}

// JavaScript 获取本周的班表
function getThisWeekDates() {
  var today = new Date();
  var dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, etc.
  var diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to get the difference in days to last Monday

  // Set the date to last Monday
  var mondayDate = new Date(today.setDate(today.getDate() + diffToMonday));

  var weekDates = [];
  for (var i = 0; i < 7; i++) {
    var currentDate = new Date(mondayDate);
    currentDate.setDate(mondayDate.getDate() + i);
    weekDates.push(formatDate(currentDate));
  }

  return weekDates;
}

// 格式化输出的日期
function formatDate(date) {
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  var day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 获取今天当前日期  输出类似 "2024-12-22" 的字符串
function getTodayFormatted() {
  const today = new Date();

  // 获取年份、月份和日子，并确保月份和日子都是两位数
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // 注意：月份是从0开始的
  const day = String(today.getDate()).padStart(2, "0");

  // 返回格式化的日期字符串
  return `${year}-${month}-${day}`;
}

// 判断当前日期有没有超过本周
function isTodayAfterWeek() {
  // 本周最后一个时间
  const targetDate = Object.keys(L_workGoingData[L_workGoingData.length - 1])[0];

  // 获取当前日期和时间
  const today = new Date();
  // 比较两个日期
  if (today > new Date(targetDate)) {
    console.log("今天的日期超过了本周。");
    return true;
  } else {
    console.log("今天的日期没有超过本周。");
    return false;
  }
}
// 函数：根据日期获取对应的值  2024-12-18  返回  B
function getValueByDate(date, dateValuePairs) {
  for (let item of dateValuePairs) {
    if (date in item) {
      return item[date];
    }
  }
  return null; // 如果没有找到对应的日期，则返回null
}
// 获取时间 05:48 的格式
function getCurrentTimeFormatted() {
  const now = new Date();
  let hours = String(now.getHours()).padStart(2, "0"); // 获取小时并确保两位数
  let minutes = String(now.getMinutes()).padStart(2, "0"); // 获取分钟并确保两位数

  return `${hours}:${minutes}`;
}

// 获取 input 元素
let inputElement = document.getElementById("input");

// 添加 input 事件监听器 失去焦点
inputElement.addEventListener("blur", function (event) {
  let schedule = event.target.value.split(" "); //班表
  let weekDate = getThisWeekDates(); //本周时间
  let workGoingData = []; //本周工作计划表
  // 用户输入的班表,开始执行逻辑
  if (schedule.length == 7) {
    for (let index = 0; index < 7; index++) {
      let obj = {};
      obj[weekDate[index]] = schedule[index];
      workGoingData.push(obj);
    }
    localStorage.setItem("workGoingData", JSON.stringify(workGoingData));
  }
});

// 首次加载进行判断 是否有保存本地数据
let L_workGoingData = JSON.parse(localStorage.getItem("workGoingData"));
let isCheckd = JSON.parse(localStorage.getItem("isCheckd")); //复选框状态

// 有班表
if (L_workGoingData != null) {
  let data = L_workGoingData.map((item) => {
    return Object.values(item)[0];
  }).join(" ");
  inputElement.value = data;

  // 判断当前日期有没有超过本周
  if (isTodayAfterWeek()) {
    // 超过了,清除本周班表
    localStorage.removeItem("workGoingData");
    localStorage.setItem("isCheckd", "false");
  }
} else {
  // 没有班表
  localStorage.setItem("isCheckd", "false");
}
// 切换打卡状态
if (isCheckd == true) {
  document.getElementById("check-apple").checked = true;
} else {
  document.getElementById("check-apple").checked = false;
}

// 开始打开逻辑 获取今天时间和班表
async function detailAutoData() {
  // 开始打开逻辑 获取今天时间和班表
  let today = getTodayFormatted();
  let ban = getValueByDate(today, L_workGoingData); //今天班制
  console.log(today, ban);
  // 打开逻辑
  if (ban == "B") {
    // 使用方法
    const targetTime = "21:30:30"; // 目标时间

    if (isTimeEqual(targetTime)) {
      console.log("下班打卡");
    }
  }
}

let timering = null; // 定时器变量

// 是否开启自动打开
document.getElementById("check-apple").addEventListener("click", function (event) {
  let L_workGoingData = JSON.parse(localStorage.getItem("workGoingData"));

  if (L_workGoingData == null) {
    return event.preventDefault();
  } else {
    if (event.target.checked) {
      localStorage.setItem("isCheckd", "true");
      timering = setInterval(() => {
        detailAutoData(); //先执行处理函数
      }, 1000);
    } else {
      localStorage.setItem("isCheckd", "false");
      clearInterval(timering);
    }
  }
});

console.log("自动打卡 开启状态：", isCheckd);
if (isCheckd == true) {
  timering = setInterval(() => {
    detailAutoData(); //先执行处理函数
  }, 1000);
} else {
  clearInterval(timering);
}
