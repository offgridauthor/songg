# as-arr [![npm](https://img.shields.io/npm/v/as-arr.svg?style=flat-square)](https://www.npmjs.com/package/as-arr)

Convert objects (specially strings) into arrays:

```js
var asArr = require('as-arr')

// split strings by spaces
asArr('a b c') // => ['a', 'b', 'c']

// by default all spaces are removed
asArr('   a   b  c    ') // => ['a', 'b', 'c']

// custom separators
asArr('a, b, c', /,\s*/) // => ['a', 'b', 'c']
asArr('abc', '') // => ['a', 'b', 'c']

// arrays are bypassed
asArr(['a', 'b', 'c']) // => ['a', 'b', 'c']

// objects are wrapped into an array
asArr(123) // => [ 123 ]
asArr(null) // => [ null ]

// it ALWAYS returns an array
asArr() // => []

// create a function with a custom separator
var toArr = asArr.use(/\s*\|\s*|\s*,\s*|\s+/)
toArr('a, b  c | d') // => ['a', 'b', 'c', 'd']
```

## License

MIT License
