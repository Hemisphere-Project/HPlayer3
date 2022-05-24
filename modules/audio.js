
const Module = require('./module.js')
const os = require("os");
const isPi = require('detect-rpi');
const { execSync } = require('child_process');

class Audio extends Module{

    constructor(hplayer3) {
        super('audio', hplayer3)
        if (isPi()) return new AudioPI(hplayer3)
    }

    configure(config) {
        this.config = config
        this.setOutput( this.config.get('audioout') )
        this.setVolume( this.config.get('audiovolume') )
    }

    listOuputs() {
        return ['system']
    }

    getOutput() {
        if (!this.listOuputs().includes(this.config.get('audioout'))) 
            this.setOutput( this.listOuputs()[0] )  // Check if current config is valid

        return this.config.get('audioout')
    }

    setOutput(out){
        if (!this.listOuputs().includes(out)) out = this.listOuputs()[0] // Check if new out is valid
        if (this.config.get('audioout') == out) return out             
        this.log("Can't set audio out on this machine...")
        this.config.set( 'audioout', out )
        return this.getOutput()
    }

    getVolume() {
        return 0
    }
    
    setVolume(vol) {
        if (vol > 100) vol = 100
        if (vol < 0) vol = 0
        if (vol == this.getVolume()) return vol
        this.log("Can't set audio volume on this machine...")
        vol = this.getVolume()
        this.config.set('audiovolume', vol)
        return vol
    }

    getMute() {
        return false
    }
    
    setMute(doMute) {
        this.log("Can't set audio mute on this machine...")
        doMute = this.getMute()
        this.config.set('audiomute', doMute)
        return doMute
    }
}


class AudioPI extends Audio {

    listOuputs() {
        return ['jack', 'hdmi0', 'hdmi1']
    }

    setOutput(out){
        if (out == 'hdmi') out = 'hdmi0'
        if (!this.listOuputs().includes(out)) out = this.listOuputs()[0] // Check if new out is valid

        try {
            let currentOut = String(execSync("sed -n -e '/^pcm.!default/p' /etc/asound.conf")).trim().split(' ')[1]     // get current mode
            if (out != currentOut) {
                execSync("rw")
                execSync("sed -i 's/pcm.!default .*/pcm.!default "+out+"/g' /etc/asound.conf")
                execSync("sed -i 's/ctl.!default .*/ctl.!default "+out+"/g' /etc/asound.conf")
                execSync("ro")
                // TODO: check if asound.conf is properly initialized

                this.config.set('audioout', out)
                this.log('switching output to ', out)
                this.hp3.system.restartkiosk()
            }
        }
        catch(err) {
            this.log('error when selecting audio out')
            this.log(err)
        }

        return this.getOutput()
    }

    getVolume() {
        var vol = 0
        if (this.getOutput() == 'jack') vol = parseInt(execSync(`amixer -c0 get 'Headphone',0  |grep % |awk '{print $4}'|sed 's/[^0-9]//g'`).toString())
        return vol
    } 
    
    setVolume(vol) {
        if (vol > 100) vol = 100
        if (vol < 0) vol = 0
        
        if (this.getOutput() == 'jack') execSync(`amixer -c0 set 'Headphone',0 ${vol}%`)

        vol = this.getVolume()
        this.log('set volume', vol)
        this.config.set('audiovolume', vol)
        return vol
    }
}

module.exports = Audio

