const express = require("express");
const path = require("path");
const cors = require("cors");
const axios = require("./axiosConfig");
const { getFormattedDate, readCache, writeCache } = require("./tool.js");

const app = express();
const port = 3000;

app.use(cors());

// 设置静态文件目录
app.use(express.static(path.join(__dirname, "display")));

app.get("/", (req, res) => {
  res.send({
    time: getFormattedDate(),
    msg: "天窗实时检测启动",
  });
});

// 2.获取token过期时间
app.get("/cache", (req, res) => {
  let cookie = req.query.cookie; //天润
  let token = req.query.token; //天窗
  let time = req.query.time; //获取当前接单时间
  // console.log(time);

  // 有值才赋值
  if (cookie) {
    writeCache("cookie", cookie);
  }
  if (token) {
    writeCache("token", token);
  }
  if (time) {
    writeCache("curTime", time);
  }

  res.send({
    cookie: readCache()["cookie"],
    token: readCache()["token"],
    time: readCache()["curTime"],
    msg: "参数传递成功",
  });
});

// 1.工单实时数据排名
app.get("/data", async (req, res) => {
  let resArr = []; // 结果数据

  try {
    const data = await axios.get("https://home-1.cticloud.cn/v1/monitor/api/statistic/agents", {
      params: {
        qno: "0006",
        cnos: "",
        allCno: "0",
        departmentId: "BM3100526",
        organizationId: "JG2100371",
        tenancyId: "TCC1100251",
        endHour: "24",
        startHour: "00",
        pageSize: "100",
        currentPageNo: "1",
      },
      headers: {
        cookie: readCache()["cookie"],
      },
    });

    const promises = data.result.list.map(async (element) => {
      const totals = await axios.get(
        `https://ticket-gateway.bg.huohua.cn/smart/ticket/page?currentProcessorId=${+element.cno.slice(1)}&createdTimeStart=${readCache()["curTime"]}%2000%3A00%3A00&createdTimeEnd=${
          readCache()["curTime"]
        }%2023%3A59%3A59&pageSize=100&total=2&pageNum=1`,
        {
          headers: {
            accesstoken: readCache()["token"],
          },
        }
      );

      // 排除掉 已经关闭的工单
      let del_arr = totals.data.list.filter((item) => item.statusDesc != "已关闭");

      resArr.push({
        total: del_arr.length,
        id: +element.cno.slice(1),
        name: element.name,
      });
    });

    await Promise.all(promises);

    // 定义一个总共的单量合集
    let todayTicket = 0; //今天公共的单量合集

    // 根据total总量进行排名
    // 按 total 降序排序
    resArr.sort((a, b) => b.total - a.total);
    // 添加 rank 字段
    resArr.forEach((item, index) => {
      item.rank = index + 1; // 排名从1开始
      todayTicket += item.total; //今天总共的工单数量
    });

    // 根据total字段统计大于等于1的数据
    let moreThanOne = resArr.filter((item) => item.total >= 1);

    res.json({
      todayTime: readCache()["curTime"],
      todayTicket,
      length: resArr.length,
      onlineOrderPeople: moreThanOne.length,
      resArr,
    }); // 返回数据
  } catch (error) {
    console.error(error);
    res.send({
      code: 500,
      error: "服务器内部错误,请联系管理员",
      msg: error,
    });
  }
});

// 2.获取预约单数量情况
app.get("/order", async (req, res) => {
  try {
    const data = await axios.get("https://ticket-gateway.bg.huohua.cn/smart/ticket/page", {
      params: {
        statuses: "1,2",
        currentProcessorId: "0",
        pageSize: "20",
        total: "3",
        pageNum: "1",
      },
      headers: {
        accesstoken: readCache()["token"],
      },
    });
    res.send({
      code: 200,
      msg: "获取预约单数量成功",
      data: data.data.list,
    });
  } catch (error) {
    res.send({
      code: 500,
      error: "服务器内部错误,请联系管理员",
    });
  }
});

// 监听端口
app.listen(port, () => {
  console.log(`启动 at http://localhost:${port}`);
});
