
var clc = require("cli-color");

class Module {

    constructor(module_name, hplayer3, color) {
        this.color = clc[color] || clc.magenta
        this.module_name = module_name
        this.hp3 = hplayer3
        this.mute = false
    }

    // Will call init() once module is ready 
    requires(module) {
        this.on(module+'.ready', ()=>{
            var promise = this.init()
            if (promise) promise
                            .then(()=>this.emit('ready'))
                            .catch((err)=>this.log(clc.bold(err)))
            else this.emit('ready')
        })
    }

    emit(event, ...args) {
        if(!this.hp3) return
        console.log(clc.blue('\t*'), clc.blue.italic(this.module_name+'.'+event), ...args)
        this.hp3.events.emit(this.module_name+'.'+event, ...args)
    }

    on(event, clbck) {
        if(!this.hp3) return
        this.hp3.events.on(event, clbck)
    }

    logi(...v) {
        console.log(this.color(`[${this.module_name}]`), ...v)
    }

    log(...v) {
        if (!this.mute)
            console.log(this.color(`[${this.module_name}]`), ...v)
    }

    init() {
        // Called on config.loaded event
        this.log('empty init')
    }

    getConf(key, defaultValue) {
        return this.hp3.config.get(key, defaultValue)
    }

    setConf(key, value) {
        return this.hp3.config.set(key, value)
    } 

}

module.exports = Module