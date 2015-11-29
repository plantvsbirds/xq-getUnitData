'use strict'

var xqTimestamp = () => Date.now()
var prettyjson = require('prettyjson')
var log = (obj) => console.log(prettyjson.render(obj, { }))

module.exports = (ori) => {
  let ans = { }
  ans.id = ori.meta.symbol
  ans.owner = ori.meta.owner.id
  ans.current_stocks = {}
  Object.keys(ori.current_stocks).forEach((categoryKey) => {
    ori.current_stocks[categoryKey].stocks.forEach((stock) => {
      ans.current_stocks[stock.stock_symbol] = stock.weight
    })
  })
  //todo historical stocks
  ans.historical_stocks = new Object()

  ori.growth.forEach((line) => {
    if (line.symbol  == ans.id)
      ans.revenue_trend = ori.growth[0].list
  })

log(ori.rebalance_history)

  ans.trade_timetable = ori.rebalance_history.list.map((oneReb) => {

    if (oneReb.status !== 'success') return undefined
    if (oneReb.category !== 'user_rebalancing') return undefined
    return {
      time : oneReb.created_at,
      //oneReb.stocks
      list : oneReb.rebalancing_histories.map((stk) => {

        let subAns = {}
        subAns[stk.stock_symbol] = {
          from_value : stk.prev_weight,
          to_value   : stk.target_weight,
          prev_price : stk.prev_price,
          current_price : stk.price
        }
        if (stk.target_weight > stk.prev_weight) {
      
          if (Object.keys(ans.historical_stocks).indexOf(stk.stock_symbol) < 0) {
            ans.historical_stocks[stk.stock_symbol] = 1
          } else {
            ans.historical_stocks[stk.stock_symbol] += 1
          }
        }
        return subAns
      })
    }
  }).filter((reb) => (reb !== undefined))
  ans.raw_data = ori
  ans.month_revenue = ori.meta.monthly_gain
  ans.daily_revenue = ori.meta.daily_gain
  ans.net_profit = ori.meta.total_gain
  ans.job_duration = ori.time
  ans.job_done_at = xqTimestamp()
  return ans
}
