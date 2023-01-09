
const Module = require('./module.js')
const os = require("os");
const isPi = require('detect-rpi');
const { execSync } = require('child_process');
const { Stats } = require('fs');
const { time } = require('console');

class Wifi extends Module{

    constructor(hp3) 
    {
        super('wifi', hp3)
        this.requires('gpio')
    }

    init() 
    {
        this.log('starting')
        this.getConf('wifi.off',  0)

        return this.start()
    }

    start() {}

    isConfigurable() {
        return false
    }

    getName() {
        return os.hostname()
    }

    setName(name) {
        this.log("Can't set Hostname/SSID on this machine...")
        return false
    }

    getPass() {
        return ''
    }

    setPass(pass) {
        this.log("Can't set Wifi password on this machine...")
        return false
    }

    getTurnoff() {
        return 0
    }

    setTurnoff(timeout) {
        this.log("Can't set Turn off timeout on this machine...")
        return false
    }

    apply() {
        this.log("Can't control Wifi on this machine...")
        return false
    }
}


class WifiPI extends Wifi 
{
    constructor(hp3) 
    {
        super(hp3)
        this.network = require("node-network-manager")
    }

    start() 
    {
        this.mode = "unknown"

        if (this.turnoffWatcher) clearTimeout(this.turnoffWatcher)

        // Start wifi
        return new Promise((resolve, reject) => {
            
            // Try service connection
            this.network.deviceDisconnect("wlan0").catch(()=>{}).finally(()=>{
                this.serviceMode()
                .then(resolve)
                .catch(()=>{
                    // Fallback to Hotspot Access point
                    this.network.deviceDisconnect("wlan0").catch(()=>{}).finally(()=>{
                        this.hotspotMode()
                            .then(resolve)
                            .catch(reject)
                    })
                })
            })
        })
    }

    // try to connect to wlan0-service
    serviceMode()
    {
        return new Promise((resolve, reject) => 
        {
            this.log('connecting to wlan0-service..')
            this.network
                .connectionUp("wlan0-service")
                .then((data) => {
                    this.log('connected to wlan0-service')
                    this.mode = "service"
                    this.emit('connected', this.mode)

                    // Service connection watcher
                    this.watchService()

                    resolve()
                })
                .catch((error) => {
                    this.log("Error: wlan0-service not found")
                    this.mode = "error"
                    reject()
                })
        })
    }

    // create AP based on wlan0-hotspot
    hotspotMode()
    {
        return new Promise((resolve, reject) => 
        {
            this.log('creating wlan0-hotspot Access point..')
            this.network
                .connectionUp("wlan0-hotspot")
                .then((data) => {
                    this.log('Access Point created:', this.getName())
                    this.mode = "hotspot"
                    
                    // Hotspot turnoff
                    this.watchTurnoff()

                    this.emit('connected', this.mode)
                    resolve()
                })
                .catch((error) => {
                    this.log('Access Point error:', error)
                    this.mode = "error"
                    reject()
                });
        })
    }

    // watch for wlan0-service disconnect
    watchService() 
    {
        if (this.watcher) clearInterval(this.watcher)
        this.watcher = setInterval(() => 
        {
            this.network
            .deviceStatus()
            .then((result) => {
                for (var status of result) {
                    if (status['device'] == "wlan0") {
                        if (status['state'] == "disconnected") 
                        {
                            this.log('wlan0 disconnected')
                            if (this.watcher) clearTimeout(this.watcher)
                            this.emit('disconnected', this.mode)
                            this.start()
                        }
                        break;
                    }
                }
            })
            .catch((error) => console.log(error));
        }, 5000)        
    }

    // watch for hotspot turnoff
    watchTurnoff()
    {
        if (this.turnoffWatcher) clearTimeout(this.turnoffWatcher)

        if (this.getTurnoff() == 0) return
        if (this.mode != "hotspot") return

        this.turnoffWatcher = setTimeout(() => {
            this.log('turning off hotspot')
            this.turnoffWatcher = null
            this.network
                .connectionDown("wlan0-hotspot")
                .then((data) => {
                    this.log('hotspot turned off')
                    this.mode = "off"
                    this.emit('disconnected', this.mode)
                })
                .catch((error) => {
                    this.log('hotspot turn off error:', error)
                });
        }, this.getTurnoff() * 1000 * 60)
    }

    isConfigurable() {
        return true
    }

    setName(name) {
        if (!name) return false
        execSync('hostrename '+name)
        this.log("hostname changed to ", this.getName())
        this.log("hotspot ssid updated to", this.getName())
        return true
    }

    getPass() {
        var pass = execSync("sed -n -e '/^psk=/p' /boot/wifi/wlan0-hotspot.nmconnection").toString().split('psk=')
        if (pass.length > 1) return pass[1]
        else return ''
    }

    setPass(pass) {
        execSync('rw')
        execSync(`sed -i -E 's/^psk=.*/psk='${pass}'/' /boot/wifi/wlan0-hotspot.nmconnection`)
        execSync('ro')
        this.log("hotspot password updated to", this.getPass())
        return true
    }

    getTurnoff() {
        return parseInt(this.getConf('wifi.off',  0))        
    }

    setTurnoff(timeout) {
        timeout = parseInt(timeout)
        this.setConf('wifi.off', timeout)
        this.log('set turnoff', timeout)
        this.watchTurnoff()

        return false
    }

    apply() {
        execSync('setnet')
        setTimeout(()=> this.start(), 1000)
        this.log("config applied, reloading NetworkManager..")
    }
}

module.exports = Wifi
if (isPi()) module.exports = WifiPI