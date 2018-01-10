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
    on: {
      loaded: {
      }
     ,ready: {
        body:   initRoute
       ,jquery: initRoute
       ,parse:  initRoute
       ,scene:  initRoute
      }
     ,app: {}
     ,fail: null
    }

   ,baseTitle: document.title //@todo check that this is available at this point, in all UAs

    //// Hnady jQuery references.
   ,$previous: null
   ,$next:     null

    //// Objects containing a hash-string, and a reference to a section.
   ,old:       null
   ,current:   null

  }


  //// INITIALISE
  initRoute()
  function initRoute () { var FN = '`initRoute()` '
    if (route.current) return // already initialised
    if (! VRC.boot || ! VRC.boot.body) return // <BODY> not ready
    if (! VRC.jquery || ! VRC.jquery.version) return // jQuery not ready
    if (! VRC.parse || ! VRC.parse.sections.length) return // content not parsed
    console.log('here', VRC.scene);
    if (! VRC.scene) return // scene not ready @todo  || ! VRC.scene.$carousel or $wrap
    console.log('there');

    //// Prevent the browser’s default behavior when the hash changes, where it
    //// scrolls to the section with that ID.
    ////@todo look into using `event.preventDefault()` instead
    VRC.parse.$sections.each( function () {
      this.id = 'vrc-route-' + this.id
    })

    //// Get handy jQuery references.
    route.$previous = $('#vrc-previous')
    route.$next     = $('#vrc-next')

    //// Listen for the hash-change event.
    $(window).on('hashchange', onHashchange) //@todo legacy browsers

    //// Trigger `onHashchange()` to initialise the view.
    onHashchange()
  }


  //// Deal with a change to `window.location.hash`.
  function onHashchange (event) { var FN = '`onHashchange()` '

    //// If the hash hasn’t changed, do nothing.
    var hash = (window.location.hash || '#').substr(1) // get normalised hash
    if (! hash) hash = VRC.parse.sections[0].id // use first section if no hash
    if (route.current && route.current.hash === hash) return

    //// Get a reference to the new section. @todo allow a 404 page
    var section = VRC.parse.ids[hash];
    if (! section) return window.location.hash = VRC.parse.sections[0].id

    //// Record the old route, and create a new route-object.
    route.old = route.current
    route.current = {
      hash:    hash
     ,section: section
    }

    //// Update section classes.
    VRC.parse.$sections.removeClass('vrc-current vrc-old')
    if (route.old) route.old.section.$el.addClass('vrc-old')
    section.$el.addClass('vrc-current')

    //// Update the page title.
    document.title = route.baseTitle + ' - ' + section.title;

    //// Update previous and next buttons.
    route.$previous.attr('href', '#' + section.previous.id);
    route.$next.attr('href', '#' + section.next.id);

    //// For a legacy carousel, update the page background.
    if (VRC.legacy.aframe) // see `VRC.config.sniff.alwaysLegacy`
      VRC.scene.$wrap.css('background-image', 'url(' + section.render + ')')

  }


  //// Let VRC.boot know that this component has loaded.
  if (VRC.boot) VRC.boot.register('route')

}()
