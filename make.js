const fs = require('fs')
    , uglify = require('uglify-js') // try `$ sudo npm install -g uglify-js`
    , allnames = fs.readdirSync('js')
    , srcnames = []
    , maxs = []
    , codes = []

//// Read all source files.
allnames.forEach( allname => {
  if ( 'vrc-' !== allname.substr(0,4) || '.js' !== allname.slice(-3) ) return
  srcnames.push(allname)
  maxs.push( fs.readFileSync('js/' + allname)+'' )
})

//// Check that error codes are unique.
maxs.forEach( (max, i) => {
  const fails = max.match(/\sfail\s*\(([^\)]+,\s*\d{4}\s*)\)/mg)
  if (! fails) return
  fails.forEach( (fail, j) => {
    if (! fail) return
    const codeMatch = fail.match(/,\s*(\d{4})\s*\)$/m)
    const code = +codeMatch[1]
    if (codes[code])
      throw new Error(`${srcnames[i]}:${j} and ${codes[code]} both use ${code}`);
    codes[code] = `${srcnames[i]}:${j}`
  })
})

//// Modify 'boot' so that it expects components to be loaded inline.
maxs.forEach ( (max, i) => {
  if ('vrc-boot.js' === srcnames[i]) {
    srcnames.forEach( srcname => {
      maxs[i] = maxs[i].replace(
        new RegExp(
          [
            "'",",","status",":","'boot'",",","src",":",`'js/${srcname}'`,"}"
          ].join('\\s*')
        )
       ,"', status:'boot', src:'inline' }"
      )
    })
  }
})

//// Write the concatenated JavaScript to disk.
fs.writeFileSync('js/vrc.js', maxs.join('\n\n') )
console.log(`Created js/vrc.js from ${maxs.length} sources`)

//// Replace `fail()` error messages with the error code, before minification.
////@todo

//// Minify the concatenated JavaScript, and write it to disk.
const min = uglify.minify('js/vrc.js', {
  outFileName: 'js/vrc.min.js',
  // outSourceMap: "js/vrc.min.map.js",
  warnings: true,
  compress: {
    dead_code: true,
    global_defs: {
      DEBUG: false
    }
  }
})

fs.writeFileSync('js/vrc.min.js', min.code)
// fs.writeFileSync('js/vrc.min.map.js', min.map)

//// Calculate and display the amount of compression.
const maxSize = fs.statSync('js/vrc.js').size
    , minSize = fs.statSync('js/vrc.min.js').size
    , maxK = (maxSize / 1024).toPrecision(4)
    , minK = (minSize / 1024).toPrecision(4)
    , pc = (minSize / maxSize * 100).toPrecision(4)
console.log(`Created js/vrc.min.js, which is ${minK} KB (${pc}% of ${maxK} KB)`)
