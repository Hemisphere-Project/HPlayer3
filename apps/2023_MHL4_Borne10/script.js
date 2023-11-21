
// /media subdirectory
var mediaSubfolder = ""
var fadeTime = 200

$(function(){

  /// HPLAYER3 ///
  var hplayer3 = new HPlayer3({divlogger:false, controls:true})

  ///////// ON-SCREEN LOGGER /////////////
  // hplayer3.logger.toggle(true)

  // /// DISABLE ZOOM ///
  hplayer3.disableZoom()

  /// ENABLE SWIPE EVENTS ///
  hplayer3.swiper(100)

  // /// GO HOME WHEN INACTIVE ///
  hplayer3.inactivity( 60, ()=> {
    // location.reload()
    closePages()
  })

  /// PAGES ///
  $('.page').hide()
  $('#page_home').show()

  /// ACTIONS ///
  $('.folder_icon').click(function(){
    var dest = $(this).attr("dest")

    // SHOW PAGE
    $('#page_home').fadeOut(0)
    $("#"+dest).fadeIn(fadeTime)
    if(dest=="page_galerie"){ loadGalerie() }
  })

  /// CLOSE ///
  function closePages() {
    $(".page").hide()
    $("#page_portraits").hide()
    $('.displayed').removeClass('displayed').hide()
    $('#page_home').fadeIn(fadeTime)
  }
  $('.back,.closeBtn').click( closePages )

  $('.closePortrait').click(function(){
    $("#page_portraits").fadeOut(fadeTime)
    $('.displayed').removeClass('displayed').fadeOut(fadeTime)

  })


  //////////////////////////////////////////////
  // PAGE GALERIE DE PORTRAITS
  //////////////////////////////////////////////

  function loadGalerie(){
    // Flickity
    var options = {
      cellAlign: 'left',
      pageDots: false,
      contain: true,
      selectedAttraction: 0.2,
      draggable: true,
      lazyLoad: 2,
      freeScroll: true,
      freeScrollFriction: 0.1,
      wrapAround: true
  }
    let carouselDiv = $('.carousel')
    var carouselFlickity = carouselDiv.flickity(options);

    carouselFlickity.on( 'staticClick.flickity', function( event, pointer, cellElement, cellIndex ) {
      loadItem($(cellElement).attr('href'))
    });
  }

  function loadItem(id){
    $("#page_portraits").fadeIn(fadeTime)
    $("#"+id).addClass('displayed').fadeIn(fadeTime)
    activePortrait = id
  }

  //////////////////////////////////////////////
  // PAGE PORTRAITS
  //////////////////////////////////////////////

  $('.next').click(() => {
    showPortrait(1)
  })
  $('.prev').click(() => {
    showPortrait(-1)
  })

  document.addEventListener('swipeleft', () => $('.next').click())
  document.addEventListener('swiperight', () => $('.prev').click())

  function showPortrait(increment){
    var list =   $('.portrait')
    var index =  list.index($('.displayed'))
    var target = (index + increment) % list.length; 
    $('.portrait.displayed').removeClass('displayed').hide()
    list.eq(target).addClass('displayed').fadeIn(fadeTime)

  }





});
