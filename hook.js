'use strict'

var log = (obj) => console.log(JSON.stringify(obj))

module.exports = (page, settings) =>
  new Promise((resolve, reject) => {
    log('Hooking Rightaway.')

    page.evaluate(function() {
      window.results = []
      $(document).ajaxSuccess(
        function(event, xhr, settings) {
          window.results.push({
            res: xhr.responseText,
            url: settings ? settings.url : 'fuck'
          })
          console.log(xhr.responseText)
        })
      return $('body').html()
    }, function(pageHtml) {
      log('Hook ready: ' + !!pageHtml)
    })

    let lastResultLength = 0
    let blankTimes = 0
    let readyToClearInterval = false
    let checkHookedAjaxRequest = setInterval(function() {
      page.evaluate(function() {
        return JSON.stringify(window.results)
      }, function(res) {
        var resultsArray = eval(res)
          //weblog(resultsArray)
        let resLength = resultsArray.length
        log('Captured AJAX requests: #' + resLength)
        if (resLength > lastResultLength) {
          lastResultLength = resLength
          readyToClearInterval = false
        } else {
          if (blankTimes > 3) {
            log('Caution: Hook failling?')
            //todo
          }

          if (resLength == 0) {
            blankTimes++
            return
          }
          if (resLength == lastResultLength) {
            if (readyToClearInterval) {
              clearInterval(checkHookedAjaxRequest)
              processAjaxReqData(resultsArray)
              //ph.exit()
            } else
              readyToClearInterval = true
          }
        }
      })
    }, 1000)

    var processAjaxReqData = (ajaxRequests) => {
        console.log(ajaxRequests[0].url)
        console.log(ajaxRequests[0].res)

        resolve(ajaxRequests)
      }
      //resolve reject 100
  })
