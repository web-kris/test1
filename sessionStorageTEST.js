
localStorage.name = "Jack"

let nameee = localStorage.name



function transferJsonArrayToStr(jsonArr) {
  let strArr = []
  for (let i = 0; i < jsonArr.length; i++) {
    let obj = jsonArr[i]
    let str = JSON.stringify(obj)
    strArr.push(str)
  }
  return strArr
};

function transferStrArrayToJson(strArr) {
  let jsonArr = []
  for (let i = 0; i < strArr.length; i++) {
    let str = strArr[i]
    let obj = JSON.parse(str)
    jsonArr.push(obj)
  }
  return jsonArr
};