$(function()
{

  // HOME
  $('.page').hide()
  $('#page_home').fadeIn(0)
  $('#page_home').click(function(){
    $(this).fadeOut(0)
    $('#page_selection').fadeIn(0)
  })

  // KEYWORD
  $('.keyword').click(function(){
    $(this).siblings().removeClass('selected')
    $(this).toggleClass('selected')
    if($('.selected').length == 4){
      $('#title').hide()
      $('#title_go').show()
    } else{
      $('#title_go').hide()
      $('#title').show()
    }
  })

  // QR CODE
  var qrcode = new QRCode(document.getElementById("qrcode"), {
    text: "",
    width: 150,
    height: 150,
    colorDark : "#382353",
    colorLight : "#FCEACA"
  })

  // GO
  $('#title_go').click(function(){
    var textID = ''
    $('.selected').each(function(index,div){
      textID += $(div).attr('id')
    })
    loadPersonnage(textID)
  })

  // GO DIRECTLY IF HASH
  if(window.location.hash!=''){
    loadPersonnage(window.location.hash.split('#')[1])
  }

  function loadPersonnage(textID){
    // PHRASE
    $('.phrase_displayed').each(function(index,div){
      var phrase = $('#phrase_'+textID.charAt(index)).html()
      var phraseNum = index+1
      $('#phrase'+phraseNum).html(phrase)
    })
    // TITRE
    var title = $('#'+textID+'_titre').html()
    $('#phrase_main').html(title)
    // TEXT
    var text = $('#'+textID+'_text').html()
    $('#text_displayed').html(text)
    // GENRE
    var genre = $('#'+textID+'_titre').attr('genre')
    $('#profil_pic').attr('src', 'assets/img/profil_'+genre+'.png')
    // QR CODE
    qrcode.clear()
    qrcode.makeCode("https://www.gadagne-lyon.fr/sites/gadagne/files/medias/images/2022-11/"+textID+".png")
    // URL
    window.location.hash = textID
    // SHOW PAGE
    $('#page_home').hide()
    $('#page_selection').fadeOut(0)
    $('#page_text').css('visibility', 'visible').fadeIn(0)
  }

  // RESTART
  $('#restart').click(function(){
    $('#page_text').fadeOut(0)
    $('#title_go').hide()
    $('#title').show()
    $('#page_selection').fadeIn(0)
    $('.keyword').each(function(){
      $(this).removeClass('selected')
    })
    window.location.hash = ''
  })

  // IDLE
  var inactivityTime = function() {

      var timerInactivity

      $('body').click(function(){ timerReset() })
      document.ontouchstart = timerReset
      window.onload = timerReset;
      document.onkeypress = timerReset;
      document.onmousedown = timerReset;
      document.ontouchstart = timerReset;
      document.onclick = timerReset;
      document.onscroll = timerReset;

      function timerElapsed() {
        location.reload()
      }
      function timerReset() {
        var idleTime = 9000
        clearTimeout(timerInactivity)
        timerInactivity = setTimeout(timerElapsed, idleTime)
      }
  }
  inactivityTime()





});
