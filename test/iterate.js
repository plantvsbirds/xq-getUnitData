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
for (let offset = 0; offset < 5000/*700071*/; offset ++) {
  todo.push(zhString(offset))
}

todo.reduce(function(cur, next) {
    return cur.then(function() {
      console.log('hi')
        return getUnit(next).then(function (res) {
	    console.log(JSON.stringify(res))
	    return res
	  }).then(function (res){
	      console.log(JSON.stringify(res).length)
	      return db.xq_unit_raw.insert(res).then((res) => console.log(JSON.stringify(res))).catch((err) =>
	      console.log(err))
	      
	    }).catch((err) => console.log(err))
    });
}, Promise.resolve()).then(function() {
    console.log('all executed')
});

