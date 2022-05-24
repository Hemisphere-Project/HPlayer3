


class Module {

    constructor(module_name, hplayer3) {
        this.module_name = module_name
        this.hp3 = hplayer3
        this.mute = false
    }

    log(...v) {
        if (!this.mute)
            console.log(`[${this.module_name}]`, ...v)
    }

}

module.exports = Module