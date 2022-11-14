
// /media subdirectory
var mediaSubfolder = ""

$(function(){

  /// HPLAYER3 ///
  var hplayer3 = new HPlayer3({divlogger:false, controls:true})

  ///////// ON-SCREEN LOGGER /////////////
  // hplayer3.logger.toggle(true)
  
  // /// DISABLE ZOOM ///
  hplayer3.disableZoom()

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
        carrousel.find('.closeDiv')
          .on('click', () => {
            $(page).hide()
            $('#page_home').show()
          })

        // hide page
        $(page).hide()
      })   

  })

  /// ACTIONS ///
  $('.folder_icon').click(function(){
    var dest = $(this).attr("dest")

    // SHOW PAGE
    $('#page_home').hide()
    $("#"+dest).show()

    // REWIND GALLERY
    $("#"+dest).find('.carrousel').flickity('select', 0)

    if(dest=="page_vitrine"){
      loadVitrine()
    }
  })

  // VITRINE
  function loadVitrine(){
    $('.uppertitle').hide()
    $('.cartel_content').hide()
    $('.element').removeClass('selected')
  }

  // VITRINE SELECTOR
  $('.element').click(function(){
    // titles
    $('.introtitle').hide()
    $('.uppertitle').show()
    // colors
    $('.element').removeClass('selected')
    $(this).addClass('selected')
    // content
    var dest = $(this).attr('dest')
    $('.cartel_content').hide()
    $('#'+dest).show()
  })

});
