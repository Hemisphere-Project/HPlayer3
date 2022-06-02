
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
    }

    gitpull(){
      this.log('git pull...')
    }


    log(...v) {
      console.log(`[system]`, ...v)
    }

}

module.exports = System
