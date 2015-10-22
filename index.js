'use strict'
var phantom = require('phantom')

var log = (obj) => console.log(JSON.stringify(obj))

var weblog = (content) => {
  var http = require('http')
  const PORT=8081 

  function handleRequest(request, response){
      response.end(content)
  }

  var server = http.createServer(handleRequest)

  server.listen(PORT, function(){
      console.log("Server listening on: http://localhost:%s", PORT)
  })
}

phantom.create(function (ph) {
  ph.createPage(function (page) {
    page.set('settings.userAgent', 'Mozilla/5.0 (Windows NT 6.1 WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36')

    page.open("http://xueqiu.com/p/ZH087953", function (status) {
      console.log("opened xq? ", status)
      page.evaluate(function () {
        window.results = []

        $(document).ajaxSuccess(
          function(event, xhr, settings) { 
            window.results.push(xhr.responseText)
          }
        )

        return $('body').html()
      }, function (pageLoaded) {
        log('page loaded' + pageLoaded)
        //ph.exit()
      })
      let lastResultLength = 0
      let readyToClearInterval = false
      let checkResultsArray = setInterval(function () {
        page.evaluate(function () {
          return JSON.stringify(window.results)
        }, function (res) {
          log(res.length)
          var resultsArray = eval(res)
          //weblog(resultsArray)
          let resLength = resultsArray.length
          log(resultsArray.length)
          log('New check: '+ resLength)
          if (resLength > lastResultLength) {
            lastResultLength = resLength
            readyToClearInterval = false
          } else {
            if (resLength == 0) return
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
      }, 10000)
    })
  })
})

var processData = (ajaxRequests) => {
  console.log(ajaxRequests[0].url)
  console.log(ajaxRequests[0].res)
}