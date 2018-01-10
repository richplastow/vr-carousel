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
       ,route:    addCarousel
      }
     ,app: {}
     ,fail: null
    }

    //// jQuery refs used in legacy and 3D/VR scenes.
   ,$style:    null
   ,$wrap:     null // created by VRC.preload
   ,$main:     null // created by VRC.preload
   ,$assets:   null // created by VRC.preload
   ,$textures: null // created by VRC.preload
   ,$carousel: null // when created, `$carousel` signifies VRC.scene is ready

    //// jQuery refs only used in a legacy scene.
   ,$renders:  null // created by VRC.preload

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
       ,'.vrc-section >div {'
       ,'  font-size: 0;'
       ,'  opacity: 0;'
       ,'  transition: opacity 1s;'
       ,'}'
       ,'.vrc-section >div >div {'
       ,'  overflow: hidden;'
       ,'  height: 0;'
       ,'}'
       ,'.vrc-section.vrc-current >div {'
       ,'  font-size: inherit;'
       ,'  opacity: 1;'
       ,'}'
       ,'.vrc-section.vrc-current >div >div {'
       ,'  height: auto;'
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

    if (VRC.legacy.aframe) // see `VRC.config.sniff.alwaysLegacy`
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

    //// Show the header logo.
    VRC.parse.header.$render
     .append('<img src="' + VRC.parse.header.render + '">')


    // scene.$carousel = $(
    //   [
    //     '<div>'
    //    ,'  <!-- ' + FILE + ' ' + FN + '-->'
    //    ,'  <h1>Legacy!</h1>'
    //    ,'</div>'
    //   ].join('\n')
    // ).attr('id', 'vrc-scene-wrap')
    //  .appendTo('body')

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

    //// Show the header logo.
    VRC.parse.header.$render
     .append('<img src="' + VRC.parse.header.render + '">')

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
