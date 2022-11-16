
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
  hplayer3.inactivity( 60, ()=> {
    // $('.closeDiv').trigger('click')
    location.reload()
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
        // supercharge close btn
        carrousel.find('.carrousel-close-button')
          .on('click', () => {
            $(page).hide()
            $('#page_home').fadeIn(400)
          })

        // hide page
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

  // VITRINE
  function loadVitrine(){
    $('.introtitle').show()
    $('.uppertitle').hide()
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



                                