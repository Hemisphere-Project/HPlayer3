
const Module = require('./module.js')
const os = require("os");
const isPi = require('detect-rpi');

class Gpio extends Module{

    constructor(hp3) {
        super('gpio', hp3)
        this.requires('config')
    }

    init() {
        this.log("Can't set GPIO on this machine...")
    }
    
}


class GpioPI extends Gpio {

    init() {
        this.log("Setting up GPIO for Raspberry PI...")
        this.PIGPIO = require('pigpio').Gpio;

        this.pinout = {
            "T1": 5,
            "T2": 6,
            "T3": 13,
        }

        this.gpio = {}
        
        // LOAD HCONNECTOR SCENARIO 
        const path = this.getConf('path.conf')+'/hconnector.js'
        try {
            const Hcon = require(path)
            Hcon(this.hp3)
            this.log(path+' loaded')
        } catch (e) {
            this.log('WARNING: '+path+' not found')
        }
    }

    setInput(Tnum, callback, pullUpDown) 
    {
        let pin = Tnum
        if (Tnum in this.pinout) pin = this.pinout[Tnum]

        if (!Number.isInteger(pin)) {
            this.log('setInput = Invalid pin number: '+pin)
            return
        }

        if (pullUpDown == undefined) pullUpDown = this.PIGPIO.PUD_UP
        else if (pullUpDown == 'down') pullUpDown = this.PIGPIO.PUD_DOWN
        else if (pullUpDown == 'up') pullUpDown = this.PIGPIO.PUD_UP

        this.gpio[Tnum] = new this.PIGPIO(this.pinout[Tnum], { mode: this.PIGPIO.INPUT, pullUpDown: pullUpDown, alert: true })
        this.gpio[Tnum].glitchFilter(10000)
        this.gpio[Tnum].on('alert', (level, tick) => 
        {
            // this.emit('state.'+Tnum, level == 0)
            this.emit('state', Tnum, level == 0)
            if (callback) {
                try {
                    callback(Tnum, level == 0)
                }
                catch (e) {
                    this.log('ERROR in callback', e)
                }
            }
        })
    }

}


module.exports = Gpio
if (isPi()) module.exports = GpioPI
