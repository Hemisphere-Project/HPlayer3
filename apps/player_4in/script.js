
let videos = {}

$(function() 
{
  //////////////// HPLAYER3 ////////////////
  var hplayer3 = new HPlayer3({divlogger:false, controls:true})
  
  //////////////// PLAYER ////////////////
  var player = hplayer3.videoPlayer( "#page_video", { closer: false, scrollbar: false })

  
  //////////////// MEDIA ////////////////
  // Get media list
  hplayer3.files.media.getTree()
  .catch( error => {
      console.warn(error) 
      reject(error)
  })
  .then( data => { 
    data.fileTree.filter((item) => (item.type === 'video' || item.type === 'audio'))
      .forEach((item) => {
        var t = item.name.split('_')
        if (t.length > 1) videos['T'+t[0]] = item.path
      })

      if (videos.hasOwnProperty('T0')) player.play('/media'+videos['T0'])
  })

  //////////////// BTNS ////////////////
  //
  hplayer3.gpio.setInput('T1')
  hplayer3.gpio.setInput('T2') 
  hplayer3.gpio.setInput('T3')
  hplayer3.gpio.setInput('T4')

  hplayer3.on('gpio.state', (pinName, value) => 
  {
    console.log('GPIO', pinName, value)
    if (value && videos.hasOwnProperty(pinName)) player.play('/media'+videos[pinName])
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
    if (videos.hasOwnProperty('T0')) player.play('/media'+videos['T0'])
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
