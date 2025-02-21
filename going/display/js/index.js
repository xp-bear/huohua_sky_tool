document.querySelector(".mask").addEventListener("click", async function (e) {
  document.querySelector(".mask").innerText = JSON.parse(localStorage.getItem("l_time")) || getFormattedDate();

  document.getElementById("main").style.display = "none";
  document.getElementById("apply").style.display = "block";
  document.querySelector(".time").value = getFormattedDate();
  document.querySelector(".submit").addEventListener("click", function (e) {
    let time = document.querySelector(".time").value;
    localStorage.setItem("l_time", JSON.stringify(time)); //保存到本地
    // 发起请求
    axios
      .get("http://127.0.0.1:3000/cache", {
        params: {
          time,
        },
      })
      .then((res) => {
        document.getElementById("apply").style.display = "none";
        document.querySelector(".mask").innerText = localStorage.getItem("l_time");
        history.go(0);
      });
  });
});

// 获取当前时间函数
function getFormattedDate() {
  const date = new Date(); // 创建一个包含当前日期和时间的 Date 对象

  const year = date.getFullYear(); // 获取完整的年份（4位数）
  let month = (date.getMonth() + 1).toString(); // 获取月份（注意：getMonth() 返回的是0-11，因此需要加1）
  let day = date.getDate().toString(); // 获取日期

  // 如果月份或日期是一位数，则在其前面补0
  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  // 组合年月日，形成 YYYY-MM-DD 的格式
  return `${year}-${month}-${day}`;
}

// 请求数据过来
document.addEventListener("DOMContentLoaded", async function () {
  let ticketNumArr = [];
  let ticketNameArr = [];
  const fetchData = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:3000/data");

      if (response.data.code != 500) {
        document.getElementById("apply").style.display = "none";
        document.querySelector(".loader-19-1").style.display = "none"; //加载隐藏
        document.querySelector(".todayTicket").innerHTML = "总量: " + response.data.todayTicket + "单";
        document.querySelector(".dayPeople").innerHTML = "今日: " + response.data.onlineOrderPeople + "人";
        // 处理成功响应
        ticketNumArr = response.data.resArr.map((item) => item.total); //工单量数组
        ticketNameArr = response.data.resArr.map((item) => item.name); //工单名字数组
      } else {
        // 处理错误 来到提交工单cookie页面
        document.getElementById("main").style.display = "none";
        document.querySelector(".loader-19-1").style.display = "none"; //加载隐藏
        document.getElementById("apply").style.display = "block";
        document.querySelector(".time").value = getFormattedDate();
        // 点击提交按钮

        document.querySelector(".submit").addEventListener("click", function (e) {
          // console.log("点击了提交");
          // 获取值
          let cookie = document.querySelector(".cookie").value;
          let token = document.querySelector(".token").value;
          let time = document.querySelector(".time").value;
          // 发起请求
          axios
            .get("http://127.0.0.1:3000/cache", {
              params: {
                cookie,
                token,
                time,
              },
            })
            .then((res) => {
              document.getElementById("apply").style.display = "none";
              history.go(0);
            });
        });
      }
    } catch (error) {
      console.log(error);
    }
    // -------------------------------------------------------
    var chartDom = document.getElementById("main");
    var myChart = echarts.init(chartDom);
    var option;
    const data = ticketNumArr;
    option = {
      xAxis: {
        max: "dataMax",
      },
      yAxis: {
        type: "category",
        data: ticketNameArr, //y轴名称
        inverse: true,
        animationDuration: 300,
        animationDurationUpdate: 300,
        max: 39, // only the largest 3 bars will be displayed
      },
      series: [
        {
          realtimeSort: true,
          name: "工单量",
          type: "bar",
          data: data,
          color: "#e43961", //列表颜色
          label: {
            show: true,
            position: "right",
            valueAnimation: true,
          },
        },
      ],
      legend: {
        show: false,
      },
      animationDuration: 0,
      animationDurationUpdate: 3000,
      animationEasing: "linear",
      animationEasingUpdate: "linear",
    };
    // 立即执行函数
    function run() {
      myChart.setOption({
        series: [
          {
            type: "bar",
            data,
          },
        ],
      });
    }
    setTimeout(() => {
      run();
    }, 0);

    option && myChart.setOption(option);
    //  -----------------------------------
  };
  // 立即执行一次，然后每 30s 执行一次
  fetchData();

  setInterval(fetchData, 30000); // 30秒执行一次
});
