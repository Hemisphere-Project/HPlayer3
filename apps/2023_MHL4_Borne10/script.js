
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
    if(dest=="page_maires"){ 
      indexMaire = 0
      showMaire() }
  })

  /// CLOSE ///
  function closePages() {
    $(".page").hide()
    $("#page_portraits").hide()
    $('.displayed').removeClass('displayed').hide()
    $('#page_home').fadeIn(fadeTime)
  }
  $('.back,.closeBtn,.closeMaires').click( closePages )

  $('.closePortrait').click(function(){
    $("#page_portraits").fadeOut(fadeTime)
    $('.displayed').removeClass('displayed').fadeOut(fadeTime)
  })


  //////////////////////////////////////////////
  // PAGE GALERIE DE PORTRAITS
  //////////////////////////////////////////////

  var isLoaded = false
  var carouselFlickity

  function loadGalerie(){

    if(!isLoaded){
      isLoaded = true
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
      carouselFlickity = carouselDiv.flickity(options);
      carouselFlickity.on( 'staticClick.flickity', function( event, pointer, cellElement, cellIndex ) {
        if($(cellElement).hasClass('item')) {loadItem($(cellElement).attr('href'))}
      });
    }else{
      carouselFlickity.flickity( 'selectCell', 0, false, true );
    }

  }

  function loadItem(id){
    $("#page_portraits").fadeIn(fadeTime)
    $('.displayed').removeClass('displayed').hide() // sécu
    $("#"+id).addClass('displayed').fadeIn(fadeTime)
  }

  //////////////////////////////////////////////
  // PAGE PORTRAITS
  //////////////////////////////////////////////

  $('#page_portraits .next').click(() => {
    showPortrait(1)
  })
  $('#page_portraits .prev').click(() => {
    showPortrait(-1)
  })

  function showPortrait(increment){
    var list =   $('.portrait')
    var index =  list.index($('.displayed'))
    var target = (index + increment) % list.length; 
    $('.portrait.displayed').removeClass('displayed').hide()
    list.eq(target).addClass('displayed').fadeIn(fadeTime)
  }


  //////////////////////////////////////////////
  // PAGE MAIRES
  //////////////////////////////////////////////

  var indexMaire

  $('#page_maires .next').click(() => {
    indexMaire ++
    showMaire()
  })
  $('#page_maires .prev').click(() => {
    indexMaire --
    showMaire()
  })

  function showMaire(){
    if(indexMaire==0){ $('#page_maires .prev').hide() }
    else{ $('#page_maires .prev').show() }
    if(indexMaire >= $('.maire').length){ closePages() }
    $('.maire.displayed').removeClass('displayed').hide()
    $('.maire').eq(indexMaire).addClass('displayed').fadeIn(fadeTime)
  }



});
