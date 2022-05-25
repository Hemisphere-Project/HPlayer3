
class Module {

    constructor(module_name, hplayer3) {
        this.module_name = module_name
        this.hp3 = hplayer3
        this.mute = false
    }

    // Will call init() once module is ready 
    requires(module) {
        this.on(module+'.ready', ()=>{
            this.init()
            this.emit('ready')
        })
    }

    emit(event, ...args) {
        if(!this.hp3) return
        console.log('\t-', this.module_name+'.'+event, ...args)
        this.hp3.events.emit(this.module_name+'.'+event, ...args)
    }

    on(event, clbck) {
        if(!this.hp3) return
        this.hp3.events.on(event, clbck)
    }

    log(...v) {
        if (!this.mute)
            console.log(`[${this.module_name}]`, ...v)
    }

    init() {
        // Called on config.loaded event
        this.log('empty init')
    }

    getConf(key, defaultValue) {
        return this.hp3.config.get(key, defaultValue)
    }

    setConf(key, value) {
        this.hp3.config.set(key, value)
    } 

}

module.exports = Module