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
        config: [ parseHeader, parseSections ]
      }
     ,ready: {
        body:   [ parseHeader, parseSections ]
       ,jquery: [ parseHeader, parseSections ]
      }
     ,app: {}
     ,fail: null
    }

    //// Parsed header.
   ,header: null // filled by `parseHeader()`

    //// Parsed sections.
   ,sections:  []   // filled by `parseSections()`
   ,ids:       {}   // keys are paths for VRC.route, values are items in `sections`
   ,$sections: null // jQuery ref to the list of all sections
   ,first:     null
   ,last:      null

  } // window.VRC.parse


  //// Try to parse the <DIV id="vrc-header"> element.
  parseHeader();
  function parseHeader () { var FN = '`parseHeader()` '
    if (parse.header) return // already added
    if (! VRC.boot || ! VRC.boot.body) return // <BODY> not ready
    if (! VRC.config) return // rx selectors not available yet
    if (! VRC.jquery || ! VRC.jquery.version) return // jQuery not ready

    var selector = VRC.config.parse.selector

    //// Get a jQuery reference to the header.
    var $header = $(selector.header)
    if (! $header.length) return fail(FN +
      "Nothing matches $('" + selector.header + "')", 4481)

    //// The header must have a logo to render.
    var $render = $(selector.render, $header)
    if (1 !== $render.length) return fail(FN + "Section #" + i +
      " has " + $render.length + " renders, not 1", 1374)
    var render = $render.attr('data-vrc-render')
    if (! render) return fail(FN + "The header " + selector.header +
      " has a render element with no 'data-vrc-render' attribute", 7119)

    //// Record the header.
    parse.header = { // signifies success
      render:  render
     ,$el:     $header
     ,$render: $render
    }

    //// Tell each component that parsing is complete. The next stage will be to
    //// preload collada models and audio (or JPGs if A-Frame is not supported).
    VRC.boot.log.unshift('parsed header')
    if (parse.sections.length)
      for (var nm in VRC)
        if (VRC[nm] && VRC[nm].on && VRC[nm].on.ready && VRC[nm].on.ready.parse)
          run( VRC[nm].on.ready.parse )
  }


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

      //// Record the section.
      section = {
        index:    i
       ,title:    title
       ,id:       id
       ,dae:      dae
       ,texture:  texture // can be undefined
       ,color:    color
       ,render:   render
       ,$el:      $section
       ,$render:  $render
       ,previous: null
       ,next:     null
      }
      sections.push(section)
      ids[id] = section
    }

    //// Record handy references to the 'first' and 'last' sections.
    parse.first = sections[0]
    parse.last  = sections[ sections.length - 1 ]

    //// Fill in 'previous' and 'next' cross-references.
    for (var i=0,section; section=sections[i]; i++) {
      if (0 === i)
        section.previous = parse.last
      else
        section.previous = sections[i-1]

      if (sections.length-1 === i)
        section.next = parse.first
      else
        section.next = sections[i+1]
    }


    //// No fails, so record the sections, which signifies success.
    parse.sections = sections
    parse.ids = ids

    //// Tell each component that parsing is complete. The next stage will be to
    //// preload collada models and audio (or JPGs if A-Frame is not supported).
    VRC.boot.log.unshift('parsed ' + parse.sections.length + ' sections')
    if (parse.header)
      for (var nm in VRC)
        if (VRC[nm] && VRC[nm].on && VRC[nm].on.ready && VRC[nm].on.ready.parse)
          run( VRC[nm].on.ready.parse )

  } // `parseSections()`


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
