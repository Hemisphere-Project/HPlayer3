
// /media subdirectory
var mediaSubfolder = ""

$(function(){

  /// HPLAYER3 ///
  var hplayer3 = new HPlayer3({divlogger:false, controls:true})

  ///////// ON-SCREEN LOGGER /////////////
  // hplayer3.logger.toggle(true)

  // /// DISABLE ZOOM ///
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


  /// ACTIONS ///
  $('.folder_icon').click(function(){
    var dest = $(this).attr("dest")

    // SHOW PAGE
    $('#page_home').hide()
    $("#"+dest).show()

    // REWIND GALLERY
    $("#"+dest).find('.carrousel').flickity('select', 0)

    if(dest=="page_devenirs"){
      $('.feuille').hide()
      sheet = 1
      showFeuille(sheet)
    }
  })

  //////////////////////////////////////////////
  // PAGE DEVENIRS D'USINES
  //////////////////////////////////////////////

  $('.closeDiv').on('click', function () {
    $(this).parent().fadeOut(300)
    $('#page_home').show()
  })

  var sheet
  var interval

  $('.next').click(() => {
    sheet ++
    showFeuille()
  })
  $('.prev').click(() => {
    sheet --
    showFeuille()
  })

  document.addEventListener('swipeleft', () => $('.next').click())
  document.addEventListener('swiperight', () => $('.prev').click())

  function showFeuille(){

    if(sheet>12){ sheet=1 }
    else if(sheet==0){ sheet=12 }
    $('.feuille.visible').removeClass('visible').hide()
    $('#feuille'+sheet).addClass('visible').show()

    $('.after').fadeOut(0)
    $('.before').fadeIn(0)
    clearInterval(interval)

    interval = setInterval(function(){
      console.log('GO')
      if($('#feuille'+sheet+' img.after').is(':visible')){
       $('#feuille'+sheet+' img.after').fadeOut(500)
       $('#feuille'+sheet+' img.before').fadeIn(500)
      }else{
        $('#feuille'+sheet+' img.before').fadeOut(500)
        $('#feuille'+sheet+' img.after').fadeIn(500)
      }
    }, 3000);
  }

});
