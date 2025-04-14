
let videos = {}

$(function() 
{
  //////////////// HPLAYER3 ////////////////
  var hplayer3 = new HPlayer3({divlogger:false, controls:true})
  
  //////////////// PLAYER ////////////////
  var player = hplayer3.videoPlayer( "#page_video", { closer: false, scrollbar: false })

  
  //////////////// MEDIA ////////////////
  playlist = []
  standbylist = []
  playlistIndex = 0
  standbyIndex = 0
  playState = false

  // Get media list
  hplayer3.files.media.getTree()
  .catch( error => {
      console.warn(error) 
      reject(error)
  })
  .then( data => { 
    console.log('media tree', data.fileTree)
    data.fileTree.filter((item) => (item.type === 'video' || item.type === 'audio'))
      .forEach((item) => {
        if (item.name.startsWith('0_')) standbylist.push(item.path)
        else playlist.push(item.path)
      })

    console.log('playlist', playlist)
    console.log('standbylist', standbylist)

      player.stop()
      playState = false
      if (standbylist.length > 0) {
        player.play('/media'+standbylist[0])
      }
  })

  //////////////// PLAY ////////////////
  function playList(index) {
    if (index == undefined) index = 0
    if (playlist.length > 0) {
      playlistIndex = (index+playlist.length) % playlist.length
      player.play('/media'+playlist[playlistIndex])
      playState = true
    }
    else playStandby(0)
  }

  function playStandby(index) {
    if (index == undefined) index = 0
    if (standbylist.length > 0) {
      standbyIndex = (index+standbylist.length) % standbylist.length
      player.play('/media'+standbylist[standbyIndex])
    }
    else player.stop()
    playState = false
  }

  //////////////// BTNS ////////////////
  //
  hplayer3.gpio.setInput('T1')
  hplayer3.gpio.setInput('T2') 
  hplayer3.gpio.setInput('T3')

  hplayer3.on('gpio.state', (pinName, value) => 
  {
    console.log('GPIO', pinName, value)
    if (!value) return

    // T1 - PLAY LIST
    if (pinName == 'T1') 
      playList(0)
    
    // T2 - NEXT
    else if (pinName == 'T2') 
      playList(playlistIndex+1)
    
    // T3 - STOP / STANDBY
    else if (pinName == 'T3') 
      playStandby(0)

  })

  // FAKE GPIO ON INTERFACE
  $('.gpio').on('click', function() {
    var id = $(this).attr('id')
    hplayer3.emit('gpio.state', id, true)
    setTimeout(() => {
      hplayer3.emit('gpio.state', id, false)
    }, 200)
  })

  //////////////// STANDBY VIDEO ////////////////
  //
  player.on('ended', () => {
    if (playState) playList(playlistIndex+1)
    else playStandby(standbyIndex+1)
  })

  ////////////// SHOW CONTROLS ON ctrl-c ///////////
  $(document).on('keydown', function(e) {
    if (e.ctrlKey && e.key == 'c') {
      console.log('CTRL-C')
      $('#controls').toggle()
    }
  })


  ///////// ON-SCREEN LOGGER /////////////
  // hplayer3.logger.toggle(true)
  // setInterval(() => {
  //   console.log('log OK')
  //   console.warn('warn OK')
  //   console.error('err OK')
  // }, 2000) 










  






























});
