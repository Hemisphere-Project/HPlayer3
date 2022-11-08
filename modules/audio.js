
const Module = require('./module.js')
const os = require("os");
const isPi = require('detect-rpi');
const { execSync } = require('child_process');

class Audio extends Module{

    constructor(hp3) {
        super('audio', hp3)
        this.requires('config')
    }

    init() {
        this.setOutput( this.getConf('audio.output') )
        this.setVolume( this.getConf('audio.volume') )   
    }

    listOuputs() {
        return ['system']
    }

    getOutput() {
        if (!this.listOuputs().includes(this.getConf('audio.output'))) 
            this.setOutput( this.listOuputs()[0] )  // Check if current config is valid

        return this.getConf('audio.output')
    }

    setOutput(out){
        if (!this.listOuputs().includes(out)) out = this.listOuputs()[0] // Check if new out is valid
        if (this.getConf('audio.output') == out) return out             
        this.log("Can't set audio out on this machine...")
        this.setConf( 'audio.output', out )
        return this.getOutput()
    }

    getVolume() {
        return 100
    }
    
    setVolume(vol) {
        if (vol > 100) vol = 100
        if (vol < 0) vol = 0
        if (vol == this.getVolume()) return vol
        vol = this.getVolume()
        this.setConf('audio.volume', vol)
        this.log("Can't set audio volume on this machine...")
        this.emit('volume', vol)
        return vol
    }

    getMute() {
        return false
    }
    
    setMute(doMute) {
        this.log("Can't set audio mute on this machine...")
        doMute = this.getMute()
        this.setConf('audiomute', doMute)
        return doMute
    }
}


class AudioPI extends Audio {

    init() {
        this.jackCard = parseInt(String(execSync(`aplay -l | grep Headphone | awk '{print $2}' `)).substring(0, 1))
        super.init()
    }

    listOuputs() {
        return ['jack', 'hdmi0', 'hdmi1']
    }

    setOutput(out){
        if (out == 'hdmi') out = 'hdmi0'
        if (!this.listOuputs().includes(out)) out = this.listOuputs()[0] // Check if new out is valid
        try {
            let currentOut = String(execSync("cat /etc/asound.conf | grep pcm.\!default")).trim().split(' ')[1]     // get current mode
            if (out != currentOut) {
                execSync("rw")
                execSync("sed -i 's/pcm.!default .*/pcm.!default "+out+"/g' /etc/asound.conf")
                execSync("sed -i 's/ctl.!default .*/ctl.!default "+out+"/g' /etc/asound.conf")
                execSync("ro")
                // TODO: check if asound.conf is properly initialized

                this.setConf('audio.output', out)
                this.log('switching output to ', out)

                // re-apply volume
                this.setVolume( this.getConf('audio.volume') )

                // emit audiout change
                this.emit('output', out)
            }
            else this.setConf('audio.output', out)
        }
        catch(err) {
            this.log('error when selecting audio out')
            this.log(err)
        }

        return this.getOutput()
    }

    getVolume() {
        var vol = 100
        if (this.getOutput() == 'jack') {
            this.log('get jack volume')
            vol = execSync(`amixer -c`+String(this.jackCard)+` get 'Headphone',0  |grep % |awk '{print $4}'`).toString()
            vol = parseInt(vol.substring(1, vol.length-3))
            this.log('volume is', vol)
        }
        return vol
    } 
    
    setVolume(vol) {
        if (vol > 100) vol = 100
        if (vol < 0) vol = 0
        
        if (this.getOutput() == 'jack')
            execSync(`amixer -c`+String(this.jackCard)+` set 'Headphone',0 ${vol}%`)

        vol = this.getVolume()
        this.setConf('audio.volume', vol)
        this.log('set volume', vol)
        this.emit('volume', vol)
        return vol
    }
}


module.exports = Audio
if (isPi()) module.exports = AudioPI
