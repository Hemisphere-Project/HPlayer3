
const Module = require('./module.js')
const os = require("os");

class Gpio extends Module{

    constructor(hp3) {
        super('gpio', hp3)
        this.requires('config')
    }

    init() {
        this.log("Can't set GPIO on this machine...")
    }

    setInput(Tnum, callback, pullUpDown)
    {
        this.log('setInput = Not implemented', Tnum, callback, pullUpDown)
    }

    setOutput(Tnum, state)
    {
        this.log('setOutput = Not implemented', Tnum, state)
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
            "T4": 19,
        }

        this.gpio = {}
        
        // LOAD HCONNECTOR SCENARIO 
        const path = this.getConf('path.conf')+'/hconnector.js'
        try {
            const Hcon = require(path)
            Hcon(this.hp3)
            this.log(path+' loaded')
        } catch (e) {
            this.log('ERROR loading '+path+'..', e)
        }

        // Bind external GPIO events
        this.hp3.events.on('gpio.setInput', (pin, callback, pullUpDown) => {
            this.setInput(pin, callback, pullUpDown)
        })
        this.hp3.events.on('gpio.setOutput', (pin, state) => {
            this.setOutput(pin, state)
        })

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

        this.gpio[Tnum] = new this.PIGPIO(pin, { mode: this.PIGPIO.INPUT, pullUpDown: pullUpDown, alert: true })
        this.gpio[Tnum].glitchFilter(10000)
        this.gpio[Tnum].on('alert', (level, tick) => 
        {
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
        this.log('GPIO', Tnum, 'input', pullUpDown)
    }

    setOutput(Tnum, state) 
    {
        let pin = Tnum
        if (Tnum in this.pinout) pin = this.pinout[Tnum]

        if (!Number.isInteger(pin)) {
            this.log('setOutput = Invalid pin number: '+pin)
            return
        }

        if (!this.gpio[Tnum]) this.gpio[Tnum] = new this.PIGPIO(pin, { mode: this.PIGPIO.OUTPUT })
        this.gpio[Tnum].digitalWrite(state)
        this.log('GPIO', Tnum, 'output', state)
    }

}


module.exports = Gpio
if (Module.isPi()) module.exports = GpioPI
