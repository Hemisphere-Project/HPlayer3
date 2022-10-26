


$(function()
{

  // HOME
  $('#page_home').fadeIn(200)
  $('#page_home').click(function(){
    $(this).fadeOut(200)
    $('#page_selection').fadeIn(200)
  })

  // KEYWORD
  $('.keyword').click(function(){

    $(this).siblings().removeClass('selected')
    $(this).toggleClass('selected')

    if($('.selected').length == 4){
      $('#go').fadeIn(200)
    } else{
      $('#go').fadeOut(200)
    }
  })

  // GO
  $('#go').click(function(){

    var textId = ''
    $('.selected').each(function(index,div){
      textId += $(div).attr('id')+'-'
    })

    $('#page_selection').fadeOut(200)
    $('#page_text').fadeIn(200)
    $('#'+textId).fadeIn(200)

  })

  // RESTART
  $('#restart').click(function(){
    $('#page_text, .text').fadeOut(200)
    $('#go').hide()
    $('#page_selection').fadeIn(200)
    $('.keyword').each(function(){
      $(this).removeClass('selected')
    })
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
        var idleTime = 30000
        clearTimeout(timerInactivity)
        timerInactivity = setTimeout(timerElapsed, idleTime)
      }
  }
  inactivityTime()












});
