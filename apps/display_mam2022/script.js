
// /media subdirectory
var mediaSubfolder = ""
var timeClick = 0

$(function() 
{
  var allFiles  = new Array()
  var allVideos = new Array()

  //////////////// PLAYER ////////////////
  var player = new VideoPlayer("#videoplayer")

  //////////////// HPLAYER3 ////////////////
  var hplayer3 = new HPlayer3({divlogger:true, controls:true})

  ////////////// QUERY ITEMS /////////////
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

  ////////////// BUILD ITEM ////////////////
  function videoitem(item)
  {
    this.item = item
    this.preview = $('<div class="item" media="'+this.item.name+'"></div>').appendTo($("#page_browser .grid"))

    // THUMBNAIL
    this.thumb = $('<div class="image_wrapper"><img class="thumb" src="assets/img/not_found.png"></div>').appendTo(this.preview)
    allFiles.forEach((file, i) => {
      if((file.raw_name==this.item.raw_name)&&(file.type=='image')) 
      {
        let img = this.thumb.find('img')
        img.on('load', ()=>{ img.css('height', img.width()*0.5625) })   // Image RATIO
        img.attr('src', '/media/'+mediaSubfolder+'/'+file.name)         // Image SRC
      }
    });

    // DESCRIPTION
    this.desc = $('<div class="infos">'+this.item.name+'</div>').appendTo(this.preview)
    const textExist = allFiles.some(file => ((file.raw_name === this.item.raw_name)&&(file.type === 'text')) );
    if (textExist) {
      $.get('/media/'+mediaSubfolder+'/'+this.item.raw_name +'.txt', (txt) => {
        this.desc.empty()
        this.desc.append(txt)
      }, 'text')
    }

    // onCLICK => PLAY VIDEO
    this.preview.on('click', () => 
    {
      timeClick = Date.now()
      player.play('/media/'+mediaSubfolder+'/'+this.item.name)
      // $('#page_video').stop( true, true ).fadeIn(700)
      $('#page_video').removeClass('fadeout').addClass('fadein')
    })
  }


  ///////// ON-SCREEN LOGGER /////////////
  // hplayer3.logger.toggle(true)


  //////////////// PAGES /////////////////
  // $('.pages').hide()
  // $('#page_black').show()
  // $('#page_browser').show()
  $('#page_video').addClass('fadeout')

  ///// WAVESHARE SCREEN WORKAROUND /////
  // During the 8 secs following the first user action, touch events are ignored & then triggered after 8 secs
  // --> User action will be triggered by the FIRST LAUNCH FIX, 
  //     waveShareTouchFix will enforce 8s delay before homepage display
  var waveShareTouchFix = true

  
  ////////////// LAGGY FIRST LAUNCH FIX //////
  setTimeout(()=>
  {
    console.log('Kiosk starting...')
    
    // Simulate user click on first item
    $('.item')[0].click()

    // Once video is playing, simulate click to exit
    player.on('playing', ()=>{$('#videoplayer').click()}, {once:true})
    
    // Display homepage
    player.on('stop',  ()=>{
      setTimeout(()=>{ $('#page_black').hide() }, waveShareTouchFix ? 8000:0)
    }, {once:true})
  }
  ,500) 


  // onPLAY: 
  // --> cancel fadein as soon as video is playing (prevent flickering if video starts before fadein is done)
  // --> start scrollbar
  player.on('playing', ()=>{
    $('#page_video').stop( true, true )
    scrollbarStart()
    console.warn('Delta click-playing:', Date.now()-timeClick)
  })

  // onCLICK => STOP
  $('.closer, #videoplayer').on('click', () => {
    player.stop()
  });

  // onSTOP => CLOSE
  // --> stop scrollbar
  // --> close page_video
  player.on('stop', () => 
  {
    scrollbarStop()
    // $('#page_video').stop( true, true ).fadeOut(500)
    $('#page_video').removeClass('fadein').addClass('fadeout')
  });


  // SCROLLBAR
  //
  var scrollBarUpdate;

  // SCROLLBAR START
  function scrollbarStart() 
  {
    scrollbarStop()
    scrollBarUpdate = setInterval(function(){
      var currentTime = player.video.currentTime
      var videoDuration = player.video.duration
      var percent = currentTime*100/videoDuration
      $('.scrollbar_left').css('width', percent+'%')
      $('.scrollbar_tick').css('margin-left', percent+'%')
      $('.scrollbar_time').text(secondsToTime(currentTime))
    }, 20)
  }

  // SCROLLBAR STOP
  function scrollbarStop() {
    clearInterval(scrollBarUpdate)
  }

  // SCROLLBAR TOUCH
  $('.scrollbar_container').click( (e) => 
  {
    // %
    var percent = ( (e.pageX - $(this).offset().left) / $(this).width() ) * 100
    
    // PLAYER
    player.video.currentTime = percent * player.video.duration / 100
    if(player.video.paused) playVideo()

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



  






























});
