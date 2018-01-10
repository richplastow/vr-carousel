!function () { 'use strict'; var FILE = 'js/vrc-boot.js'
  /* ------------------------------------------------------------------------ */
  /* Loads and initialises the VRC components.                                */
  /* ------------------------------------------------------------------------ */
  /* Detects when the <BODY> (and <HEAD>, for IE 6+) are ready, before jQuery */
  /* loads. At this stage we don’t know whether the runtime environment       */
  /* supports `addEventListener('load', ...)`, so VRC.boot just uses polling. */
  /* ------------------------------------------------------------------------ */


  //// SETTINGS
  var maxHeadWait =  250  // milliseconds to wait before finding <HEAD> fails
  var maxBodyWait = 1000  // milliseconds to wait before finding <BODY> fails
  var maxLoadWait = 2000  // milliseconds of inaction to allow before load fails
  var defeatCache = true  // append a random query-string to 'src' attributes
  var simulateBot = false // useful for developing the <NOSCRIPT> bot-view


  //// SETUP AND VALIDATION
  var VRC = (window.VRC = window.VRC || {})
  var fail = function (msg, n) {(w80a || alert)(FILE + '#' + n + '\n  ' + msg)}
  if (VRC.boot) return fail('`VRC.boot` already exists', 8692)


  //// PUBLIC API
  var boot = VRC.boot = {

    //// Standard event handlers.
    on: {
      loaded: {}
     ,ready: {
        head:  loadComponents
       ,body:  null
      }
     ,app: {
        start: null
       ,pause: null
       ,play:  null
       ,quit:  null
      }
     ,fail: null
    }

    //// Specify which components to load - order does not matter.
   ,components: [
      { name:'aframe',   status:'boot', src:'js/vrc-aframe.js' }
     ,{ name:'config',   status:'boot', src:'js/vrc-config.js' }
     ,{ name:'jquery',   status:'boot', src:'js/vrc-jquery.js' }
     ,{ name:'panel',    status:'boot', src:'js/vrc-panel.js' }
     ,{ name:'parse',    status:'boot', src:'js/vrc-parse.js' }
     ,{ name:'preload',  status:'boot', src:'js/vrc-preload.js' }
     ,{ name:'progress', status:'boot', src:'js/vrc-progress.js' }
     ,{ name:'route' ,   status:'boot', src:'js/vrc-route.js' }
     ,{ name:'scene',    status:'boot', src:'js/vrc-scene.js' }
     ,{ name:'sniff',    status:'boot', src:'js/vrc-sniff.js' }
    ]

   ,cmp:         {}    // handy lookup-table of `boot.components`
   ,loadedSoFar: null  // a tally, updated by `register()`
   ,allLoaded:   false // becomes `true` when all components are loaded

    //// References to the <HEAD> and <BODY> elements, when they appear.
   ,head: false
   ,body: false

    //// A list of progress events.
   ,log: []

    //// Called by the last statement of each component.
   ,register: function (name) { var FN = '`register()` ', i, c, fns

      //// Validate the component.
      var cmp = boot.cmp[name]
      if (! cmp)
        return fail(FN + "Found unexpected component: " + name, 8712)
      if ('boot' !== cmp.status)
        return fail(FN + "'" + name + "' has status " + cmp.status, 9807)

      //// Update state.
      cmp.status = 'loaded'
      boot.loadedSoFar++
      boot.log.unshift(name + ' component loaded')
      window.clearTimeout(waitTimer)

      //// Tell each component specifically about the newly loaded component.
      for (i=0; c=boot.components[i]; i++)
        if ( VRC[c.name] && (fns = VRC[c.name].on.loaded[name]) ) run(fns)

      //// Tell each component generally about the newly loaded component.
      for (i=0; c=boot.components[i]; i++)
        if ( VRC[c.name] && (fns = VRC[c.name].on.loaded.any) ) run(fns)

      //// Reset the wait-timer ready for the next registration...
      if (boot.loadedSoFar !== boot.components.length) {
        waitTimer = setTimeout(giveUp, maxLoadWait)

      //// ...or tell each component that all components have been loaded.
      } else {
        boot.log.unshift('all components loaded')
        boot.allLoaded = true
        for (i=0; c=boot.components[i]; i++)
          if ( VRC[c.name] && (fns = VRC[c.name].on.loaded.all) ) run(fns)
      }

    } // register()

  } // window.VRC.boot


  //// <HEAD> AND <BODY> READY

  if (! simulateBot) waitHeadBodyReady()
  function waitHeadBodyReady () {

    //// First poll at 1ms, then 2ms, then 4ms. @todo shortcut with 'load' event listener
    var headWait = 1
      , bodyWait = 1
    if ( getHead() ) { onHeadReady() } else { setTimeout(headCheck, headWait) }
    if ( getBody() ) { onBodyReady() } else { setTimeout(bodyCheck, bodyWait) }

    //// Record <HEAD> and <BODY> in `VRC.boot` if present, and return the result.
    function getHead () { return boot.head =
      document.getElementsByTagName('head')[0] || document.documentElement }
    function getBody () { return boot.body =
      document.body || document.getElementsByTagName('body')[0] }

    //// Ready handlers.
    function onHeadReady () {
      boot.log.unshift('head element ready')
      for (var nm in VRC)
        if (VRC[nm] && VRC[nm].on && VRC[nm].on.ready && VRC[nm].on.ready.head)
          run( VRC[nm].on.ready.head )
    }
    function onBodyReady () {
      boot.log.unshift('body element ready')
      for (var nm in VRC)
        if (VRC[nm] && VRC[nm].on && VRC[nm].on.ready && VRC[nm].on.ready.body)
          run( VRC[nm].on.ready.body )
    }

    //// Polling loops.
    function headCheck () { var FN = '`headCheck()` '
      if ( getHead() )
        onHeadReady()
      else if (maxHeadWait < headWait)
        fail(FN + 'Waited ' + headWait + 'ms, still no `HEAD` element', 8002)
      else
        setTimeout(headCheck, headWait *= 2)
    }
    function bodyCheck () { var FN = '`bodyCheck()` '
      if ( getBody() )
        onBodyReady()
      else if (maxBodyWait < bodyWait)
        fail(FN + 'Waited ' + bodyWait + 'ms, still no `BODY` element', 3298)
      else
        setTimeout(bodyCheck, bodyWait *= 2)
    }

  }


  //// COMPONENTS READY

  //// Build `VRC.boot.cmps` and register any preexisting components.
  for (var i=0,cmp; cmp=boot.components[i]; i++) {
    boot.cmp[cmp.name] = cmp
    if (VRC[cmp.name]) boot.register(cmp.name)
  }

  //// Load components which have not already been loaded.
  var waitTimer
  if (! simulateBot) {
    waitTimer = setTimeout(giveUp, maxLoadWait)
    loadComponents()
  }

  function loadComponents () {
    if (null !== boot.loadedSoFar) return // `loadComponents()` has already run
    if (! boot.head) return // <HEAD> not ready
    boot.loadedSoFar = 0 // signifies `loadComponents()` has run
    var suffix = defeatCache ? '?_'+Math.random().toString(36).slice(-4) : ''
    for (var i=0,cmp,script; cmp=boot.components[i]; i++) {
      if ('inline' === cmp.src) continue // a <SCRIPT> somewhere in the document
      script = document.createElement('script')
      script.src = cmp.src + suffix
      script.setAttribute('async', 'async') // modern browsers, including IE 10+
      script.setAttribute('title', i + ': ' + cmp.name + ' loaded by ' + FILE)
      script.onerror = function (e) { alert('Load error! ' + e.message) }
      boot.head.insertBefore(script, boot.head.firstChild)
    }
  }

  //// Wait for components to load.
  function giveUp () { var FN = '`giveUp()` '
    for (var i=0,cmp,boots=[]; cmp=boot.components[i]; i++)
      if ('loaded' !== cmp.status) boots.push(cmp.name)
    //@todo ignore subsequent `register()` calls, and do a `destruct()`
    if (boots.length)
      fail(FN + 'Waited ' + maxLoadWait + 'ms for: ' + boots.join(', '), 4041)
  }


  //// UTILITY
  function run (fns) {
    if ('function' === typeof fns) return fns()
    for (var i=0,fn; fn=fns[i]; i++) fn()
  }

}()
