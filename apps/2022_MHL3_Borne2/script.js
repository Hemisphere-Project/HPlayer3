
// /media subdirectory
var mediaSubfolder = ""

$(function(){

  /// HPLAYER3 ///
  var hplayer3 = new HPlayer3({divlogger:false, controls:true})

  ///////// ON-SCREEN LOGGER /////////////
  // hplayer3.logger.toggle(true)

  /// DISABLE ZOOM ///
  hplayer3.disableZoom()

  /// ENABLE SWIPE EVENTS ///
  hplayer3.swiper()

  // /// GO HOME WHEN INACTIVE ///
  hplayer3.inactivity( 60, ()=> 
  {
    // location.reload()
    if ($('#page_home').is(':visible')) return   // already on home page
    
    closePages()
    $(('.carrousel-close-button')).click()  // rewind carrousel
  })

  /// PAGES ///
  $('.page').hide()
  $('#page_home').show()

  /// BUILD SLIDESHOW ///
  $("div[type='gallery']").each((i, page) => {

    // Folder from id
    let folder = $(page).attr('id')

    // Clear destination
    $(page).empty().show()

    // Fill Galleries
    carrouselFolder(hplayer3, page, folder)
      .then((carrousel) =>
      {
        // supercharge close btn to close page
        carrousel.find('.carrousel-close-button').click( closePages )
        $(page).hide()
      })

  })

  /// ACTIONS ///
  $('.folder_icon').click(function(){
    var dest = $(this).attr("dest")

    // SHOW PAGE
    $('#page_home').fadeOut(400)
    $("#"+dest).fadeIn(450)

    // REWIND GALLERY (triggers video play if first slide is video)
    $("#"+dest).find('.carrousel').flickity('select', 0)

    if(dest=="page_vitrine"){
      loadVitrine()
    }
  })

  /// CLOSE ///
  function closePages() {
    $(".page").hide()
    $('#page_home').fadeIn(400)
  }
  
  $('.closeBtn').click( closePages )

  // VITRINE
  function loadVitrine(){
    $('.introtitle').show()
    $('.uppertitle').hide()
    $('.introtitle').show()
    $('.cartel_content').hide()
    $('.element').removeClass('selected')
  }

  // VITRINE SELECTOR
  $('.element').click(function(){
    // titles
    $('.introtitle').hide()
    $('.uppertitle').fadeIn(200)
    // colors
    $('.element').removeClass('selected')
    $(this).addClass('selected')
    // content
    var dest = $(this).attr('dest')
    $('.cartel_content').hide()
    $('#'+dest).fadeIn(300)
  })

});



                                