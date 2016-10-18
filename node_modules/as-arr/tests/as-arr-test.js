var test = require('tape')
var asArr = require('..')

test('no arguments returns an empty array', function (t) {
  t.deepEqual(asArr(), [])
  t.end()
})
test('wraps objects into arrays', function (t) {
  t.deepEqual(asArr(null), [ null ])
  t.deepEqual(asArr(125), [ 125 ])
  t.deepEqual(asArr({ a: 'b' }), [ { a: 'b' } ])
  t.end()
})

test('splits strings', function (t) {
  t.deepEqual(asArr('1 2 3 4 5 6 7 8 9 10'),
    [ '1', '2', '3', '4', '5', '6', '7', '8', '9', '10' ])
  t.end()
})
test('trim source', function (t) {
  t.deepEqual(asArr('   1 2   4   7    '), [ '1', '2', '4', '7' ])
  t.end()
})
test('custom separators', function (t) {
  t.deepEqual(asArr('x..x..', ''), [ 'x', '.', '.', 'x', '.', '.' ])
  t.deepEqual(asArr('a, b, c', /,\s*/), [ 'a', 'b', 'c' ])
  t.end()
})
test('creates function with use', function (t) {
  var toArr = asArr.use(/\s*\|\s*|\s*,\s*|\s+/)
  t.deepEqual(toArr('a, b, c, d'), [ 'a', 'b', 'c', 'd' ])
  t.deepEqual(toArr('a | b | c | d'), [ 'a', 'b', 'c', 'd' ])
  t.end()
})
