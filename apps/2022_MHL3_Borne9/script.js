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

  /// BUILD GRIDS ///
  $("div[type='gallery']").each((i, page) => {

    // Folder from id
    let folder = $(page).attr('id')
    
    // Clear destination
    $(page).empty().show()

    // Fill Galleries
    carrouselFolder(hplayer3, page, folder)

  })

});
