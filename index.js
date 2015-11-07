'use strict'
var phantom = require('phantom')
var request = require('then-request')
var prettyjson = require('prettyjson')
var log = (obj) => console.log(prettyjson.render(obj, { }))
var xqTimestamp = () => Date.now()
var write = (obj) => process.stdout.write(JSON.stringify(obj))
var rebalanceUrl = (unitId, count) =>
'http://xueqiu.com/cubes/rebalancing/history.json?cube_symbol=' + unitId + '&count=' + count + '&page=1'

function ScraperForUnit(userDefinedSettings) {
  this.settings = {
    maxRetry: 3,
    displayResult : false
  }
  this.startTime = Date.now()
  Object.keys(this.settings).forEach((k) => {
    if (userDefinedSettings[k])
      this.settings[k] = userDefinedSettings[k]
  })
  return (unitId) => 
  new Promise((resolve, reject) => {
    var self = this
    function retry() {
     reject()
   }
   //phantom.create('--proxy=proxy.crawlera.com:8010 --proxy-auth=ee70811e604e446c9bacda838d14d0f7: ',
   phantom.create(
    function(ph) {
      ph.createPage(function(page) {
       var loaded = false
       setTimeout(() => {
         if (loaded) {
           loaded = false 
           return
         }
         ph.exit()
         reject()
       }, 20000)
       page.set('settings.userAgent', 'Mozilla/5.0 (Windows NT 6.1 WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36')
       page.set('settings.loadImages', false)

       page.set('onResourceError', 
         (err) => {
          console.log(err)
        },
        (err) => {
         if (err.toString().indexOf('Host assets.imedao.com not found') >= 0)
           reject()
       })

       var replay = require('./src/replay')(page, self.settings)
       var getVar = require('./src/getvar')(page, self.settings)

       page.open("http://xueqiu.com/p/" + unitId, function(status) {
         log(status)
         log('page is on')
         loaded = true
         setTimeout(() => {
           if (!loaded) {
            ph.exit()
            reject()
          }
        },20000)
         Promise.all([
          replay(rebalanceUrl(unitId, 1), 'rebalance_history')
          .then((firstButch) => {
            if (firstButch.data.totalCount > firstButch.data.count)
              return replay(rebalanceUrl(unitId, firstButch.data.totalCount), 'rebalance_history')
            else {
              return firstButch
            }
          })
          , replay('http://xueqiu.com/cubes/nav_daily/all.json?cube_symbol='+unitId+'&since=1000006584000&until=' + xqTimestamp(), 
           'growth')
          , getVar('SNB.cubeTreeData', 'current_stocks')
          , getVar('SNB.cubeInfo', 'meta')
          ])
         .then((data) => {
          loaded = true
          ph.exit()
          if(self.settings.displayResult)
            log(data)
          let ans = {}
          data.forEach((item) => {
            ans[item.tag] = item.data
          })
          ans.chinese_stock =  /^[A-Z][A-Z]\d{6}$/.test(ans.meta.last_rebalancing.holdings[0].stock_symbol)
          ans.time = Date.now() - self.startTime
          resolve(ans)
        }).catch(reject)
      })
    })
  })
})
}

module.exports = (settings) => new ScraperForUnit(settings)


var selfExec = () => {
  log('Not called as a module. Getting data from default')
  module.exports({

  })(process.argv[2] || 'ZH100001')
  .then((data) => console.log(data, data.time) , (err) => console.log(err))
  .catch(console.log)
//102062
}

if (!module.parent)
  selfExec()