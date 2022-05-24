
// /media subdirectory
var mediaSubfolder = ""

$(function() {

  var fadeTime = 200
  $('.page').hide()
  setTimeout(function(){
    $('#page_browser').show().css('visibility','hidden')
    setImageRatio()
    $('#page_browser').hide().css('visibility','visible').fadeIn(200)
  },200)

  // OPEN
  $('.item').click(function(){
    var media = $(this).attr('media')
    console.log(media)
    launchVideo('media/'+media)
  })

  function launchVideo(media){
    // PAGE
    $('.page').fadeOut(fadeTime)
    $('#page_video').fadeIn(fadeTime)
    // PLAY
    $('#videoplayer')[0].setAttribute('src', media)
    $('#videoplayer')[0].currentTime = 0
    $("#videoplayer")[0].play()
    //SCROLLBAR INTERVAL
    scrollBarUpdate = setInterval(function(){
      var currentTime = $('#videoplayer')[0].currentTime
      var videoDuration = $("#videoplayer")[0].duration
      var percent = currentTime*100/videoDuration
      $('.scrollbar_left').css('width', percent+'%')
      $('.scrollbar_tick').css('margin-left', percent+'%')
      $('.scrollbar_time').text(secondsToTime(currentTime))
      // if no 'ended' event
      // if ((videoDuration-currentTime < 0.05 && !$("#videoplayer")[0].paused)){ stopVideo() }
    }, 20)
  }

  // END || CLOSE
  $('#videoplayer').on('ended',function(){
    stopVideo()
  });
  $('.closer, #videoplayer').click(function(){
    stopVideo()
  });

  function stopVideo(){
    clearInterval(scrollBarUpdate)
    $("#videoplayer")[0].pause()
    // PAGE
    $('.page').fadeOut(fadeTime)
    $('#page_browser').fadeIn(fadeTime)
  }

  // SCROLLBAR TOUCH
  $('.scrollbar_container').click(function(e){
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
  function secondsToTime(secs){
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



  var allFiles = new Array()
  var allVideos = new Array()

  //////////////// HPLAYER3 ////////////////

  var hplayer3 = new HPlayer3({controls:true})

  hplayer3.media.getTree(mediaSubfolder)
      .catch( error => console.warn(error) )
      .then( data => {
          // console.log(data)
          allFiles = data.fileTree
          $('#page_browser .grid').empty()
          allFiles.forEach((item, i) => {
            if(item.type=='video') allVideos.push(new video(item))
          });
        })

  
  //////////////// PLAYER ////////////////
  hplayer3.registerPlayer( "#videoplayer", "player")


  //////////////// VIDEO ////////////////
  function video(item){

    var thisItem = item
    var that = this
    this.preview = $('<div class="item" media="'+thisItem.name+'"></div>').appendTo($("#page_browser .grid"))
    // setImageRatio()

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
    this.preview.click(function(){
      launchVideo('/media/'+mediaSubfolder+'/'+thisItem.name)
    })


  }






























});
