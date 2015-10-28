'use strict'
var log = (obj) => console.log(JSON.stringify(obj))

module.exports = (page, settings) => (variable, tag) =>
  new Promise((resolve, reject) => {
    log('Getting Runtime Variables Rightaway.')
    page.evaluate(
      new Function('return JSON.stringify(' + variable + ')')
      , (varStr) => {
      resolve({
        data: JSON.parse(varStr),
        tag: tag
      })
    })
  })