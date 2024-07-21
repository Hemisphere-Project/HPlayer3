
var clc = require("cli-color");
var fs = require('fs');

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

    static isPi() {

        var cpuInfo;
        try {
            cpuInfo = fs.readFileSync('/proc/cpuinfo', { encoding: 'utf8' });
        } catch (e) {
            // if this fails, this is probably not a pi
            return false;
        }

        if (cpuInfo.indexOf('Raspberry Pi') !== -1) {
            return true;
        }

        var model = cpuInfo
            .split('\n')
            .map(line => line.replace(/\t/g, ''))
            .filter(line => line.length > 0)
            .map(line => line.split(':'))
            .map(pair => pair.map(entry => entry.trim()))
            .filter(pair => pair[0] === 'Hardware')

        if (!model || model.length == 0) {
            return false;
        }

        var PI_MODEL_NO = [
            // https://www.raspberrypi.com/documentation/computers/processors.html
            'BCM2708',
            'BCM2709',
            'BCM2710',
            'BCM2835', // Raspberry Pi 1 and Zero
            'BCM2836', // Raspberry Pi 2
            'BCM2837', // Raspberry Pi 3 (and later Raspberry Pi 2)
            'BCM2837B0', // Raspberry Pi 3B+ and 3A+
            'BCM2711', // Raspberry Pi 4B
            'BCM2712' // Raspberry Pi 5
        ];

        var number = model[0][1];
        return PI_MODEL_NO.indexOf(number) > -1
    }

}

module.exports = Module