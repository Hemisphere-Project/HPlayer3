const { execSync } = require('child_process');

class System {

    // DEFAULT CONFIG

    config = {
        device_name: 'hplayer3',
        password: 'hplayer3'
    }

    constructor(config)
    {

    }

    reboot(){
      this.log('rebooting...')
      exec('reboot')
    }

    gitpull(){
      this.log('git pull...')
      execSync('git pull')
      setTimeout(function(){process.exit()}, 1000)
    }


    log(...v) {
      console.log(`[system]`, ...v)
    }

}

module.exports = System
