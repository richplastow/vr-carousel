!function () { 'use strict'; var FILE = 'js/vrc-progress.js'
  /* ------------------------------------------------------------------------ */
  /* Displays VRC.boot’s progress, followed by VRC.preload’s progress         */
  /* ------------------------------------------------------------------------ */


  //// SETUP AND VALIDATION
  var VRC = (window.VRC = window.VRC || {})
  var fail = function (msg, n) {(w80a || alert)(FILE + '#' + n + '\n  ' + msg)}
  if (VRC.progress) return fail('`VRC.progress` already exists', 9011)


  //// PUBLIC API
  var progress = window.VRC.progress = {

    //// Standard event handlers.
    on: {
      loaded: {
        any: update
       ,all: update
      }
     ,ready: {
        head:    addStyle
       ,body:  [ addWrap, update ]
       ,jquery:  update
       ,aframe:  update
       ,preload: update
       ,scene:   update
      }
     ,app: {
        start: null
       ,pause: null
       ,play:  null
       ,quit:  null
      }
     ,fail: null
    }

    //// HTML elements.
   ,el: {
      style: null
     ,wrap:  null
     ,log:   null
    }

  } // window.VRC.progress


  //// CSS
  addStyle()
  function addStyle () { var FN = '`addStyle()` '
    if (progress.el.style) return // already added
    if (! VRC.boot || ! VRC.boot.head) return // <HEAD> not ready
    var style = progress.el.style = document.createElement('style')
    var css = [
      '/* ' + FILE + ' ' + FN + '*/'
     ,'#vrc-progress-wrap {'
     ,'  position: fixed;'
     ,'  top: 0;'
     ,'  left: 0;'
     ,'  right: 0;'
     ,'  bottom: 0;'
     ,'  height: 100%;' // IE 6, in combination with 100% <BODY> height
     ,'  color: #B5BE00;'
     ,'  background-color: #808080;'
     ,'  z-index: 998;' // behind #vrc-sniff-wrap
     ,'  transition: opacity 0.5s 1s, visibility 1.5s;'
     ,'}'
     ,'#vrc-progress-wrap.vrc-100pc {'
     ,'  opacity: 0;'
     ,'  visibility: hidden;'
     ,'}'
     ,'#vrc-progress-outer {'
     ,'  position: absolute;'
     ,'  top: 30%;'
     ,'  left: 1em;'
     ,'  right: 1em;'
     ,'  height: 0.2%;'
     ,'  background: #333;'
     ,'}'
     ,'#vrc-progress-inner {'
     ,'  width: 0;'
     ,'  height: 100%;'
     ,'  background: #B5BE00;'
     ,'  transition: width 0.3s;'
     ,'}'
     ,'#vrc-progress-wrap.vrc-0pc   #vrc-progress-inner { width:   0%; }'
     ,'#vrc-progress-wrap.vrc-10pc  #vrc-progress-inner { width:  10%; }'
     ,'#vrc-progress-wrap.vrc-20pc  #vrc-progress-inner { width:  20%; }'
     ,'#vrc-progress-wrap.vrc-30pc  #vrc-progress-inner { width:  30%; }'
     ,'#vrc-progress-wrap.vrc-40pc  #vrc-progress-inner { width:  40%; }'
     ,'#vrc-progress-wrap.vrc-50pc  #vrc-progress-inner { width:  50%; }'
     ,'#vrc-progress-wrap.vrc-60pc  #vrc-progress-inner { width:  60%; }'
     ,'#vrc-progress-wrap.vrc-70pc  #vrc-progress-inner { width:  70%; }'
     ,'#vrc-progress-wrap.vrc-80pc  #vrc-progress-inner { width:  80%; }'
     ,'#vrc-progress-wrap.vrc-90pc  #vrc-progress-inner { width:  90%; }'
     ,'#vrc-progress-wrap.vrc-100pc #vrc-progress-inner { width: 100%; }'
     ,'#vrc-progress-log {'
     ,'  position: absolute;'
     ,'  top: 31%;'
     ,'  left: 0;'
     ,'  right: 0;'
     ,'  width: 100%;' // IE 6
     ,'  text-align: center;'
     ,'  font-size: 1.5em;'
     ,'}'
    ].join('\n')
    style.type = 'text/css' // enables `style.styleSheet` in legacy IE
    if (style.styleSheet)
      style.styleSheet.cssText = css
    else
      style.appendChild( document.createTextNode(css) )
    VRC.boot.head.appendChild(style)
  }


  //// HTML
  addWrap()
  function addWrap () { var FN = '`addWrap()` '
    if (progress.el.wrap) return // already added
    if (! VRC.boot || ! VRC.boot.body) return // <BODY> not ready
    var wrap = progress.el.wrap = document.createElement('div')
    var log  = progress.el.log  = document.createElement('tt')
    wrap.className = 'vrc-0pc'
    wrap.id = 'vrc-progress-wrap'
    log.id  = 'vrc-progress-log'
    wrap.innerHTML = [
      '<!-- ' + FILE + ' ' + FN + '-->'
     ,'<div id="vrc-progress-outer">'
     ,'  <div id="vrc-progress-inner"></div>'
     ,'</div>'
    ].join('\n')
    log.innerHTML = 'Booting...'
    wrap.appendChild(log)
    VRC.boot.body.insertBefore(wrap, VRC.boot.body.firstChild)
  }


  //// Called by VLC.boot.register() and VLC.preload.????().
  function update () {
    if (! VRC.boot) return
    var pc=0, boot=VRC.boot, preload=VRC.preload, el=progress.el, msg, cn
    if (VRC.config && VRC.config.progress.showFullLog)
      msg = boot.log.join('<br>\n')
    else
      msg = boot.log[0]
    if (boot)
      pc += (boot.loadedSoFar+1) / (boot.components.length+1) * 0.2
    if (VRC.jquery && VRC.jquery.version)
      pc += 0.1
    if (VRC.aframe && VRC.aframe.version)
      pc += 0.2
    if (preload && preload.assets.length)
      pc += (preload.loadedSoFar) / (preload.assets.length) * 0.5
    cn = 'vrc-' + ( Math.floor(pc * 10) * 10) + 'pc'
    if (el.log) el.log.innerHTML = msg
    setTimeout( function () { // for the CSS transition to work...
      if (el.wrap) el.wrap.className = cn }, 200) // ...wait a moment
  }

  //// Let VRC.boot know that this component has loaded.
  if (VRC.boot) VRC.boot.register('progress')

}()
