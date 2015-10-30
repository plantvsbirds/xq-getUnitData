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
for (let offset = 0; offset < 100000/*700071*/; offset ++) {
  todo.push(zhString(offset))
}

todo.reduce(function(cur, next) {
    return cur.then(function() {
        return getUnit(next)
    });
}, Promise.resolve()).then(function() {
    console.log('all executed')
});

