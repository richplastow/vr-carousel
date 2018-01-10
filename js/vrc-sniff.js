!function () { 'use strict'; var FILE = 'js/vrc-sniff.js'
  /* ------------------------------------------------------------------------ */
  /* Determines the runtime environment’s capabilities.                       */
  /* ------------------------------------------------------------------------ */
  /* Tested on: Chrome 15+  Firefox 3+  IE 6+  Opera 10+  Safari 4+           */
  /* Tested on: Android 1+  iOS 3+  Windows XP+ [@todo complete this list]    */


  //// SETUP AND VALIDATION
  var VRC = (window.VRC = window.VRC || {}), ua = navigator.userAgent
  var fail = function (msg, n) {(w80a || alert)(FILE + '#' + n + '\n  ' + msg)}
  if (window.VRC.sniff) return fail('`VRC.sniff` already exists', 6194)


  //// PUBLIC API
  var sniff = VRC.sniff = {

    //// Standard event handlers.
    on: {
      loaded: {
        config: [ showWrap, allowKeypress ]
      }
     ,ready:{
        head:   addStyle
       ,body:   [ addBodyClass, addWrap, showWrap, allowKeypress ]
       ,jquery: allowKeypress
      }
     ,app:  {}
     ,fail: null
    }

    //// HTML attributes and elements.
   ,el: {
      bodyClass: null
     ,style:     null
     ,wrap:      null
     ,dismiss:   null
    }

    //// Set by `allowKeypress()` after it is successfully run.
   ,toggleKeycode: null

  }


  //// OPERATING SYSTEM
  VRC.OS =
    inUA('Windows Phone')            ? 'other'
   :inUA('Android')                  ? 'android'
   :inUA('iOS', 'iPh', 'iPo', 'iPa') ? 'ios'
   :inUA('Mac OS X')                 ? 'osx'
   :inUA('X11')                      ? 'linux'
   :inUA('Windows')                  ? 'windows'
   :                                   'other'
  VRC.os = {}; VRC.os[VRC.OS] = true
  //// VRC.OS = 'osx', VRC.os.osx = true, 'body.vrc-os-osx'


  //// OPERATING SYSTEM VERSION
  VRC.os.V =
    VRC.os.android ? +(/Android( (\d+\.\d+))?/.exec(ua)[2]||0) // eg 'Android;'
   :VRC.os.ios     ? (+/OS (\d+)/.exec(ua)[1] + /OS \d+_(\d+)/.exec(ua)[1]*0.1)
   :VRC.os.osx     ? +/Mac OS X 10[._](\d+)/.exec(ua)[1]
   :VRC.os.windows ? /Windows ([ .A-Za-z0-9]+)/.exec(ua)[1] // usually 'NT *.*'
   :                 0
  //// VRC.os.V = 9.2, 'body.vrc-os-v9' (not 'body.vrc-os-v9.2')


  //// USER AGENT
  VRC.UA =
    inUA(' YaBr')                           ? 'other' // Yandex
   :inUA('SamsungBrowser/')                 ? 'samsung'
   :inUA(' Edge/')                          ? 'edge'
   :inUA('OPiOS', 'OPR/', 'Opera/')         ? 'opera'
   :inUA('CriOS', 'Chrome')                 ? 'chrome'
   :inUA('FxiOS', 'Firefox')                ? 'firefox'
   :inUA(' Trident/', 'MSIE ')              ? 'ie'
   :inUA(' Android 4')                      ? 'other'
   :inUA('Slurp', 'ia_archiver', 'ooglebot', // Googlebot or googlebot
     'bingbot', 'Sogou', 'Baidu', 'Exabot',
     'yandex.com/bots', 'DuckDuckBot',
     'MJ12bot', 'BingPreview', 'SimplePie',
     'AdsBot-Google', 'facebot', 'ScoutJet',
     'SiteLockSpider', 'BLEXBot', 'okhttp',
     ' AOL ', '/Teoma', 'curl/')            ? 'bot'
   :(inUA(' Safari/') && ! VRC.os.android)  ? 'safari'
   :navigator.standalone                    ? 'safari' // homescreen
   :                                          'other'
  VRC.ua = {}; VRC.ua[VRC.UA] = true
  //// VRC.UA = 'opera', VRC.ua.opera = true, 'body.vrc-ua-opera'
  //// www.useragentstring.com/pages/useragentstring.php has more UA strings...


  //// USER AGENT VERSION
  VRC.ua.V =
    /Version\/\d/.test(ua) ? +/Version\/(\d+)/.exec(ua)[1]
   :VRC.ua.other           ? 0
   :VRC.ua.samsung         ? +/SamsungBrowser\/(\d+)/.exec(ua)[1]
   :VRC.ua.edge            ? +/ Edge\/(\d+)/.exec(ua)[1]
   :VRC.ua.opera           ? +/OPR\/(\d+)/.exec(ua)[1]
   :VRC.ua.chrome          ? +/(CriOS|Chrome)\/(\d+)/.exec(ua)[2]
   :VRC.ua.firefox         ? +/(FxiOS|Firefox)\/(\d+)/.exec(ua)[2]
   :VRC.ua.ie              ? +/ (rv:|MSIE )(\d+)/.exec(ua)[2]
   :VRC.ua.safari          ? +/ OS (\d+)/.exec(ua)[1]
   :                         0 // eg `VRC.ua.bot`
  //// VRC.ua.V = 123, 'body.vrc-ua-v14'


  //// DEVICE
  VRC.DEVICE =
    (VRC.os.linux||VRC.os.osx||VRC.os.windows) ? 'desktop'
   :inUA('iPa', 'Tablet')                      ? 'tablet'
   :inUA('iPh', 'iPo', 'Mobile')               ? 'phone' // can use headset
   :inUA('Bunjalloo', 'wii', 'PSP', 'PS3',
      'PLAYSTATION'                          ) ? 'console'
   :(0 && '@todo')                             ? 'cordova'
   :                                             'other'
  VRC.device = {}; VRC.device[VRC.DEVICE] = true
  //// VRC.DEVICE = 'phone', VRC.device.phone = true, 'body.vrc-device-phone'


  //// LEGACY REQUIREMENTS
  if (VRC.config.sniff.alwaysLegacy) {

    VRC.legacy = {
      jquery: true // force this browser to use jQuery 1.12.*
     ,aframe: true // prevent this browser from using A-Frame
     ,load:   true // prevent this browser from `script.onload()`
    }

  } else {

    VRC.legacy = {

      jquery: ( // VRC.legacy.jquery = true, if this browser needs jQuery 1.12.*
          (VRC.ua.firefox &&  6 > VRC.ua.V)
       || (VRC.ua.ie      &&  9 > VRC.ua.V)
       || (VRC.ua.opera   && 11 > VRC.ua.V)
       || (VRC.ua.safari  &&  6 > VRC.ua.V)
       || (VRC.ua.other   &&  2 > VRC.os.V && VRC.os.android)
      )

     ,aframe: ( // VRC.legacy.aframe = true, if A-Frame is not supported
           VRC.ua.bot

       || (VRC.os.android && (
         false //@todo - note that Opera Mini is not happy about WebGL..?
       ) )

       || (VRC.os.ios && 8 > VRC.os.V) // tested on Chrome 47 and Safari 8

       || (VRC.os.osx && (
            (VRC.ua.chrome  && 24 > VRC.ua.V) // tested on OS X 10.6, 10.10
         || (VRC.ua.firefox && 23 > VRC.ua.V) // tested on OS X 10.6, 10.10
         || (VRC.ua.opera   && 15 > VRC.ua.V) // tested on OS X 10.6, 10.10
         || (VRC.ua.safari  &&  8 > VRC.ua.V) // tested on OS X 10.9, 10.10
       ) )

       || (VRC.os.windows && ( //@todo test on earlier Windows 10 versions
            (VRC.ua.chrome  && 42 > VRC.ua.V) // tested on Windows 10
         || (VRC.ua.firefox && 47 > VRC.ua.V) // tested on Windows 10
         ||  VRC.ua.ie // edge 13 and 14 are ok, but no IE version works
         || (VRC.ua.opera   && 29 > VRC.ua.V) // tested on Windows 10
         ||  VRC.ua.safari                    // tested on Windows 10
       ) )
     )//@todo catch AFRAME exceptions after optimistically loading it, and then enter legacy mode

     ,load: ( // VRC.legacy.load = true, if `script.onload()` should not be used
          (VRC.ua.ie      &&  9 > VRC.ua.V)
       || (VRC.ua.other   &&  2 > VRC.os.V && VRC.os.android)
      )

    }

  }


  // //// VR CAPABILITIES
  // VRC.vr = []; // eg ['xx']
  // VRC.vr.can = {
  //   xx: false
  //  ,yy: false
  //  ,zz: false
  // };
  //  ,hasNativeVR: false // true for mobile UAs, and UAs with headset support

  //// Determine whether the browser can handle VR.
  // VRC.hasNativeVR = W.hasNativeWebVRImplementation || AFM.utils.isMobile();


  //// <BODY> CLASSES
  addBodyClass()
  function addBodyClass () { var FN = '`addBodyClass()` '
    if (! VRC.boot || ! VRC.boot.body) return // <BODY> not ready
    if (sniff.el.bodyClass) return // already added
    var bc = sniff.el.bodyClass =
       'vrc-os-'     + VRC.OS     // 'body.vrc-os-osx'
     +' vrc-os-v'    + ~~VRC.os.V // 'body.vrc-os-v9' (not '...os-v9.2')
     +' vrc-ua-'     + VRC.UA     // 'body.vrc-ua-opera'
     +' vrc-ua-v'    + VRC.ua.V   // 'body.vrc-ua-v14'
     +' vrc-device-' + VRC.DEVICE // 'body.vrc-device-phone'
    VRC.boot.body.className += ('' === VRC.boot.body.className ? '' : ' ') + bc
  }


  //// MAKE WRAP VISIBLE
  showWrap()
  function showWrap () { var FN = '`showWrap()` '
    if (! VRC.config) return // configuration not loaded
    if (! sniff.el.wrap) return // wrap not created
    if (! VRC.config.sniff.showAtStartup) return // don’t show it
    setTimeout( function () { // for the CSS transition to work...
      sniff.el.wrap.className = 'vrc-active' }, 200) // ...wait a moment
  }


  //// CSS
  addStyle()
  function addStyle () { var FN = '`addStyle()` '
    if (sniff.el.style) return // already added
    if (! VRC.boot || ! VRC.boot.head) return // <HEAD> not ready
    var style = sniff.el.style = document.createElement('style')
    var css = [
      '/* ' + FILE + ' ' + FN + '*/'
     ,'#vrc-sniff-wrap {'
     ,'  z-index: 999;'
     ,'  position: absolute;'
     ,'  visibility: hidden;'
     ,'  opacity: 0;'
     ,'  top: 0;'
     ,'  left: 0;'
     ,'  right: 0;'
     ,'  margin: 0;'
     ,'  padding: 0 0.5em;'
     ,'  font-family: Arial, sans-serif;'
     ,'  color: #fff; /* legacy UAs */'
     ,'  color: rgba(255,255,255,0);'
     ,'  line-height: 0;'
     ,'  transition: color 1s, opacity 0.5s, line-height 0.5s, padding 0.5s,'
       + ' visibility 0s 1s;'
     ,'}'
     ,'#vrc-sniff-wrap.vrc-active {'
     ,'  visibility: visible;'
     ,'  opacity: 1;'
     ,'  padding: 0.5em;'
     ,'  color: #fff;'
     ,'  line-height: 1;'
     ,'  transition: color 0.1s, opacity 1s, line-height 0.5s, padding 0.5s,'
       + ' visibility 0s 0s;'
     ,'}'
     ,'#vrc-sniff-wrap tt {'
     ,'  display: block;'
     ,'  border-top: 0 solid rgba(255,255,255,0);'
     ,'  transition: border 0.5s, margin 0.5s, padding 0.5s;'
     ,'}'
     ,'#vrc-sniff-wrap.vrc-active tt {'
     ,'  margin-top: 0.4em;'
     ,'  padding-top: 0.4em;'
     ,'  border-top: 0.15em solid rgba(255,255,255,0.3);'
     ,'}'
     ,'#vrc-sniff-wrap .vrc-dismiss {'
     ,'  position: absolute;'
     ,'  padding: 0 0.5em;'
     ,'  top: 0.4em;'
     ,'  right: 0;'
     ,'  color: rgba(255,255,255,0.7);'
     ,'  transform: scale(1.5, 1.5);'
     ,'  transition: color 0.2s, transform 0.5s;'
     ,'  -webkit-touch-callout: none;' // iOS Safari
     ,'  -webkit-user-select: none;'   // Chrome/Safari/Opera
     ,'  -khtml-user-select: none;'    // Konqueror
     ,'  -moz-user-select: none;'      // Firefox
     ,'  -ms-user-select: none;'       // Internet Explorer/Edge
     ,'  user-select: none;'           // currently not supported by any browser
     ,'}'
     ,'#vrc-sniff-wrap.vrc-active .vrc-dismiss:hover {'
     ,'  cursor: pointer;'
     ,'  color: #fff;'
     ,'  transform: scale(2, 2);'
     ,'}'
    ]
    if (VRC.ua.chrome) css.push(
      'body.vrc-ua-chrome  #vrc-sniff-wrap {'
     ,'  background: #DFA920;'
     ,'}')
    if (VRC.ua.edge) css.push(
      'body.vrc-ua-edge    #vrc-sniff-wrap {'
     ,'  background: #4475BF;'
     ,'}')
    if (VRC.ua.firefox) css.push(
      'body.vrc-ua-firefox #vrc-sniff-wrap {'
     ,'  background: #C15B00;'
     ,'  background: linear-gradient(#D9800C,#B53122);'
     ,'}')
    if (VRC.ua.ie && 8 > VRC.ua.V) css.push(
      'body.vrc-ua-ie      #vrc-sniff-wrap {'
     ,'  background: #6A8EE5;'
     ,'}')
    if (VRC.ua.ie && 7 < VRC.ua.V) css.push(
      'body.vrc-ua-ie      #vrc-sniff-wrap {'
     ,'  background: #6A8EE5;'
     ,'  background: linear-gradient(#6EA8F9,#4D79CA);'
     ,'}')
    if (VRC.ua.opera) css.push(
      'body.vrc-ua-opera   #vrc-sniff-wrap {'
     ,'  background: #D23821;'
     ,'  background: linear-gradient(#B51000,#F75148);'
     ,'}')
    if (VRC.ua.safari) css.push(
      'body.vrc-ua-safari  #vrc-sniff-wrap {'
     ,'  background: #54A3C8;'
     ,'  background: linear-gradient(#57E0D1, #3472BD);'
     ,'}')
    if (VRC.ua.samsung) css.push(
      'body.vrc-ua-samsung  #vrc-sniff-wrap {'
     ,'  background: #8238DF;'
     ,'  background: linear-gradient(#7034AB, #8847FF);'
     ,'}')
    if (VRC.ua.other) css.push(
      'body.vrc-ua-other   #vrc-sniff-wrap {'
     ,'  background: #808080;'
     ,'  background: linear-gradient(#666666, #999999);'
     ,'}')
    css = css.join('\n')
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
    if (sniff.el.wrap) return // already added
    if (! VRC.boot || ! VRC.boot.body) return // <BODY> not ready
    var wrap    = sniff.el.wrap    = document.createElement('h1')
    wrap.id = 'vrc-sniff-wrap'
    var dismiss = sniff.el.dismiss = document.createElement('span')
    dismiss.className = 'vrc-dismiss'
    dismiss.title = 'Dismiss'
    dismiss.innerHTML = '&times;'
    dismiss.onclick = function () { wrap.className = '' }
    wrap.innerHTML = [
      '<!-- ' + FILE + ' ' + FN + '-->'
     ,'<span>' + VRC.UA     +'</span>'
     ,'<span>' + VRC.ua.V   +'</span>'
     ,'<span>' + VRC.OS     +'</span>'
     ,'<span>' + (VRC.os.osx ? '10.' : '') + VRC.os.V   +'</span>'
     ,'<span>' + VRC.DEVICE +'</span>'
     ,'<tt>' + navigator.userAgent + '</tt>'
    ].join('\n')
    wrap.appendChild(dismiss)
    VRC.boot.body.appendChild(wrap)
    showWrap()
    allowKeypress()
  }


  //// KEYPRESS
  allowKeypress()
  function allowKeypress () { var FN = '`allowKeypress()` '
    if (sniff.toggleKeycode) return // already enabled
    if (! VRC.config || ! VRC.jquery || ! VRC.jquery.version) return
    if (! VRC.boot || ! VRC.boot.body) return // <BODY> not ready
    if (! sniff.el.wrap) return // `addWrap()` not run yet
    sniff.toggleKeycode = VRC.config.sniff.toggleKey.charCodeAt(0)
    $(document).keypress( function (event) { // legacy IE can’t use `$(window)`
      if (event.which === sniff.toggleKeycode)
        $(sniff.el.wrap).toggleClass('vrc-active')
    })
  }


  //// UTILITY
  function inUA () {
    for (var i=0; i<arguments.length; i++) {
      if ( 0 <= ua.indexOf(arguments[i]) ) return true
    }
  }


  //// Let VRC.boot know that this component has loaded.
  if (VRC.boot) VRC.boot.register('sniff')

}()


/*
//// EVENT HUB.
var VRC_EH = (window.VRC_EH = window.VRC_EH || {
  ons: {}
 ,on: function (evt, run) {
    (VRC_EH.ons[evt]=VRC_EH.ons[evt]||[]).push(run)
  }
 ,do: function (evt) {
    for (var run, i=0, runs=VRC_EH.ons[evt]||[]; run=runs[i]; i++) { run() }
  }
})

var EH=(window.VRC_E=window.VRC_E||{ons:{},on:function(evt,run){(EH.ons[evt]
=EH.ons[evt]||[]).push(run)},do:function(evt){for(var run,i=0,runs=EH.ons[evt]
||[];run=runs[i];i++){run()}}})

EH.on('hullo', function () { alert('hi!'); } );
EH.on('hullo', function () { alert('ok!'); } );
EH.do('hullo');
*/
