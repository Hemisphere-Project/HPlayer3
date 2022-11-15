
// /media subdirectory
var mediaSubfolder = ""

$(function(){

  $('.page').hide()
  $('#page_home').fadeIn(200)

  // GO TO
  $('.folder_icon').click(function(){
    var dest = $(this).attr("dest")
    var type = $(this).attr("type")

    $('#page_home').fadeOut(200)
    $("#"+dest).fadeIn(200)

    console.log(type)
    console.log(dest)

  })


  // IDLE
  var inactivityTime = function() {
      var timerInactivity
      $('body').click(function(){ timerReset() })
      document.ontouchstart = timerReset
      function timerElapsed() {
        location.reload()
      }
      function timerReset() {
        var idleTime = 60000
        clearTimeout(timerInactivity)
        timerInactivity = setTimeout(timerElapsed, idleTime)
      }
  }
  inactivityTime()











});
