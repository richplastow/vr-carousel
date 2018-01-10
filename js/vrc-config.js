!function () { 'use strict'; var FILE = 'js/vrc-config.js'
/* ------------------------------------------------------------------------ */
/* Configuration for all VRC components.                                    */
/* ------------------------------------------------------------------------ */


  //// SETUP AND VALIDATION
  var VRC = (window.VRC = window.VRC || {})
  var fail = function (msg, n) {(w80a || alert)(FILE + '#' + n + '\n  ' + msg)}
  if (VRC.config) return fail('`VRC.config` already exists', 9182)


  //// PUBLIC API
  var config = VRC.config = {

    //// Standard event handlers.
    on: { loaded:{}, app: {}, ready:{}, fail:null }

    //// Configuration for 'js/vrc-aframe.js'
   ,aframe: {
      src: 'js/aframe.min.js'
    }

    //// Configuration for 'js/vrc-jquery.js'
   ,jquery: {
      legacySrc: 'js/jquery-1.12.4.min.js'     // primarily IE6-8
     ,modernSrc: 'js/jquery-3.1.1.slim.min.js' // iOS 7+, Android 4+
    }

    //// Configuration for 'js/vrc-panel.js'
   ,panel: {
      showAtStartup: true  // show the panel when the page loads
     ,toggleKey:     'p'   // press 'p' to show/hide; use `null` to disable
    }

    //// Configuration for 'js/vrc-parse.js'
   ,parse: {
      selector: {
        header:  '#vrc-header'
       ,section: '.vrc-section'
       ,title:   'h1'
       ,render:  '.vrc-render'
      }
     ,rx: {
        id:      /^[-a-z0-9]+$/
       ,color:   /^#[a-f0-9]{6}$/i
       ,dae:     /^dae\/[-a-z0-9]+\.dae$/
       ,texture: /^dae\/[-a-z0-9]+\.(png|jpg|jpeg)$/
      }
    }

    //// Configuration for 'js/vrc-progress.js'
   ,progress: {
      showFullLog: true // show the complete log under the progress bar
    }

    //// Configuration for 'js/vrc-sniff.js'
   ,sniff: {
      showAtStartup: false // show the sniff message when the page loads
     ,toggleKey:     'S'   // [SHIFT+s] to show/hide; use `null` to disable
     ,alwaysLegacy:  false   // useful for developing the legacy view
    }

  } // window.VRC.config


  //// Let VRC.boot know that this component has loaded.
  if (VRC.boot) VRC.boot.register('config')

}()
