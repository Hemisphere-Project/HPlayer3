
const Module = require('./module.js')
const fs = require('fs')

class Config extends Module {

    // DEFAULT CONFIG
    _config = {
      path_conf:  __dirname+'/../conf',
      path_media: __dirname+'/../media',
      path_apps:  __dirname+'/../apps',
      web_port:   5000,
      wifiOff: true,
      videorotate: 0,
      videoflip: false,
      videofade: 0,
      modules: ['tactile', 'connector'],
      theme: 'default'
    }
  
    configFile = null
  
    constructor(hp3, baseConf)
    {
      super('config', hp3)

      // Apply base conf
      this._config = {...this._config, ...baseConf}

      
      // load from file
      if (this._config.path_conf) {
        this.configFile = this._config.path_conf+'/hplayer3.conf'
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
        this.emit(entry, value)
        return true
      }
      return false
    }
  
    get(entry)
    {
      return this._config[entry]
    }
  
  }

module.exports = Config