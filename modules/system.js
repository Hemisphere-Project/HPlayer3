const Module = require('./module.js')
const Audio = require('./audio.js')
const Config = require('./config.js')
const Wifi = require('./wifi.js')
const Webserver = require('./webserver.js')
const Socketio = require('./socketio.js')
const Gpio = require('./gpio.js')
const { execSync } = require('child_process');
const fs = require('fs')
const os = require("os");
const Files = require('./files.js');
const { EventEmitter2 } = require('eventemitter2')
const Kiosk = require('./players/kiosk.js')
const Mpv = require('./players/mpv.js')
var isPi = require('detect-rpi');


class System extends Module
{

  constructor(forcedConf)
  {
    super('system', null, 'greenBright')

    console.log("\x1b[32m", '\n\
    ╭╮╱╭┳━━━┳╮╱╱╭━━━┳╮╱╱╭┳━━━┳━━━╮╭━━━╮\n\
    ┃┃╱┃┃╭━╮┃┃╱╱┃╭━╮┃╰╮╭╯┃╭━━┫╭━╮┃┃╭━╮┃\n\
    ┃╰━╯┃╰━╯┃┃╱╱┃┃╱┃┣╮╰╯╭┫╰━━┫╰━╯┃╰╯╭╯┃\n\
    ┃╭━╮┃╭━━┫┃╱╭┫╰━╯┃╰╮╭╯┃╭━━┫╭╮╭╯╭╮╰╮┃\n\
    ┃┃╱┃┃┃╱╱┃╰━╯┃╭━╮┃╱┃┃╱┃╰━━┫┃┃╰╮┃╰━╯┃\n\
    ╰╯╱╰┻╯╱╱╰━━━┻╯╱╰╯╱╰╯╱╰━━━┻╯╰━╯╰━━━╯\n\
    \n')

    this.log('HPlayer3 starting...')

    // REQUESTS STACK
    this.requestStack = []

    // EVENT MANAGER
    this.events = new EventEmitter2({
      wildcard: true,
      delimiter: '.',
      maxListeners: 100,
      verboseMemoryLeak: true,
      ignoreErrors: false
    })

    // LOAD CONFIG
    this.config = new Config(this, forcedConf)

    // CONNECTOR
    this.gpio = new Gpio(this)

    // FILES
    this.files = new Files(this)

    // WEBSERVER
    this.webserver  = new Webserver(this)

    // SOCKETIO SERVER
    this.socketio   = new Socketio(this)

    // AUDIO
    this.audio = new Audio(this)

    // WIFI
    this.wifi = new Wifi(this)

    // KIOSK
    this.kiosk = new Kiosk(this)

    // MPV
    if(process.platform != 'darwin') this.mpv = new Mpv(this)
  
    
  }

  start()
  {
    this.hp3 = this

    // MAIN PLAYER Select
    this.on('config.ready', ()=>{
      this.player = this.getPlayerType() == 'mpv' ? this.mpv : this.kiosk
      this.on('config.player.type', (type)=>{
        this.player = type == 'mpv' ? this.mpv : this.kiosk
        this.log('player type set to', type)
      })
      this.log('player type:', this.getPlayerType())
    })

    this.emit('ready')
    this.log('READY\n')
  }


  reboot(){
    this.log('rebooting...')
    execSync('reboot')
  }


  gitpull(){
    this.log('git pull...')
    execSync('git pull')
    setTimeout(function(){process.exit()}, 1000)
  }

  getModuleState(module){
    return this.config.get('module.'+module)
  }

  setModuleState(module, value){
    this.config.set('module.'+module, value)
  }

  getAvailableModules(){
    return ['connector', 'serial', 'synchro']
  }

  getPlayerType(){
    return this.getConf('player.type', 'mpv')
  }

  setPlayerType(value){
    this.setConf('player.type', value)
  }

}


module.exports = System
