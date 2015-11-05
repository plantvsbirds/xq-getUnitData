'use strict'
var fs = require('fs')
var getUnit = require('..')({})
var failing = (msg) => console.err(msg)
var mongo = require('promised-mongo')

var access = fs.createWriteStream('./node.access.log', { flags: 'a' })
      , error = fs.createWriteStream('./node.error.log', { flags: 'a' });

process.stdout.pipe(access);
process.stderr.pipe(error);

var db = mongo('xq',['xq_unit_raw'])

var zhString = (offset) => {
  offset += 100000
  let ans = offset.toString()
  while (ans.length != 6)
    ans = '0' + ans
  console.log('ZH' + ans)
  return 'ZH' + ans
}

var todo = new Array()
for (let offset = 2000; offset < 5000/*700071*/; offset ++) {
  todo.push(zhString(offset))
}

var compTodo = new Array()
while (todo.length > 0)
  compTodo = compTodo.push(todo.splice(0,3))

compTodo.reduce(function(cur, next) {
    var _ = () => {
      console.log('hi',next)
        return Promise.all(next.map((n) => getUnit(n)))
	  .then(function (res) {
	    console.log(JSON.stringify(res))
	    return res
	  }, function () {
	    return _()
	  })
	  .catch((err) => console.log(err))
	  .then(function (res){
	    console.log(JSON.stringify(res).length)
	    return db.xq_unit_raw.insert(res).then((res) => console.log(JSON.stringify(res))).catch((err) =>
	    console.log(err))
	  })
	  .catch((err) => console.log(err))
    })
    return cur.then(_)
}, Promise.resolve()).then(function() {
    console.log('all executed')
});

