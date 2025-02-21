// 文件缓存系统
const fs = require("fs");
const path = require("path");

const cacheFilePath = path.join(__dirname, "cache.json");

function readCache() {
  try {
    const data = fs.readFileSync(cacheFilePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

function writeCache(key, value) {
  let cache = readCache();
  cache[key] = value;
  // console.log(value);

  fs.writeFileSync(cacheFilePath, JSON.stringify(cache), "utf8");
}

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
module.exports = {
  getFormattedDate,
  readCache,
  writeCache,
};
