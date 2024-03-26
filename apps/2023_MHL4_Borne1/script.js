
// /media subdirectory
var mediaSubfolder = ""

var fadeTime = 200;

$(function(){

  /// HPLAYER3 ///
  var hplayer3 = new HPlayer3({divlogger:false, controls:true})

  ///////// ON-SCREEN LOGGER /////////////
  // hplayer3.logger.toggle(true)

  /// VIDEO PLAYER ///
  var player = hplayer3.videoPlayer( "#page_video", { closer: 'touch', scrollbar: true })
  player.on('stopped', () => $("#page_video").fadeOut(300))

  // /// DISABLE ZOOM ///
  hplayer3.disableZoom()

  /// ENABLE SWIPE EVENTS ///
  hplayer3.swiper()

  // /// GO HOME WHEN INACTIVE ///
  hplayer3.inactivity( 60, ()=> {
    // location.reload()
    closePages()
    player.stop()
  })

  /// PAGES ///
  $('.page').hide()
  $('#page_home').show()

  
  /// BUILD GRIDS ///
  ///
  $("div[type='mediagrid']").each((i, page) => {

    // Folder from id
    let folder = $(page).attr('id')

    // Clear destination
    $(page).empty()

    // Close BTN
    $('<div class="closeBtn">').appendTo(page)

    // Fill Grid
    mediaGrid(hplayer3, page, folder)
      .then((grid) => {

        // onCLICK => PLAY VIDEO
        grid.find('.item-video').on('click', function ()
        {
          $("#page_video").fadeIn(0)
          player.play('/media/'+folder+'/'+$(this).data("media"))
        })

      })

  })

  /// BUILD GALLERY ///
  ///
  $("div[type='gallery']").each((i, page) => {
    // Folder from id
    let folder = $(page).attr('id')
    
    // Clear destination (page must be visible while constructing flickity carrousel)
    $(page).empty().show()  

    // Fill Galleries
    carrouselFolder(hplayer3, page, folder, {wrapAround: false})
    .then((carrousel) => {
        // hide page once carrousel is ready
        $(page).hide()  

        // flickity close button (rewind) becomes our closeBtn
        carrousel.find('.carrousel-close-button').on('click', closePages)
      })
  })


  /// ACTIONS ///
  ///
  $('.folder_icon').click(function()
  {

    // VIDEO: PLAY
    var video = $(this).attr("video")
    if (video) {
      $("#page_video").fadeIn(0)
      player.play('/media/'+video+'.mp4')
    }

    // DEST: SHOW PAGE
    var dest = $(this).attr("dest")
    if (dest) {
      $('#page_home').fadeOut(0)
      $("#"+dest).fadeIn(fadeTime)
    }

  })

  /// CLOSE ///
  function closePages() {
    player.stop()
    $(".page").hide()
    $('#page_home').fadeIn(fadeTime)
  }
  
  $('.closeBtn').click( closePages )


});
