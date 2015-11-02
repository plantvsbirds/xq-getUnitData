var http = require('http')
var request  = require('then-request')

http.createServer((req, res) => {
  console.log(req.url)
  if (req.url === '/css') res.end('{}')
  request('GET', 'http://assets.imedao.com' + req.url).done((resXq) =>
  res.end(resXq.getBody()))
}).listen(10000, () => { console.log ('listening') })
