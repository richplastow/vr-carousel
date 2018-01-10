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

    //// Called by the 'load' event of each <IMG> in legacy mode.
   ,onRenderLoad: function (event) { var FN = '`onRenderLoad()` '
      preload.register(event.target.id)
    }

    //// Called by the 'loaded' event of each <A-ASSET-ITEM>, or if we’re in
    //// 'file:' protocol, each <A-ASSET>.
   ,onModelLoad: function (event) { var FN = '`onModelLoad()` '
      preload.register(event.target.id)
    }

    //// Called by the 'load' event of each <IMG> in <A-ASSETS>.
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
    if (! VRC.parse
     || ! VRC.parse.header
     || ! VRC.parse.sections.length
    ) return // content not parsed

    if (VRC.legacy.aframe) // see `VRC.config.sniff.alwaysLegacy`
      loadLegacyAssets()
    else
      loadAframeAssets()
  }


  //// Called by `loadAssets()` to preload JPGs for an old-school 2D carousel.
  function loadLegacyAssets () { var FN = '`loadLegacyAssets()` '
    preload.loadedSoFar = 0 // signifies `loadAframe/LegacyAssets()` has run

    VRC.scene.$wrap = $([
        '<div id="vrc-scene-wrap">'
       ,'</div>'
       ,'<!-- #vrc-scene-wrap ' + FILE + ' ' + FN + ' -->'
      ].join('\n')
    ).appendTo('body')

    VRC.scene.$renders = $(
      '<div id="vrc-scene-renders" style="visibility:hidden"></div>\n'
     +'<!-- #vrc-scene-renders ' + FILE + ' ' + FN + ' -->'
    ).appendTo(VRC.scene.$wrap)

    //// Preload the header’s logo image.
    var headerAsset = {
      name:   'vrc-render-0'
     ,src:    VRC.parse.header.render
     ,status: 'preload'
     ,$el:    null
    }
    preload.assets.push( preload.ast['vrc-render-0'] = headerAsset )
    headerAsset.$el = $('<img>')
      .attr('id', 'vrc-render-0')
      .appendTo(VRC.scene.$renders)
      .attr('src', VRC.parse.header.render)
    headerAsset.$el[0].onload = preload.onRenderLoad
    // headerAsset.$el[0].onerror = preload.onRenderError //@todo
    // headerAsset.$el[0].onabort = preload.onRenderAbort //@todo

    //// Preload section renders for a legacy scene.
    for (var i=1,name,src,asset,section; section=VRC.parse.sections[i]; i++) {
      name = 'vrc-render-' + i
      src = section.render
      asset = { name:name, src:src, status:'preload', $el:null }
      preload.assets.push( preload.ast[name] = asset )
      asset.$el = $('<img>')
        .attr('id', name)
        .appendTo(VRC.scene.$renders)
        .attr('src', src)
      asset.$el[0].onload = preload.onRenderLoad
      // asset.$el[0].onerror = preload.onRenderError //@todo
      // asset.$el[0].onabort = preload.onRenderAbort //@todo
    }

    waitTimer = setTimeout(giveUp, maxLoadWait)
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
        // .on('error', preload.onModelError) //@todo
        // .on('abort', preload.onModelAbort) //@todo
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
        // .on('error', preload.onTextureLoad) //@todo
        // .on('abort', preload.onTextureLoad) //@todo
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
       ,'   geometry="primitive:ring; radiusInner:0.015; radiusOuter:0.025;'
        + ' segmentsTheta:16"'
       ,'   visible="false"'
       ,'   material="color:#000; shader:flat">'
       ,'  <!-- <a-animation begin="click" easing="ease-in" attribute="scale"'
       ,'     fill="backwards" from="0.2 0.2 0.2" to="1 1 1"></a-animation>'
       ,'  <a-animation begin="cursor-fusing" easing="ease-in" attribute="scale"'
       ,'     fill="forwards" from="1 1 1" to="0.2 0.2 0.2"></a-animation> -->'
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
      if ('loaded' !== asset.status)
        preloads.push(asset.name + ' (' + asset.src + ')')
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
