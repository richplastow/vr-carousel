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


!function () { 'use strict'; var FILE = 'js/vrc-boot.js'
  /* ------------------------------------------------------------------------ */
  /* Loads and initialises the VRC components.                                */
  /* ------------------------------------------------------------------------ */
  /* Detects when the <BODY> (and <HEAD>, for IE 6+) are ready, before jQuery */
  /* loads. At this stage we don’t know whether the runtime environment       */
  /* supports `addEventListener('load', ...)`, so VRC.boot just uses polling. */
  /* ------------------------------------------------------------------------ */


  //// SETTINGS
  var maxLoadWait = 2000 // milliseconds of inaction to allow before load fails
  var maxHeadWait =  250 // milliseconds to wait before finding <HEAD> fails
  var maxBodyWait = 1000 // milliseconds to wait before finding <BODY> fails
  var defeatCache = true // append a random query-string to all 'src' attributes


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
        head:   loadComponents
       ,body:   null
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
      { name:'aframe', status:'boot', src:'inline' }
     ,{ name:'config', status:'boot', src:'inline' }
     ,{ name:'jquery', status:'boot', src:'inline' }
     ,{ name:'panel', status:'boot', src:'inline' }
     ,{ name:'parse', status:'boot', src:'inline' }
     ,{ name:'preload', status:'boot', src:'inline' }
     ,{ name:'progress', status:'boot', src:'inline' }
     ,{ name:'route', status:'boot', src:'inline' }
     ,{ name:'scene', status:'boot', src:'inline' }
     ,{ name:'sniff', status:'boot', src:'inline' }
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


  //// COMPONENTS READY

  //// Build `VRC.boot.cmps` and register any preexisting components.
  for (var i=0,cmp; cmp=boot.components[i]; i++) {
    boot.cmp[cmp.name] = cmp
    if (VRC[cmp.name]) boot.register(cmp.name)
  }

  //// Load components which have not already been loaded.
  loadComponents()
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
  var waitTimer = setTimeout(giveUp, maxLoadWait)


  //// UTILITY
  function run (fns) {
    if ('function' === typeof fns) return fns()
    for (var i=0,fn; fn=fns[i]; i++) fn()
  }

}()


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
        section: '.vrc-section'
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

    //// Configuration for 'js/vrc-scene.js'
   ,scene: {
      alwaysLegacy: false // useful for developing the legacy view
    }

    //// Configuration for 'js/vrc-sniff.js'
   ,sniff: {
      showAtStartup: false // show the sniff message when the page loads
     ,toggleKey:     'S'   // [SHIFT+s] to show/hide; use `null` to disable
    }

  } // window.VRC.config


  //// Let VRC.boot know that this component has loaded.
  if (VRC.boot) VRC.boot.register('config')

}()


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


!function () { 'use strict'; var FILE = 'js/vrc-parse.js'
  /* ------------------------------------------------------------------------ */
  /* Creates VRC.parse.sections/ids from '.vrc-section' HTML content.         */
  /* ------------------------------------------------------------------------ */


  //// SETUP AND VALIDATION
  var VRC = (window.VRC = window.VRC || {})
  var fail = function (msg, n) {(w80a || alert)(FILE + '#' + n + '\n  ' + msg)}
  if (VRC.parse) return fail('`VRC.parse` already exists', 9771)


  //// PUBLIC API
  var parse = window.VRC.parse = {

    //// Standard event handlers.
    on: {
      loaded: {
        config: parseSections
      }
     ,ready: {
        body:   parseSections
       ,jquery: parseSections
      }
     ,app: {}
     ,fail: null
    }

    //// Parsed sections
   ,sections: [] // filled by `parseSections()`
   ,ids:      {} // keys are paths for VRC.route, values are items in `sections`

    //// jQuery ref.
   ,$sections: null

  } // window.VRC.parse


  //// Try to parse all <DIV class="vrc-section"> elements.
  parseSections();
  function parseSections () { var FN = '`parseSections()` '
    if (parse.sections.length) return // already added
    if (! VRC.boot || ! VRC.boot.body) return // <BODY> not ready
    if (! VRC.config) return // rx selectors not available yet
    if (! VRC.jquery || ! VRC.jquery.version) return // jQuery not ready

    var selector = VRC.config.parse.selector

    //// Get a jQuery reference-list of all the sections.
    parse.$sections = $(selector.section)
    if (! parse.$sections.length) return fail(FN +
      "Nothing matches $('" + selector.section + "')", 5232)

    //// Parse and record each section. (jQuery’s `each()` has no `break`).
    var sections = [], ids = {}
    for (var i=0,$section; $section=parse.$sections[i]; i++) {
      var $title, title, id, dae, texture, color, $render, render, section
      $section = $($section)

      //// Each section must have exactly one title.
      $title = $(selector.title, $section)
      if (1 !== $title.length) return fail(FN + "Section #" + i +
        " has " + $title.length + " titles, not 1", 4086)
      title = $title.text().replace(/^\s+|\s+$/, '')
      if ('' === title) return fail(FN + "Section #" + i +
        " has an empty title", 7718)

      //// Section ids must be unique and conform to VRC.config.parse.rx.id.
      id = $section.attr('id')
      if (! id) return fail(FN + "Section #" + i +
        " has no 'id' attribute", 8299)
      if (! VRC.config.parse.rx.id.test(id) ) return fail(FN + "Section #" + i +
        " 'id' '" + id + "' fails " + VRC.config.parse.rx.id, 6192)
      if (ids[id]) return fail(FN + "Section #" + i +
        " has duplicate 'id' attribute '" + id + "'", 6820)

      //// Each section must have a collada model.
      dae = $section.attr('data-vrc-dae')
      if (! dae) return fail(FN + "Section #" + i +
        " has no 'data-vrc-dae' attribute", 9009)
      if (! VRC.config.parse.rx.dae.test(dae) ) return fail(FN+"Section #" +
        i + " 'dae' '" + dae + "' fails " + VRC.config.parse.rx.dae, 7166)

      //// The texture (for the collada model) is optional.
      texture = $section.attr('data-vrc-texture')
      if (texture && ! VRC.config.parse.rx.texture.test(texture) ) return fail(
        FN+"Section #" + i + " 'texture' '" + texture + "' fails " +
        VRC.config.parse.rx.texture, 9184)

      //// Each section must have a color.
      color = $section.attr('data-vrc-color')
      if (! color) return fail(FN + "Section #" + i +
        " has no 'data-vrc-color' attribute", 7901)
      if (! VRC.config.parse.rx.color.test(color) ) return fail(FN+"Section #" +
        i + " 'color' '" + color + "' fails " + VRC.config.parse.rx.color, 9114)

      //// Each section must have exactly one render.
      $render = $(selector.render, $section)
      if (1 !== $render.length) return fail(FN + "Section #" + i +
        " has " + $render.length + " renders, not 1", 2213)
      render = $render.attr('data-vrc-render')
      if (! render) return fail(FN + "Section #" + i +
        " has a render element with no 'data-vrc-render' attribute", 7009)

      //// Record the section
      section = {
        index:   i
       ,title:   title
       ,id:      id
       ,dae:     dae
       ,texture: texture // can be undefined
       ,color:   color
       ,render:  render
      }
      sections.push(section)
      ids[id] = section
    }

    //// No fails, so record the sections, which signifies success.
    parse.sections = sections
    parse.ids = ids

    //// Tell each component that parsing is complete. The next stage will be to
    //// preload collada models and audio (or JPGs if A-Frame is not supported).
    VRC.boot.log.unshift('parsed ' + parse.sections.length + ' sections')
    for (var nm in VRC)
      if (VRC[nm] && VRC[nm].on && VRC[nm].on.ready && VRC[nm].on.ready.parse)
        run( VRC[nm].on.ready.parse )
  }


  //// UTILITY
  function run (fns) {
    if ('function' === typeof fns) return fns()
    for (var i=0,fn; fn=fns[i]; i++) fn()
  }

  //// Based on gist.github.com/mathewbyrne/1280286 @todo continue this?
  function slugify (text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
  }

  //// Let VRC.boot know that this component has loaded.
  if (VRC.boot) VRC.boot.register('parse')

}()


!function () { 'use strict'; var FILE = 'js/vrc-preload.js'
/* ------------------------------------------------------------------------ */
/* Preloads assets, after jQuery and VRC.parse are ready.                   */
/* ------------------------------------------------------------------------ */


  //// SETTINGS
  var maxLoadWait = 2000 // milliseconds of inaction to allow before load fails
  var defeatCache = true // append a random query-string to all 'src' attributes @todo

var $imgs = {}
  //// SETUP AND VALIDATION
  var VRC = (window.VRC = window.VRC || {})
  var fail = function (msg, n) {(w80a || alert)(FILE + '#' + n + '\n  ' + msg)}
  if (window.VRC.preload) return fail('`VRC.preload` already exists', 6041)


  //// PUBLIC API
  var preload = window.VRC.preload = {

    //// Standard event handlers.
    on: {
      loaded: {
        any:    null
       ,scene:  loadAssets
      }
     ,ready: {
        head:   null
       ,body:   loadAssets
       ,parse:  loadAssets
       ,jquery: loadAssets
       ,aframe: loadAssets // not needed for legacy user-agents
      }
     ,app: {
        start: null
       ,pause: null
       ,play:  null
       ,quit:  null
     }
     ,fail: null
    }

   ,assets: [

    ]

   ,ast:         {}    // handy lookup-table of `preload.assets`
   ,loadedSoFar: null  // a tally, updated by `register()`
   ,allLoaded:   false // becomes `true` when all components are loaded

    //// Called by the 'loaded' event of each <A-ASSET-ITEM>, or if we’re in
    //// 'file:' protocol, each <A-ASSET>.
   ,onModelLoad: function (event) { var FN = '`onModelLoad()` '
      preload.register(event.target.id)
    }

    //// Called by the 'load' event of each <A-ASSET-ITEM>.
   ,onTextureLoad: function (event) { var FN = '`onTextureLoad()` '
      preload.register(event.target.id)
    }

    //// Called by `onModelLoad(), and also the `onload()` of non-model assets.
   ,register: function (name) { var FN = '`register()` ', i, c, fns

      //// Validate the component.
      var asset = preload.ast[name]
      if (! asset)
        return fail(FN + "Found unexpected asset: " + name, 6112)
      if ('preload' !== asset.status)
        return fail(FN + "'" + name + "' has status " + asset.status, 8182)

      //// Update state.
      asset.status = 'loaded'
      preload.loadedSoFar++
      VRC.boot.log.unshift(name + ' asset loaded')
      window.clearTimeout(waitTimer)

      //// Tell each component generally about the newly loaded asset.
      for (i=0; c=VRC.boot.components[i]; i++)
        if ( VRC[c.name] && (fns = VRC[c.name].on.loaded.any) ) run(fns)

      //// Reset the wait-timer ready for the next registration...
      if (preload.loadedSoFar !== preload.assets.length) {
        waitTimer = setTimeout(giveUp, maxLoadWait)

      //// ...or tell each component that all assets have been loaded.
      } else {
        VRC.boot.log.unshift('all assets loaded')
        preload.allLoaded = true
        for (i=0; c=VRC.boot.components[i]; i++)
          if ( VRC[c.name] && (fns = VRC[c.name].on.ready.preload) ) run(fns)
      }

    } // register()

  } // window.VRC.preload


  //// BEGIN LOAD
  loadAssets()
  function loadAssets () { var FN = '`loadAssets()` '
    if (null !== preload.loadedSoFar) return // `loadAssets()` has already run
    if (! VRC.sniff) return // VRC.legacy not available yet
    if (! VRC.scene) return // we need to store a jQuery element in scene.$wrap
    if (! VRC.boot || ! VRC.boot.body) return // `boot.log` and <BODY> not ready
    if (! VRC.jquery || ! VRC.jquery.version) return // jQuery not ready
    if (! VRC.parse || ! VRC.parse.sections.length) return // content not parsed

    if (VRC.legacy.aframe || VRC.config.scene.alwaysLegacy)
      loadLegacyAssets()
    else
      loadAframeAssets()
  }


  //// Called by `loadAssets()` to preload JPGs for an old-school 2D carousel.
  function loadLegacyAssets () { var FN = '`loadLegacyAssets()` '
    preload.loadedSoFar = 0 // signifies `loadAframe/LegacyAssets()` has run

    VRC.scene.$wrap = $(
      [
        '<div>'
       ,'  <!-- ' + FILE + ' ' + FN + '-->'
       ,'  <h1>Legacy!</h1>'
       ,'</div>'
      ].join('\n')
    ).attr('id', 'vrc-scene-wrap')
     .appendTo('body')


    fail('loading ' + VRC.parse.sections.length + ' legacy assets');
  }


  //// Called by `loadAssets()` to preload assets for a 3D/VR carousel.
  function loadAframeAssets () { var FN = '`loadAframeAssets()` '
    if (! VRC.aframe || ! VRC.aframe.version) return // A-Frame not ready
    var isFileProtocol
    preload.loadedSoFar = 0 // signifies `loadAframe/LegacyAssets()` has run

    VRC.scene.$wrap = $(
      '<div id="vrc-scene-wrap"></div>\n'
     +'<!-- #vrc-scene-wrap ' + FILE + ' ' + FN + ' -->'
    ).appendTo('body')

    VRC.scene.$main = $(
      '<a-scene id="vrc-scene-main" vr-mode-ui="enabled:true"></a-scene>\n'
     +'<!-- #vrc-scene-main ' + FILE + ' ' + FN + ' -->'
    ).appendTo(VRC.scene.$wrap)

    VRC.scene.$assets = $(
      '<a-assets id="vrc-scene-assets" timeout="9999999"></a-assets>\n'
     +'<!-- #vrc-scene-assets ' + FILE + ' ' + FN + ' -->'
    ).appendTo(VRC.scene.$main)

    //// Preload collada models.
    if (isFileProtocol = 'file:' === window.location.protocol)
      $("<!-- 'file:' protocol, so " + FILE + ' ' + FN + ' uses <A-ENTITY> -->')
        .appendTo(VRC.scene.$assets)
    for (var i=0,name,src,asset,section; section=VRC.parse.sections[i]; i++) {
      name = 'vrc-model-' + i
      src = section.dae
      asset = { name:name, src:src, status:'preload', $el:null }
      preload.assets.push( preload.ast[name] = asset )
      if (isFileProtocol)
        asset.$el = $('<a-entity></a-entity>')
          .attr('collada-model', 'url('+src+')')
      else
        asset.$el = $('<a-asset-item></a-asset-item>')
          .attr('src', src)
      asset.$el
        .attr('id', name)
        .on('loaded', preload.onModelLoad)
        .appendTo(VRC.scene.$assets)
    }

    VRC.scene.$textures = $(
      '<div id="vrc-scene-textures" style="visibility:hidden"></div>\n'
     +'<!-- #vrc-scene-textures ' + FILE + ' ' + FN + ' -->'
   ).appendTo(VRC.scene.$wrap)

    //// Preload textures for collada models.
    for (var i=0,name,src,asset,section; section=VRC.parse.sections[i]; i++) {
      if (! section.texture) continue // textures are optional
      name = 'vrc-texture-' + i
      src = section.texture
      asset = { name:name, src:src, status:'preload', $el:null }
      preload.assets.push( preload.ast[name] = asset )
      asset.$el = $('<img>')
        .attr('id', name)
        .on('load', preload.onTextureLoad)
      asset.$el.appendTo(VRC.scene.$textures) // can’t chain to previous line
      asset.$el.attr('src', src) // add 'src' after 'onload', just to be safe
    }

    //// Adding the camera now prevents A-Frame from adding its default camera.
    VRC.scene.$camera = $([
        '<a-entity id="vrc-scene-camera" mouse-cursor'
       ,'  camera wasd-controls="enabled:true" look-controls="enabled:true"'
       ,'  position="0 1.3 -1" rotation="-20 0 0">'
       ,'</a-entity>'
       ,'<!-- #vrc-scene-camera ' + FILE + ' ' + FN + ' -->'
      ].join('\n')
    ).appendTo(VRC.scene.$main)

    VRC.scene.$fuse = $([
        '<a-entity id="vrc-scene-fuse"'
       ,'   position="0 0 -.6"'
       ,'   geometry="primitive:ring; radiusInner:0.015; radiusOuter:0.025; segmentsTheta:16"'
       ,'   visible="false"'
       ,'   material="color:#000; shader:flat">'
       ,'  <!-- <a-animation begin="click" easing="ease-in" attribute="scale"'
       ,'               fill="backwards" from="0.2 0.2 0.2" to="1 1 1"></a-animation>'
       ,'  <a-animation begin="cursor-fusing" easing="ease-in" attribute="scale"'
       ,'               fill="forwards" from="1 1 1" to="0.2 0.2 0.2"></a-animation> -->'
       ,'</a-entity>'
       ,'<!-- #vrc-scene-fuse ' + FILE + ' ' + FN + ' -->'
      ].join('\n')
    ).appendTo(VRC.scene.$camera)

    //// Adding the lights now prevents A-Frame from adding default lights.
    // @todo add lights

    waitTimer = setTimeout(giveUp, maxLoadWait)
  }


  //// Wait for assets to load.
  function giveUp () { var FN = '`giveUp()` '
    for (var i=0,asset,preloads=[]; asset=preload.assets[i]; i++)
      if ('loaded' !== asset.status) preloads.push(asset.name)
    //@todo ignore subsequent `register()` calls, and do a `destruct()`
    fail(FN + 'Waited ' + maxLoadWait + 'ms for: ' + preloads.join(', '), 1710)
  }
  var waitTimer


  //// UTILITY
  function run (fns) {
    if ('function' === typeof fns) return fns()
    for (var i=0,fn; fn=fns[i]; i++) fn()
  }


  //// Let VRC.boot know that this component has loaded.
  if (VRC.boot) VRC.boot.register('preload')

}()


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
     ,'  color: cyan;'
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
     ,'  left: 0;'
     ,'  right: 0;'
     ,'  height: 10px;'
     ,'  background: #333;'
     ,'}'
     ,'#vrc-progress-inner {'
     ,'  width: 0;'
     ,'  height: 10px;'
     ,'  background: #0ff;'
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
     ,'  top: 40%;'
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
    var pc = 0, boot = VRC.boot, preload = VRC.preload, el = progress.el, cn
      , msg = boot.log[0]
    msg = boot.log.join('<br>\n')
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
/*     console.log(name, pc * 100 + '% = ' + ( Math.floor(pc * 10) * 10) ); */
  }

  //// Let VRC.boot know that this component has loaded.
  if (VRC.boot) VRC.boot.register('progress')

}()


!function () { 'use strict'; var FILE = 'js/vrc-route.js'
  /* ------------------------------------------------------------------------ */
  /* Xx.         */
  /* ------------------------------------------------------------------------ */


  //// SETUP AND VALIDATION
  var VRC = (window.VRC = window.VRC || {})
  var fail = function (msg, n) {(w80a || alert)(FILE + '#' + n + '\n  ' + msg)}
  if (window.VRC.route) return fail('`VRC.route` already exists', 2812)


  //// PUBLIC API
  var route = VRC.route = {

    //// Standard event handlers.
    on: { loaded:{}, app: {}, ready:{}, fail:null }

  }


  //// Let VRC.boot know that this component has loaded.
  if (VRC.boot) VRC.boot.register('route')

}()


!function () { 'use strict'; var FILE = 'js/vrc-scene.js'
  /* ------------------------------------------------------------------------ */
  /* Displays the A-Frame (or legacy) carousel, after assets have preloaded   */
  /* ------------------------------------------------------------------------ */


  //// SETUP AND VALIDATION
  var VRC = (window.VRC = window.VRC || {})
  var fail = function (msg, n) {(w80a || alert)(FILE + '#' + n + '\n  ' + msg)}
  if (VRC.scene) return fail('`VRC.scene` already exists', 2044)


  //// PUBLIC API
  var scene = window.VRC.scene = {

    //// Standard event handlers.
    on: {
      loaded: {
        sniff:  [ addStyle, addCarousel ]
       ,config:   addCarousel
      }
     ,ready: {
        head:     addStyle
       ,body:     addCarousel
       ,aframe:   addCarousel
       ,jquery: [ addStyle, addCarousel ]
       ,parse:    addCarousel
       ,preload:  addCarousel
      }
     ,app: {}
     ,fail: null
    }

    //// jQuery refs used in both 3D/VR and legacy scenes.
   ,$style:    null
   ,$wrap:     null // created by VRC.preload
   ,$main:     null // created by VRC.preload
   ,$assets:   null // created by VRC.preload
   ,$textures: null // created by VRC.preload
   ,$carousel: null // when created, `$carousel` signifies VRC.scene is ready

    //// jQuery refs only used in a 3D/VR scene.
   ,$camera:   null
   ,$fuse:     null
   ,$sky:      null

  } // window.VRC.scene


  //// CSS
  addStyle()
  function addStyle () { var FN = '`addStyle()` '
    if (scene.$style) return // already added
    if (! VRC.boot || ! VRC.boot.head) return // <HEAD> not ready
    if (! VRC.jquery || ! VRC.jquery.version) return // jQuery not ready
    if (! VRC.sniff) return // VRC.legacy is not available yet

    //// Generate the CSS.
    scene.$style = $(
      [
        '<style type="text/css">'
       ,'/* ' + FILE + ' ' + FN + '*/'
       ,'.vrc-section {'
       ,'  display: none!important;'
       ,'}'
       ,'</style>'
      ].join('\n')
    ).appendTo('head')

  }


  //// HTML
  addCarousel()
  function addCarousel () { var FN = '`addCarousel()` '
    if (scene.$carousel) return // already added
    if (! VRC.boot || ! VRC.boot.body) return // <BODY> not ready
    if (! VRC.config) return // selector not available yet
    if (! VRC.jquery || ! VRC.jquery.version) return // jQuery not ready
    if (! VRC.sniff) return // VRC.legacy not available yet
    if (! VRC.parse || ! VRC.parse.sections.length) return // content not parsed
    if (! VRC.preload || ! VRC.preload.allLoaded) return // preload not complete

    if (VRC.legacy.aframe || VRC.config.scene.alwaysLegacy)
      addLegacyCarousel()
    else
      addAframeCarousel()

    //// Log, and tell each component that the scene is ready.
    VRC.boot.log.unshift('scene ready')
    for (var nm in VRC)
      if (VRC[nm] && VRC[nm].on && VRC[nm].on.ready && VRC[nm].on.ready.scene)
        run( VRC[nm].on.ready.scene )
  }


  //// Called by `addCarousel()` to display sections as a 2D carousel.
  function addLegacyCarousel () { var FN = '`addLegacyCarousel()` '

    scene.$carousel = $(
      [
        '<div>'
       ,'  <!-- ' + FILE + ' ' + FN + '-->'
       ,'  <h1>Legacy!</h1>'
       ,'</div>'
      ].join('\n')
    ).attr('id', 'vrc-scene-wrap')
     .appendTo('body')

  }


  //// Called by `addCarousel()` to display sections as a 3D/VR carousel.
  function addAframeCarousel () { var FN = '`addAframeCarousel()` '
    if (! VRC.aframe || ! VRC.aframe.version) return // A-Frame not ready
    var html, isFileProtocol = 'file:' === window.location.protocol

    //   '<div>'
    //  ,'  <!-- ' + FILE + ' ' + FN + '-->'
    //  ,'  <a-scene id="vrc-scene" vr-mode-ui="enabled:true">'
    //  ,'    <a-entity id="vrc-floor"'
    //  ,'              event-set__1="_event: mouseenter;"'
    //  ,'              event-set__2="_event: mouseleave;"'
    //  ,'              geometry="primitive:circle; radius:3;"'
    //  ,'              position="0 0 0" rotation="-90 0 0"'
    //  ,'              material="color:#4A403C">'
    //  ,'    </a-entity><!-- #vrc-floor -->'
    //  ,'    <a-entity id="vrc-plane" class="vrc-visible-fs3d vrc-visible-fsvr"'
    //  ,'              on-enter-semi3d-click'
    //  ,'              visible="false"'
    //  ,'              event-set__1="_event: mouseenter;"'
    //  ,'              event-set__2="_event: mouseleave;"'
    //  ,'              event-set__3="_event: click;"'
    //  ,'              geometry="primitive:plane; width:0.9; height:0.15;"'
    //  ,'              position="1 0.5 3.5" rotation="0 0 0"'
    //  ,'              material="color:#4A403C">'
    //  ,'    </a-entity><!-- #vrc-plane -->'
    //  ,'    <a-entity id="vrc-headline" class="vrc-visible-fs3d vrc-visible-fsvr"'
    //  ,'              billboard'
    //  ,'              visible="false"'
    //  ,'              event-set__1="_event: mouseenter;"'
    //  ,'              event-set__2="_event: mouseleave;"'
    //  ,'              event-set__3="_event: click;"'
    //  ,'              geometry="primitive:plane; width:1; height:0.25;"'
    //  ,'              position="0 1.2 3.5" rotation="0 0 0"'
    //  ,'              material="color:#4A403C">'
    //  ,'    </a-entity><!-- #vrc-plane -->'
    //  ,'    <a-sky color="#333444"></a-sky>'
    // ]
        // $('<a-entity class="' + name + '" collada-model="#' + name + '"></a-entity>')
        //  .appendTo('#vrc-scene')

    html = [
      '<a-entity id="vrc-scene-carousel">'
    ]
    for (var i=0, section; section=VRC.parse.sections[i]; i++) {
      html.push(
        '  <a-entity id="vrc-dae-' + i + '" class="vrc-dae"'
       ,'     on-shape-click'
       ,'     event-set__1="_event: mouseenter;"'
       ,'     event-set__2="_event: mouseleave;"'
       ,'     event-set__3="_event: click;"'
       ,'     rotation="0 ' + (i / VRC.parse.sections.length * 360) + ' 0"'
       ,'     scale="0.4 0.4 0.4">'
       ,'    <a-entity'
       ,'       position="0 0.1 -3" rotation="-90 0 0"'
       ,'       geometry="primitive:circle; radius:0.5;"'
       ,'       material="color:' + section.color + '; shader:flat">'
       ,'    </a-entity>'
       ,'    <a-entity'
       ,'       collada-model="' +
         (isFileProtocol ? 'url(' + section.dae + ')' : '#vrc-model-' + i) + '"'
       ,'       position="0 2 -5">'
       ,'    </a-entity>'
       ,'  </a-entity>'
       ,'  <!-- #vrc-dae-' + i + ' ' + FILE + ' ' + FN + ' -->'
      )
    }
    html.push(
      '</a-entity>'
     ,'<!-- #vrc-scene-carousel ' + FILE + ' ' + FN + ' -->'
    )
    scene.$carousel = $( html.join('\n') )
     .appendTo(scene.$main)

  }


  //// UTILITY
  function run (fns) {
    if ('function' === typeof fns) return fns()
    for (var i=0,fn; fn=fns[i]; i++) fn()
  }

  //// Based on gist.github.com/mathewbyrne/1280286 @todo continue this?
  function slugify (text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
  }

  //// Let VRC.boot know that this component has loaded.
  if (VRC.boot) VRC.boot.register('scene')

}()


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
