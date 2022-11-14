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
