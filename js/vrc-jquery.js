!function () { 'use strict'; var FILE = 'js/vrc-jquery.js'
  /* ------------------------------------------------------------------------ */
  /* Loads appropriate jQuery version as soon as VRC.sniff has run.           */
  /* ------------------------------------------------------------------------ */


  //// SETTINGS
  var maxJqueryWait = 2000 // milliseconds to wait before load fails


  //// SETUP AND VALIDATION
  var VRC = (window.VRC = window.VRC || {})
  var fail = function (msg, n) {(w80a || alert)(FILE + '#' + n + '\n  ' + msg)}
  if (window.VRC.jquery) return fail('`VRC.jquery` already exists', 3301)


  //// PUBLIC API
  var jquery = window.VRC.jquery = {

    //// Standard event handlers.
    on: {
      loaded: {
        config: beginLoad
       ,sniff:  beginLoad
      }
     ,ready: {}
     ,app:   {}
     ,fail:  null
    }

    //// HTML elements.
   ,el: {
      script: null
    }

   ,version: null // eg '3.1.1', signifies jQuery has loaded

  } // window.VRC.jquery


  //// JQUERY READY

  //// First poll at 200ms, then 400ms, then 600ms.
  var jqueryWait = 200
  if (! onJqueryReady() ) { setTimeout(jqueryCheck, jqueryWait) }

  //// Ready test and handler. Records the jQuery version after it loads.
  function onJqueryReady () { var FN = '`onJqueryReady()` ', fns, nm
    if (jquery.version) return true // `onJqueryReady()` has already succeeded
    if (! jquery.el.script) return // loading not yet begun

    //// Test whether jQuery has loaded, and record its version.
    if (! window.jQuery || ! window.jQuery.fn) return // loading not complete
    jquery.version = window.jQuery.fn.jquery.split(' ').shift()

    //// Log, and tell each component that jQuery is now available.
    VRC.boot.log.unshift('jQuery ' + jquery.version + ' ready')
    for (var nm in VRC)
      if (VRC[nm] && VRC[nm].on && VRC[nm].on.ready && VRC[nm].on.ready.jquery)
        run( VRC[nm].on.ready.jquery )
  }

  //// Polling loop.
  function jqueryCheck () { var FN = '`jqueryCheck()` '
    if ( onJqueryReady() )
      return
    else if (maxJqueryWait <= jqueryWait)
      fail(FN + 'Waited ' + jqueryWait + 'ms, still no `window.jQuery`', 7001)
    else
      setTimeout(jqueryCheck, jqueryWait += 200)
  }


  //// LOAD JQUERY
  beginLoad()
  function beginLoad () { var FN = '`beginLoad()` '
    if (jquery.el.script) return // loading already begun
    if (! VRC.boot || ! VRC.config || ! VRC.sniff) return // wait for these

    //// Choose appropriate jQuery src.
    var src = VRC.config.jquery[ VRC.legacy.jquery ? 'legacySrc' : 'modernSrc' ]

    //// Create the <SCRIPT> element.
    var script = jquery.el.script = document.createElement('script')
    script.src = src
    script.setAttribute('async', 'async') // IE 10+
    script.setAttribute('title', 'jquery loaded by ' + FILE)
    script.onerror = function () { w80a(FN + 'jq load error!', src) }//@todo
    if (! VRC.legacy.load) script.onload = onJqueryReady // shortcut polling
    VRC.boot.head.insertBefore(script, VRC.boot.head.firstChild)
  }


  //// UTILITY
  function run (fns) {
    if ('function' === typeof fns) return fns()
    for (var i=0,fn; fn=fns[i]; i++) fn()
  }


  //// Let VRC.boot know that this component has loaded.
  if (VRC.boot) VRC.boot.register('jquery')

}()
