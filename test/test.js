var getUnit = require('..')({})
var failing = (msg) => console.log(msg)

getUnit('ZH087953').then((alldata) =>
  console.log(alldata.meta.owner.profile), failing).catch(failing)
