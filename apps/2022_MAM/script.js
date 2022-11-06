
// /media subdirectory
var mediaSubfolder = ""

$(function() 
{
  //////////////// HPLAYER3 ////////////////
  var hplayer3 = new HPlayer3({divlogger:true, controls:true})
  
  //////////////// PLAYER ////////////////
  var player = hplayer3.videoPlayer( "#page_video", { closer: false, scrollbar: false })

  player.on('playing', () => {
      $("#page_video").removeClass('fadeout').removeClass('fadein')
  })

  player.on('stop', () => {
      $("#page_video").removeClass('fadein').addClass('fadeout')
  })

  //////////////// MEDIA GRID ////////////////
  mediaGrid(hplayer3, "#page_grid", { folder: mediaSubfolder, types: ['video'] })
            .then((grid) => {

              // onCLICK => PLAY VIDEO
              grid.find('.item-video').on('click', function ()
              {
                $("#page_video").removeClass('fadeout').addClass('fadein')
                player.play('/media/'+mediaSubfolder+'/'+$(this).data("media"))
              })

            })


  ///////// ON-SCREEN LOGGER /////////////
  // hplayer3.logger.toggle(true)


  ///// WAVESHARE SCREEN WORKAROUND /////
  // During the 8 secs following the first user action, touch events are ignored & then triggered after 8 secs
  // --> User action will be triggered by the FIRST LAUNCH FIX, 
  //     waveShareTouchFix (ms) will enforce delay before homepage display
  var waveShareTouchFix = 500

  
  ////////////// LAGGY FIRST LAUNCH FIX //////
  if (waveShareTouchFix > 0) 
  {
    $('#page_black').show()
    setTimeout(()=>
    {
      console.log('Kiosk starting...')
      
      // Simulate user click on first item
      $('.item-video')[0].click()

      // artificially trigger touch event
      function simTouch(){ player.videoEl.click() }

      // Once video is playing, simulate click to exit
      player.on('playing', simTouch, {once:true})
      
      // Display homepage
      player.on('stop',  ()=>{
        player.off('playing', simTouch)
        setTimeout(()=>{ $('#page_black').hide() }, waveShareTouchFix )
      }, {once:true})
    }
    ,500) 
  }
  else $('#page_black').hide()









  






























});
