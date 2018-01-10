!function () { 'use strict'; var FILE = 'js/vrc-aframe.js'
  /* ------------------------------------------------------------------------ */
  /* Loads appropriate A-Frame version as soon as VRC.sniff has run.          */
  /* ------------------------------------------------------------------------ */


  //// SETTINGS
  var maxAframeWait = 2000 // milliseconds to wait before load fails


  //// SETUP AND VALIDATION
  var VRC = (window.VRC = window.VRC || {})
  var fail = function (msg, n) {(w80a || alert)(FILE + '#' + n + '\n  ' + msg)}
  if (window.VRC.aframe) return fail('`VRC.aframe` already exists', 4199)


  //// PUBLIC API
  var aframe = window.VRC.aframe = {

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

   ,version: null // eg '0.3.0', signifies A-Frame has loaded

  } // window.VRC.aframe


  //// AFRAME READY

  //// First poll at 200ms, then 400ms, then 600ms.
  var aframeWait = 200
  if (! onAframeReady() ) { setTimeout(aframeCheck, aframeWait) }

  //// Ready test and handler. Records the A-Frame version after it loads.
  function onAframeReady () { var FN = '`onAframeReady()` ', fns, nm
    if (aframe.version) return true // `onAframeReady()` has already succeeded
    if (! aframe.el.script) return // loading not yet begun

    //// Test whether A-Frame has loaded, and record its version.
    if (! window.AFRAME) return // loading not complete
    aframe.version = window.AFRAME.version

    //// Log, and tell each component that A-Frame is now available.
    VRC.boot.log.unshift('A-Frame ' + aframe.version + ' ready')
    for (var nm in VRC)
      if (VRC[nm] && VRC[nm].on && VRC[nm].on.ready && VRC[nm].on.ready.aframe)
        run( VRC[nm].on.ready.aframe )
  }

  //// Polling loop.
  function aframeCheck () { var FN = '`aframeCheck()` '
    if ( onAframeReady() )
      return
    else if (maxAframeWait <= aframeWait)
      fail(FN + 'Waited ' + aframeWait + 'ms, still no `window.AFRAME`', 1708)
    else
      setTimeout(aframeCheck, aframeWait += 200)
  }


  //// LOAD AFRAME
  beginLoad()
  function beginLoad () { var FN = '`beginLoad()` '
    if (aframe.el.script) return // loading already begun
    if (! VRC.boot || ! VRC.config || ! VRC.sniff) return // wait for these

    //// Deal with legacy UAs which can’t handle A-Frame.
    if (VRC.legacy.aframe) return aframe.version = 'legacy'

    //// Create the <SCRIPT> element.
    var script = aframe.el.script = document.createElement('script')
    script.src = VRC.config.aframe.src
    script.setAttribute('async', 'async') // IE 10+
    script.setAttribute('title', 'aframe loaded by ' + FILE)
    script.onerror = function () { w80a(FN + 'jq load error!', src) }//@todo
    if (! VRC.legacy.load) script.onload = onAframeReady // shortcut polling
    VRC.boot.head.insertBefore(script, VRC.boot.head.firstChild)
  }


  //// UTILITY
  function run (fns) {
    if ('function' === typeof fns) return fns()
    for (var i=0,fn; fn=fns[i]; i++) fn()
  }


  //// Let VRC.boot know that this component has loaded.
  if (VRC.boot) VRC.boot.register('aframe')

}()
