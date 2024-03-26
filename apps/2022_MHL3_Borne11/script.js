
// /media subdirectory
var mediaSubfolder = ""

$(function(){

  /// HPLAYER3 ///
  var hplayer3 = new HPlayer3({divlogger:false, controls:true})
  
  /// DISABLE ZOOM ///
  hplayer3.disableZoom()

  /// GO HOME WHEN INACTIVE ///
  hplayer3.inactivity( 60, ()=> {
    // location.reload()
    closePages()
    player.stop()
  })

  /// PAGES ///
  $('.page').hide()
  $('#page_home').show()

  /// VIDEO PLAYER ///
  var player = hplayer3.videoPlayer( "#page_video", { closer: 'touch', scrollbar: false })
  player.on('stopped', () => $("#page_video").fadeOut(0) )

  /// BUILD GRIDS ///
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
          $("#page_video").fadeIn(500)
          player.play('/media/'+folder+'/'+$(this).data("media"))
        })

      })

  })

  /// ACTIONS ///
  $('.folder_icon').click(function(){
    var dest = $(this).attr("dest")

    $('#page_home').fadeOut(0)
    $("#"+dest).fadeIn(0)
  })

  /// CLOSE ///
  function closePages() {
    player.stop()
    $(".page").hide()
    $('#page_home').fadeIn(0)
  }
  
  $('.closeBtn').click( closePages )


});
