!function () { 'use strict'; var FILE = 'js/vrc-panel.js'
  /* ------------------------------------------------------------------------ */
  /* A popup for info, notifications and advanced control of the app.         */
  /* ------------------------------------------------------------------------ */


  //// SETUP AND VALIDATION
  var VRC = (window.VRC = window.VRC || {})
  var fail = function (msg, n) {(w80a || alert)(FILE + '#' + n + '\n  ' + msg)}
  if (window.VRC.panel) return fail('`VRC.panel` already exists', 7452)


  //// PUBLIC API
  var panel = VRC.panel = {

    //// Standard event handlers.
    on: { loaded:{}, app: {}, ready:{}, fail:null }

  }


  //// Let VRC.boot know that this component has loaded.
  if (VRC.boot) VRC.boot.register('panel')

}()
