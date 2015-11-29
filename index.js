'use strict'
var phantom = require('phantom')
var request = require('then-request')
var prettyjson = require('prettyjson')
var log = (obj) => console.log(prettyjson.render(obj, { }))
var xqTimestamp = () => Date.now()
var write = (obj) => process.stdout.write(JSON.stringify(obj))
var converter = require('./src/convert')
var rebalanceUrl = (unitId, page) =>
'http://xueqiu.com/cubes/rebalancing/history.json?cube_symbol=' + unitId + '&count=' + 20 + '&page=' + page

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
    function rejectAndClean(reason) {
      log(reason)
      clean()
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
         rejectAndClean()
       }, 200000)
       page.set('settings.userAgent', 'Mozilla/5.0 (Windows NT 6.1 WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36')
       page.set('settings.loadImages', false)

       page.set('onResourceError', 
         (err) => {
          console.log(err)
        },
        (err) => {
         if (err.toString().indexOf('Host assets.imedao.com not found') >= 0)
           rejectAndClean()
         if (err.toString().indexOf('server replied: Not Found') >= 0)
           rejectAndClean()
       })

       var replay = require('./src/replay')(page, self.settings)
       var getVar = require('./src/getvar')(page, self.settings)

       page.open("http://xueqiu.com/p/" + unitId, function(status) {
         log('Page on')
         loaded = true
         setTimeout(() => {
           if (!loaded) {
            ph.exit()
            rejectAndClean()
          }
        }, 300000)
         Promise.all([
          new Promise((resolve, reject) => {
            replay(rebalanceUrl(unitId, 1), 'rebalance_history')
            .then((firstButch) => {
              log(firstButch.tag)
              if (firstButch.data.page < firstButch.data.maxPage) {
                let todo = []
                for (let pageNum = 2; pageNum <= firstButch.data.maxPage; pageNum ++) {
                  todo.push(replay(rebalanceUrl(unitId, pageNum), 'rebalance_history'))
                }
                Promise.all(todo).then((restButch) => {
                  console.log('asdfasdfas')
                  let ans = firstButch.data.list

                  restButch.forEach((b) => {
                    ans = ans.concat(b.data.list)
                  })
                  firstButch.data.list = ans
                  resolve(firstButch)
                }, (onRej) => {
                  reject(onRej)
                })
              } else {
                resolve(firstButch)
              }
            })
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
          ans.time = Date.now() - self.startTime
          resolve(converter(ans))
        }).catch(rejectAndClean)
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
  .then((data) => {
    data.raw_data = 'nothing'
    log(data)
    process.exit()
  } , (err) => console.log(err))
  .catch(console.log)
//102062
}

if (!module.parent)
  selfExec()

var clean = () => {
  try {
    ph.exit()
    let exec = require('child_process').exec
    exec('kill ' + ph.process.pid)
  } catch (e) {

  }
}

process.on('exit', (code) => {
  log('Exiting with code ' + code)
  clean()
})
