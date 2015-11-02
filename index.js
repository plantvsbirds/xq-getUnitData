'use strict'
var phantom = require('phantom')
var request = require('then-request')
var prettyjson = require('prettyjson')
var log = (obj) => console.log(prettyjson.render(obj, {

}))
var taim = require('taim')
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
      console.log('called!')
      phantom.create('--proxy=proxy.crawlera.com:8010 --proxy-auth=ee70811e604e446c9bacda838d14d0f7: ',
      function(ph) {
        ph.createPage(function(page) {
	  setTimeout(() => {
	    ph.exit();
	    log("Reload.")
	    return module.exports(userDefinedSettings)(unitId)
	  }, 15000)
          page.set('settings.userAgent', 'Mozilla/5.0 (Windows NT 6.1 WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36')
          page.set('settings.loadImages', false)
          page.onResourceRequested(function (req) { try {
	  if (req.url.indexOf('.css') >= 0) {
	    req.changeUrl('http://localhost:10000/css')
	    return
	  }
	  if (req.url.indexOf('.js') >= 0)
	    req.changeUrl(req.url.replace(/assets\.imedao.com/g, 'localhost:10000'))
	  
	  
	  console.log(req.url)
	  
	  } catch(e) {} })
          page.set('onResourceReceived',
            function(requestData, request) {
              var log = function(obj) {
                console.log(JSON.stringify(obj))
              }
              if (requestData.url.indexOf('.json') === -1)
                return
                //write('[JSONPACK BOOM]')
            });
          page.set('onResourceTimeout', function(request) {
              console.log('Response (#' + request.id + '): ' + JSON.stringify(request));
          });
          page.set('onResourceError', (err) => log(err))
          var replay = require('./src/replay')(page, self.settings)
          var getVar = require('./src/getvar')(page, self.settings)
          page.open("http://xueqiu.com/p/" + unitId, function(status) {
	    log(status)
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
          page.onError = () => reject()
        })
      })

    })
}

module.exports = (settings) => new ScraperForUnit(settings)


var selfExec = () => {
  log('Not called as a module. Getting data from default')
  module.exports({

  })('ZH100027').then((data) => console.log(data.time)).catch(console.log)
}

if (!module.parent) {
  selfExec()
}

/* TODO
 * retry logic
 * module solution : just return data as JSON(BSON-compatible)
 * beanstalk
 */


/*
 * module api:
 *  logging : open, close, indent, color output
 *  beanstalk watch
 */
