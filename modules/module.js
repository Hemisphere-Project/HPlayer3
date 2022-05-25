
var EventEmitter2 = require('eventemitter2'); 

class Module extends EventEmitter2 {

    constructor(module_name, hplayer3) {
        super({
            wildcard: true,
            delimiter: '.', 
            maxListeners: 100,
            verboseMemoryLeak: true,
            ignoreErrors: false
          })    // EventEmitter2 conf

        this.module_name = module_name
        this.hp3 = hplayer3
        this.mute = false
    }

    emit(event, ...args) {
        console.log('\t-', this.module_name+'.'+event, ...args)
        super.emit(this.module_name+'.'+event, ...args)
    }

    log(...v) {
        if (!this.mute)
            console.log(`[${this.module_name}]`, ...v)
    }

}

module.exports = Module