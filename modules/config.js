
const Module = require('./module.js')
const fs = require('fs')

class Config extends Module {

    _config = {}
    configFile = null
  
    constructor(hp3, forcedConf)
    {
      super('config', hp3, 'yellowBright')

      this.forcedConf = forcedConf
      this._config = {...this._config, ...this.forcedConf}
      
      this.requires('system')
    }

    init() 
    {
      var confpath = this.getConf('path.conf', __dirname+'/../conf')
      
      // load from file
      this.configFile = confpath+'/hplayer3.conf'
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

      // Apply hardcoded conf (overwrite stored config)
      this._config = {...this._config, ...this.forcedConf}
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

    get(entry, defaultValue)
    {
      if (defaultValue !== null && !(entry in this._config)) this.set(entry, defaultValue)
      return this._config[entry]
    }

  }

module.exports = Config
