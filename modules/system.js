const Module = require('./module.js')
const Audio = require('./audio.js')
var Config = require('./config.js')
const { execSync } = require('child_process');
const fs = require('fs')
const os = require("os");

class System extends Module 
{

  constructor(hplayer3)
  {
    super('system', hplayer3)

    // LOAD CONFIG
    this.config = new Config(hplayer3)

    // AUDIO
    this.audio = new Audio(hplayer3)
    this.audio.configure( this.config )

    // APPLY CONFIG
    this.setVideorotate( this.config.get('videorotate') )
    this.setVideoflip( this.config.get('videoflip') )

  }


  reboot(){
    this.log('rebooting...')
    execSync('reboot')
  }


  restartkiosk(){

    // Restart Kiosk (if already running)
    try {
      execSync('systemctl is-active --quiet kiosk')
      execSync('systemctl restart kiosk')
    }
    catch (error) {
      //this.log(error.status)
    }

  }


  gitpull(){
    this.log('git pull...')
    execSync('git pull')
    setTimeout(function(){process.exit()}, 1000)
  }


  getConf(){
    return this.config._config
  }

  getVideorotate(){
    return this.config.get('videorotate')
  }

  setVideorotate(degree){
    degree = degree % 360
    if (degree%90 == 0) {

      try {
        let currentMode = String(execSync("sed -n -e '/^ROTATE/p' /boot/kiosk.conf")).trim().split('=')[1]
        let newMode = currentMode

        if (degree == 0 && currentMode.includes('rotate-')) {
          if (currentMode.startsWith('flipped')) newMode = 'flipped'
          else newMode = 'normal'
        }
        else if (degree != 0 && !currentMode.includes('rotate-'+degree)) {
          if (currentMode.startsWith('flipped')) newMode = 'flipped-rotate-'+degree
          else newMode = 'rotate-'+degree
        }

        if (newMode != currentMode)
        {
          execSync("rw")
          execSync("sed -i 's/ROTATE=.*/ROTATE="+newMode+"/g' /boot/kiosk.conf")
          execSync("ro")

          this.config.set('videorotate', degree)
          this.log('rotating video', degree)

          this.restartkiosk()
        }

      }
      catch(err) {
        this.log('error when rotating video', err)
      }

    }
    else this.log('video rotation not allowed (0|90|180|270)')
  }

  getVideoflip(){
    return this.config.get('videoflip')
  }

  setVideoflip(doFlip){

    try {
      let currentMode = String(execSync("sed -n -e '/^ROTATE/p' /boot/kiosk.conf")).trim().split('=')[1]
      let newMode = currentMode

      if (doFlip && !currentMode.startsWith('flipped')) {
        if (currentMode == 'normal') newMode = 'flipped'
        else newMode = 'flipped-'+currentMode
      }
      else if (!doFlip && currentMode.startsWith('flipped')) {
        if (currentMode == 'flipped') newMode = 'normal'
        else newMode = currentMode.split('flipped-')[1]
      }

      if (newMode != currentMode)
      {
        execSync("rw")
        execSync("sed -i 's/ROTATE=.*/ROTATE="+newMode+"/g' /boot/kiosk.conf")
        execSync("ro")

        this.config.set('videoflip', doFlip)
        if (doFlip) this.log('flipping video')
        else this.log('unflipping video')

        this.restartkiosk()
      }

    }
    catch(err) {
      this.log('error when flipping video')
    }

  }

  getTheme(theme){
    return this.config.get('theme')
  }

  setTheme(theme){
    this.config.set('theme', theme)
    this.restartkiosk()
  }


}


module.exports = System
