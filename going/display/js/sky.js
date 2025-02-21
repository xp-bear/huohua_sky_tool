let toggleSky = document.querySelector(".toggleSky"); //切换状态

// 切换状态的请求函数
// 10 工作，21 小休 ，29 下班
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

// 随机数 3000 4000 5000
function getRandomAmount() {
  // 创建一个包含所需数值的数组
  const amounts = [90000, 120000];

  // 使用 Math.random() 生成一个 0 到 1 之间的随机数（不包括 1）
  // 然后乘以数组长度得到一个随机索引值（可能为小数）
  // 使用 Math.floor() 将其向下取整为最接近的整数
  const randomIndex = Math.floor(Math.random() * amounts.length);

  // 返回根据随机索引从数组中选出的元素
  return amounts[randomIndex];
}

// 定时器变量
let timer = null;

// 处理函数
function detailData() {
  fetchTicketSwitch(10).then((data) => {
    if (data.code == 200) {
      toggleSky.innerHTML = "工作";
      toggleSky.style.backgroundColor = "#09b810";
      setTimeout(() => {
        // 切换到小休的状态
        fetchTicketSwitch(21).then((res) => {
          if (res.code == 200) {
            toggleSky.innerHTML = "小休";
            toggleSky.style.backgroundColor = "#ff0000";
            setTimeout(() => {
              fetchTicketSwitch(10).then((result) => {
                if (result.code == 200) {
                  toggleSky.innerHTML = "工作";
                  toggleSky.style.backgroundColor = "#09b810";
                }
              });
            }, 1000);
          }
        });
      }, 1000);
    }
  });
}

toggleSky.addEventListener("click", function (e) {
  if (toggleSky.innerText == "工作") {
    // 切换到小休的状态
    clearInterval(timer);
    toggleSky.innerText = "天窗状态切换";
  } else if (toggleSky.innerText == "天窗状态切换") {
    detailData(); //先执行处理函数
    // 调用函数并处理结果
    timer = setInterval(() => {
      console.log("开始工作");
      detailData();
    }, getRandomAmount());
  }
});
