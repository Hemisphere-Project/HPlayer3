
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

  /// VIDEO PLAYER ///
  var player = hplayer3.videoPlayer( "#page_video", { closer: 'touch', scrollbar: false })
  player.on('stop', () => $("#page_video").fadeOut(300) )

  /// BUILD GRIDS ///
  $("div[type='mediagrid']").each((i, div) => {

    // Folder from id
    let folder = $(div).attr('id')
    
    // Clear destination
    $(div).empty()

    // Fill Grid
    mediaGrid(hplayer3, div, folder)
      .then((grid) => {

        // onCLICK => PLAY VIDEO
        grid.find('.item-video').on('click', function ()
        {
          $("#page_video").fadeIn(500)
          player.play('/media/'+folder+'/'+$(this).data("media"))
        })

      })

    // add Close Btn
    $('<div class="closeDiv">').appendTo(div)
      .on('click', function () {
        $(this).parent().fadeOut(300)
        $('#page_home').show()
      })

  })

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
  })

});
