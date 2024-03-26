// PINOUT = "T1": 5, "T2": 6, "T3": 13, "T4": 19,

// HCONNECTOR v1 => 3x inputs
/*
module.exports = (hp3) => 
{
  function playT(pin, value) {
    if (value) {
      pin = String(pin)
      if (pin.startsWith('T')) pin = pin.slice(1)
    	if (hp3.player) hp3.player.play(pin+"_*")
    }
  }

  hp3.gpio.setInput('T1', playT)
  hp3.gpio.setInput('T2', playT)
  hp3.gpio.setInput('T3', playT)
  
  // START / LOOP
  hp3.on('mpv.ended', () => playT(0,true) )
  hp3.on('mpv.started', () => playT(0,true) )
}
*/

// HCONNECTOR v2 => 2x inputs // 2x outputs
module.exports = (hp3) => 
{
  // Initial state
  hp3.gpio.setOutput('T3', 0)
  hp3.gpio.setOutput('T4', 0)

  // T1 press
  hp3.gpio.setInput('T1', (pin, value) => {
    if (value) hp3.player.play("1_*")	// T1 press play 1_*
    hp3.gpio.setOutput('T3', 1) 		  // T1 press light up T3 
  })
  
  // T2 press
  hp3.gpio.setInput('T2', (pin, value) => {
    if (value) hp3.player.play("2_*") // T2 press play 2_*
    hp3.gpio.setOutput('T4', 1)       // T2 press light up T4
  })
  
  // On media stopped (except 0_*) turn off lights
  hp3.on('kiosk.stopped', (path) => {
    path = path.split('/')[1]
    if (path && path.startsWith('0')) return
    hp3.gpio.setOutput('T3', 0)
    hp3.gpio.setOutput('T4', 0)
  })
}
