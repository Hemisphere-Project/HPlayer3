
const Module = require('./module.js')
const os = require("os");
const isPi = require('detect-rpi');
const { execSync } = require('child_process');

class Wifi extends Module{

    constructor(hp3) 
    {
        super('wifi', hp3)
        this.requires('config')
    }

    init() 
    {
        this.log('starting')

        this.wifiOff = this.getConf('wifi.off',  0)

        this.start()
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

    apply() {
        this.log("Can't control Wifi on this machine...")
        return false
    }
}


class WifiPI extends Wifi 
{

    start() 
    {
        const network = require("node-network-manager")

        // First try to connect to wlan0-hmsphr 
        network
            .connectionUp("wlan0-hmsphr")
            .then((data) => this.log('connected to wlan0-hmsphr'))
            .catch((error) => {

                this.log("can't connect to wlan0-hmsphr.. switching to Access Point.")

                // Then switch to Access Point (hotspot)
                network
                    .connectionUp("wlan0-hotspot")
                    .then((data) => this.log('Access Point created:', this.getName()))
                    .catch((error) => this.log('Access Point error:', error));

            })
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

    apply() {
        execSync('setnet')
        setTimeout(()=> this.start(), 1000)
        this.log("config applied, reloading NetworkManager..")
    }
}

module.exports = Wifi
if (isPi()) module.exports = WifiPI