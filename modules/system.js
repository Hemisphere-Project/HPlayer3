const { execSync } = require('child_process');
const fs = require('fs')

class System {


  constructor(hplayer3)
  {
    this.hp3 = hplayer3

    // LOAD CONFIG
    this.config = new Config(this.hp3.conf.path+'/hplayer3.conf')

    // APPLY CONFIG
    this.audioselect( this.config.get('audioselect') )
    this.videorotate( this.config.get('videorotate') )
    this.videoflip( this.config.get('videoflip') )

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


  audioselect(out){

    if (out == 'hdmi') out = 'hdmi0'

    // get current mode
    try {
      let currentOut = String(execSync("sed -n -e '/^pcm.!default/p' /etc/asound.conf")).trim().split(' ')[1]
      if (out != currentOut) {
        execSync("rw")
        execSync("sed -i 's/pcm.!default .*/pcm.!default "+out+"/g' /etc/asound.conf")
        execSync("sed -i 's/ctl.!default .*/ctl.!default "+out+"/g' /etc/asound.conf")
        execSync("ro")
        // TODO: move that into audioselect script in Pi-tools !

        this.config.set('audioselect', out)
        this.log('switching audio to ', out)
        this.restartkiosk()
      }
    }
    catch(err) {
      this.log('error when selecting audio out')
    }

  }


  videorotate(degree){
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


  videoflip(doFlip){

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

  selectTheme(theme){
    this.config.set('theme', theme)
    this.restartkiosk()
  }


  log(...v) {
    console.log(`[system]`, ...v)
  }

}


class Config {

  // DEFAULT CONFIG
  _config = {
    ssid: 'device_name',
    pass: 'Museo69*',
    wifiOff: true,
    audioselect: 'jack',
    audiovolume: 80,
    videorotate: 0,
    videoflip: false,
    videofade: 0,
    modules: ['tactile', 'connector'],
    theme: 'default'
  }

  configFile = null

  constructor(path)
  {
    this.configFile = path

    // load from file
    if (this.configFile)
      try {
        const data = fs.readFileSync(this.configFile);
        var conf = JSON.parse(data)
        for(var prop in conf) this._config[prop]=conf[prop]
        this.log('loaded from', this.configFile);
      }
      catch(err) {
        this.log('No config loaded... using default. ')
        this.save() // save clean file if previous one was broken..
      }

  }

  save()
  {
    if (!this.configFile) {
      this.log('cannot save: no config file provided..')
      return
    }

    try {
      fs.writeFileSync(this.configFile, JSON.stringify(this._config, null, 2), 'utf8');
      this.log('saved !');
    }
    catch (error) {
      this.log('Error while saving config: ', error);
    }

  }

  set(entry, value)
  {
    if (this._config[entry] != value) {
      this._config[entry] = value
      if (this.configFile) this.save()
    }
  }

  get(entry)
  {
    return this._config[entry]
  }

  log(...v) {
    console.log(`[config]`, ...v)
  }
}

module.exports = System
