'use strict'
var phantom = require('phantom')

var prettyjson = require('prettyjson')
var log = (obj) => console.log(prettyjson.render(obj, {

}))
var write = (obj) => process.stdout.write(JSON.stringify(obj))

var rebalanceUrl = (unitId, count) =>
  'http://xueqiu.com/cubes/rebalancing/history.json?cube_symbol=' + unitId + '&count=' + count + '&page=1'

function ScraperForUnit(userDefinedSettings) {
  this.settings = {
    maxRetry: 3
  }
  Object.keys(this.settings).forEach((k) => {
    if (userDefinedSettings[k])
      this.settings[k] = userDefinedSettings[k]
  })
  return (unitId) =>
    new Promise((resolve, reject) => {
      var self = this
      phantom.create(function(ph) {
        ph.createPage(function(page) {

          page.set('settings.userAgent', 'Mozilla/5.0 (Windows NT 6.1 WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36')
          page.set('settings.loadImages', false)

          page.set('onResourceReceived',
            function(requestData, request) {
              var log = function(obj) {
                console.log(JSON.stringify(obj))
              }
              if (requestData.url.indexOf('.json') === -1)
                return
                //write('[JSONPACK BOOM]')
            });

          var replay = require('./src/replay')(page, self.settings)
          var getMeta = require('./src/unit-data.js')(page, self.settings)
          page.open("http://xueqiu.com/p/" + unitId, function(status) {
            Promise.all([
              replay(rebalanceUrl(unitId, 1), '')
              .then((firstButch) => replay(rebalanceUrl(unitId, firstButch.data.totalCount), 'rebalance_history')), getMeta()
            ])
              .then((data) => {
                log(data)
                let ans = {}
                data.forEach((item) => {
                  ans[item.tag] = item.data
                })
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

  })('ZH087953').then(() => null)
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