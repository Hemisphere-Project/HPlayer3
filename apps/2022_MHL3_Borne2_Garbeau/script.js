
// /media subdirectory
var mediaSubfolder = ""

$(function(){

  $('.page').hide()
  $('#page_home').show()

  // GO TO
  $('.folder_icon').click(function(){
    var dest = $(this).attr("dest")

    $('#page_home').fadeOut(200)
    $("#"+dest).fadeIn(200)

    if(dest=="page_vitrine"){
      loadVitrine()
    }


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
      $('#'+dest).fadeIn(50)
    })

  })




















});
