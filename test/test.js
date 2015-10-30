var getUnit = require('..')({})
var failing = (msg) => console.log(msg)

getUnit(process.argv[2]).then((alldata) =>
  console.log(JSON.stringify(alldata)), failing).catch(failing)
