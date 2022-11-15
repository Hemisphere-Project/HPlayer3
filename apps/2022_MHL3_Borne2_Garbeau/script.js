
// /media subdirectory
var mediaSubfolder = ""

$(function(){

  $('.page').hide()
  $('#page_home').show()

  $('.folder_icon').click(function(){
    var dest = $(this).attr("dest")

    $('#page_home').fadeOut(200)
    $("#"+dest).fadeIn(200)

  })




















});
