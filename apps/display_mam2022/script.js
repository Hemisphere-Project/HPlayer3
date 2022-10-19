
// /media subdirectory
var mediaSubfolder = ""

$(function() 
{
  var displayState = 'off'
  var allFiles = new Array()
  var allVideos = new Array()

  //////////////// HPLAYER3 ////////////////

  var hplayer3 = new HPlayer3({divlogger:true, controls:true})

  hplayer3.files.media.getTree(mediaSubfolder)
      .catch( error => console.warn(error) )
      .then( data => {
          // console.log(data)
          allFiles = data.fileTree
          $('#page_browser .grid').empty()
          allFiles.forEach((item, i) => {
            if(item.type=='video') allVideos.push(new videoitem(item))
          });
        })


  //////////////// PLAYER ////////////////
  var player = hplayer3.registerPlayer( "#videoplayer", "player")


  //////////////// VIDEO ////////////////
  function videoitem(item){

    var thisItem = item
    var that = this
    this.preview = $('<div class="item" media="'+thisItem.name+'"></div>').appendTo($("#page_browser .grid"))

    // THUMBNAIL
    this.thumb = $('<div class="image_wrapper"><img class="thumb" src="assets/img/not_found.png"></div>').appendTo(this.preview)
    allFiles.forEach((item, i) => {
      if((item.raw_name==thisItem.raw_name)&&(item.type=='image')) {
        that.thumb.find('img').attr('src', '/media/'+mediaSubfolder+'/'+item.name)
      }
    });

    // DESCRIPTION
    this.desc = $('<div class="infos">'+thisItem.name+'</div>').appendTo(this.preview)
    const textExist = allFiles.some(item => ((item.raw_name === thisItem.raw_name)&&(item.type === 'text')) );
    if (textExist) {
      $.get('/media/'+mediaSubfolder+'/'+thisItem.raw_name +'.txt', function(txt) {
        that.desc.empty()
        that.desc.append(txt)
      }, 'text')
    }

    // GO
    this.preview.click(() =>
    {
      if (displayState != 'browser') return; // browser is not fully loaded.. ignore play
      launchVideo('/media/'+mediaSubfolder+'/'+thisItem.name)
    })
  }


  //////////////// LOGGER ////////////////
  // hplayer3.logger.toggle(true)


  //////////////// IMAGE RATIO ///////////
  $('.pages').hide()
  setTimeout(function(){
    // $('#page_browser').show().css('visibility','hidden')
    setImageRatio()
    // $('#page_browser').hide().css('visibility','visible').fadeIn(200)
    // $('#page_browser').hide().css('visibility','visible') // don't show, make the waveshare workaround
  },300)

  ///// WAVESHARE SCREEN WORKAROUND /////
  // // During the 8 secs following the first user action, touch events are ignored & then triggered after 8 secs
  // // --> Simulate a first one, wait 8sec & show
  // setTimeout(function(){
  //   $('#page_browser').css('visibility','hidden')
  //   $('.item')[0].click()
  //   $('#videoplayer').click()
  //   log('Kiosk starting...')
  // },500)
  // setTimeout(function(){
    $('#page_browser').css('visibility','visible').fadeIn(200, ()=>{ displayState = 'browser' })
  //   clearLogs()
  // },8000)

  // OPEN
  // $('.item').click(function(){
  //   var media = $(this).attr('media')
  //   console.log(media)
  //   launchVideo('media/'+media)
  // })

  function launchVideo(media)
  {
    // PLAY
    player.play(media)

    // SHOW VIDEO PAGE 
    $('#page_video').fadeIn(900)
  
    // SCROLLBAR INTERVAL
    scrollBarUpdate = setInterval(function(){
      var currentTime = $('#videoplayer')[0].currentTime
      var videoDuration = $("#videoplayer")[0].duration
      var percent = currentTime*100/videoDuration
      $('.scrollbar_left').css('width', percent+'%')
      $('.scrollbar_tick').css('margin-left', percent+'%')
      $('.scrollbar_time').text(secondsToTime(currentTime))
      // if no 'ended' event
      // if ((videoDuration-currentTime < 0.05 && !$("#videoplayer")[0].paused)){ closeVideo() }
    }, 20)
  }

  // SHOW Video
  $("#videoplayer")[0].addEventListener('playing', () => {
    displayState = 'player'
  }, false);

  // END || CLOSE
  $('#videoplayer').on('ended',function(){
    closeVideo()
  });
  $('.closer, #videoplayer').click(function()
  {
    if (displayState != 'player') return; // video is not fully loaded.. ignore stop
    closeVideo()
  });

  function closeVideo()
  {
    // STOP PLAYER
    player.stop()

    // STOP SCROLLBAR
    clearInterval(scrollBarUpdate)

    // HIDE VIDEO PAGE 
    $('#page_video').fadeOut(500, ()=>{ displayState = 'browser' })
  }

  // SCROLLBAR TOUCH
  $('.scrollbar_container').click( (e) => 
  {
    if($("#videoplayer")[0].paused) playVideo()
    var offset = $(this).offset()
    var relX = e.pageX - offset.left
    var percent = ( relX / $(this).width() )*100
    var videoDuration = $("#videoplayer")[0].duration
    var time2Seek=percent*videoDuration/100
    $('#videoplayer')[0].currentTime = time2Seek
    // CSS
    $('.scrollbar_left').css('width', percent+'%')
    $('.scrollbar_tick').css('margin-left', percent+'%')
    $('.replay').hide()
  })

  // UTILS
  function secondsToTime(secs)
  {
    var minutes = Math.floor(secs / 60)
    var seconds = Math.floor(secs - minutes * 60)
    var x = minutes < 10 ? "0" + minutes : minutes
    var y = seconds < 10 ? "0" + seconds : seconds
    return x + ":" + y
  }

  // IMAGE RATIO
  function setImageRatio(){
    var w = $('.image_wrapper').width()
    var h = w*0.5625
    $('.image_wrapper').css('height', h)
  }



  






























});
