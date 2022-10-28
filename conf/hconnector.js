const Gpio = require('pigpio').Gpio;

function HConnector(hplayer3) {
  // PINOUT
  // T1: 05
  // T2: 06
  // T3: 13
  this.T1 = new Gpio(05, { mode: Gpio.INPUT, pullUpDown: Gpio.PUD_UP, alert: true })
  this.T2 = new Gpio(06, { mode: Gpio.INPUT, pullUpDown: Gpio.PUD_UP, alert: true })
  this.T3 = new Gpio(13, { mode: Gpio.INPUT, pullUpDown: Gpio.PUD_UP, alert: true })

  // debounce 10ms (in microseconds)
  this.T1.glitchFilter(10000)
  this.T2.glitchFilter(10000)
  this.T3.glitchFilter(10000)

  // EVENTS
  this.T1.on('alert', (level, tick) => {
    console.log('T1 ' + level)
    if (level == 0) {
      // hplayer3.playFile('01_')
      hplayer3.log('PLAY FILE 01')
    }
  })
  this.T2.on('alert', (level, tick) => {
    console.log('T2 ' + level)
    if (level == 0) {
      hplayer3.log('PLAY FILE 02')
    }
  })
  this.T3.on('alert', (level, tick) => {
    console.log('T3 ' + level)
    if (level == 0) {
      hplayer3.log('PLAY FILE 03')
    }
  })

}

module.exports = HConnector
