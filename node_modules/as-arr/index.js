'use strict'

// Create a function that converts objects to arrays using the given string separator
function use (sep) {
  return function (o, s) {
    var l = arguments.length
    return l === 0 ? []
      : Array.isArray(o) ? o
      : typeof o === 'string' ? o.trim().split(l === 1 ? sep : s)
      : [ o ]
  }
}
var asArr = use(/\s+/)
asArr.use = use

module.exports = asArr
