'use strict'

var log = (obj) => console.log(JSON.stringify(obj))
var wrapAjaxLib = (targetUrl) => {
  let finalFunction = function () {
    return $.ajax({
          type: "GET",
          url: "TARGET_ADDRESS",
          async: false
        }).responseText
  }
  let finalFunctionInStr = finalFunction
    .toString()
    .replace('TARGET_ADDRESS', targetUrl)
  const finalFunctionInArr = finalFunctionInStr
    .split('\n')
  const finalFunctionBodyInStr = finalFunctionInArr
    .slice(1,finalFunctionInArr.length-1)
    .join('\n')
  return new Function(finalFunctionBodyInStr)
}

module.exports = (page, settings) => (url, tag) =>
  new Promise((resolve, reject) => {
    log('Replaying Rightaway.')
    page.evaluate(wrapAjaxLib(url), (data) => resolve({
      tag, data : JSON.parse(data)
    }))
  })



