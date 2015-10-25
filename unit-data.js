'use strict'
var log = (obj) => console.log(JSON.stringify(obj))

module.exports = (page, settings) => () =>
  new Promise((resolve, reject) => {

    log('Getting Unit Data Rightaway.')

    setTimeout(() => {
      page.evaluate(function() {
        return JSON.stringify(window.SNB.cubeInfo)
      }, (unitInfoStr) => {
        resolve({
          data : JSON.parse(unitInfoStr) ,
          tag  : 'meta'
        })
      })
    }, 3500)
  })