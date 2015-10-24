'use strict'
var phantom = require('phantom')

var log = (obj) => console.log(JSON.stringify(obj))

function ScraperForUnit (settings) {
  //todo
}

ScraperForUnit.prototype.scrap =  (unitId) => {
    phantom.create(function (ph) {
      ph.createPage(function (page) {

        page.set('settings.userAgent', 'Mozilla/5.0 (Windows NT 6.1 WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36')
        

        page.set('onResourceReceived', 
            function(requestData, request) {
              var log = function (obj) {
                console.log(JSON.stringify(obj))
              } 
              if (requestData.url.indexOf('.json') === -1)
                return
              log('Requesting following JSON: ' + requestData.url)
            }
        );

        page.open("http://xueqiu.com/p/" + unitId, function (status) {
          log('Hooking Rightaway.')

          page.evaluate(function () {
            window.results = []

            $(document).ajaxSuccess(
              function(event, xhr, settings) { 
                window.results.push({
                  res : xhr.responseText,
                  url : settings ? settings.url : 'fuck'
                })
                console.log(xhr.responseText)
            })
            return $('body').html()
          }, function (pageHtml) {
            log('Hook ready: ' + !!pageHtml)
            //ph.exit()
          })
          let lastResultLength = 0
          let blankTimes = 0
          let readyToClearInterval = false
          let checkResultsArray = setInterval(function () {
            page.evaluate(function () {
              return JSON.stringify(window.results)
            }, function (res) {
              var resultsArray = eval(res)
              //weblog(resultsArray)
              let resLength = resultsArray.length
              log('Captured AJAX requests: #'+ resLength)
              if (resLength > lastResultLength) {
                lastResultLength = resLength
                readyToClearInterval = false
              } else {
                if (blankTimes > 5) {
                  log('Caution: Hook failling?')
                  //todo
                }

                if (resLength == 0) {
                  blankTimes ++
                  return
                }
                if (resLength == lastResultLength) {
                  if (readyToClearInterval) {
                    clearInterval(checkResultsArray)
                    processData(resultsArray)
                    ph.exit()
                  }
                  else
                    readyToClearInterval = true
                }
              }
            })
          }, 1000)
        })
      })
    })

    var processData = (ajaxRequests) => {
      console.log(ajaxRequests[0].url)
      console.log(ajaxRequests[0].res)
    }
  }

module.exports = (settings) => new ScraperForUnit(settings)


var selfExec = () => {
  log('Not called as a module. Getting data from default')
  module.exports({

  }).scrap('ZH087953')
}

if (!module.parent) {
  selfExec()
}

/* TODO
 * retry logic
 * alternative besides hooking
 * read SNB.data
 * parse AJAX req + SNB.data
 * failing logic(jQuery not defined)
 * module solution with db writing(how to do this right)
 *        also: convert to BSON-compatible data
 * module solution : just return data as JSON(BSON-compatible)
 * logging indent / switch
 * beanstalk
 */


/*
 * module api:
 *  logging : open, close, indent, color output
 *  beanstalk watch
 *  
 */