const Module = require('./module.js')
const Audio = require('./audio.js')
const Config = require('./config.js')
const Wifi = require('./wifi.js')
const Webserver = require('./webserver.js')
const Socketio = require('./socketio.js')
const { execSync } = require('child_process');
const fs = require('fs')
const os = require("os");
const Files = require('./files.js');
const { EventEmitter2 } = require('eventemitter2')
const Kiosk = require('./players/kiosk.js')

class System extends Module
{

  constructor(forcedConf)
  {
    super('system')
    this.log('HPlayer3 starting...')

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

  }

  start() 
  {
    this.hp3 = this
    this.emit('ready')
    this.log('READY')
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
    return ['kiosk', 'connector', 'serial', 'synchro']
  }

}


module.exports = System
