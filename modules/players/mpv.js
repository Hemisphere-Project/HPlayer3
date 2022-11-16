const Baseplayer = require('./baseplayer.js')
const isPi = require('detect-rpi');
const mpvAPI = require('node-mpv');

const glob = require('glob');



class Mpv extends Baseplayer {

    constructor(hp3) {
        super('mpv', hp3)
        this.requires('config')
        this.requires('gpio')
        this.player = null
        this.manualStop = false
    }

    init() 
    {    
        this.log('starting')

        // CONFIG
        //
        this.getConf('mpv.videorotate', 0)
        this.getConf('mpv.videoflip', false)


        // Start MPV now
        if (this.getConf('player.type') == 'mpv')
          this.startProcess()

        // Restart on audio output change
        this.on('config.audio.output', (out)=>{
            this.restartProcess()
        })

        // Restart on player type change
        this.on('config.player.type', (out)=>{
            this.restartProcess()
        })
    }

    async startProcess() {
      if (this.getConf('player.type') != 'mpv') {
        this.stopProcess()
        return
      }

      // if (this.player) await this.player.quit()
    
      this.player = new mpvAPI({
          "audio_only": false,
          "auto_restart": true,
          "binary": null,
          "debug": false,
          "time_update": 1,
          "verbose": false,
      },
      [
        "--fullscreen",
      ])

      // EVENTS
      this.player.on('started', () => {
        this.emit('playing')
      })
      this.player.on('stopped', () => {
        if (!this.manualStop)
          this.emit('ended')
        this.emit('stopped')
        this.manualStop = false
      })

      await this.player.start()
      this.emit('started')
    }

    async stopProcess() {
      if (this.player) await this.player.quit()
      this.player = null
    }

    async restartProcess() {
      await this.startProcess()
    }
    
    getVideorotate(){
        return this.getConf('mpv.videorotate')
    }

    setVideorotate(degree){
        this.log("Can't set video rotation on this player...")
    }

    getVideoflip() {
        return this.getConf('mpv.videoflip')
    }
    
    setVideoflip(doFlip)
    {
        this.log("Can't set video flip on this player...")
    }

    ///////////// PLAYER COMMANDS /////////////

    async play(url) {

      if (!url.startsWith('/')) 
        url = this.hp3.files.media.path + '/' + url

      console.log('PLAY', url)
      var files = glob.sync(url)

      if (files.length > 0) {
        try {
          if (this.player) await this.player.load(files[0])
        }
        catch (e) {
          this.log('Error playing ' + url, e)
        }
      }
      else {
        this.log('No file found: ' + url)
      }      
    }

    async pause() {
      if (this.player) await this.player.pause()
    }

    async resume() {
      if (this.player) await this.player.resume()
    }

    async stop() {
      this.manualStop = true
      if (this.player) await this.player.stop()
    }

    async seek(seconds) {
      if (this.player) await this.player.seek(seconds)
    }

    async volume(vol) {
      if (this.player) await this.player.volume(vol)
    }

    async mute() {
      if (this.player) await this.player.mute()
    }

    async unmute() {
      if (this.player) await this.player.unmute()
    }

    async toggleMute() {
      if (this.player) await this.player.toggleMute()
    }

    async setLoop(loop) {
      if (this.player) await this.player.setLoop(loop)
    }

    async setSpeed(speed) {
      if (this.player) await this.player.setSpeed(speed)
    }

    async setProperty(prop, value) {
      if (this.player) await this.player.setProperty(prop, value)
    }

    async getProperty(prop) {
      if (this.player) await this.player.getProperty(prop)
    }

    async getDuration() {
      if (this.player) await this.player.getDuration()
    }

    async getTimePosition() {
      if (this.player) await this.player.getTimePosition()
    }

    async getVolume() {
      if (this.player) await this.player.getVolume()
    }

    async getMute() {
      if (this.player) await this.player.getMute()
    }

    async getLoop() {
      if (this.player) await this.player.getLoop()
    }

    async getSpeed() {
      if (this.player) await this.player.getSpeed()
    }

}

module.exports = Mpv