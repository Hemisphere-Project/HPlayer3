
const Module = require('./module.js')
const os = require("os");
const isPi = require('detect-rpi');
const { execSync } = require('child_process');

class Wifi extends Module{

    constructor() {
        super('wifi')
        if (isPi()) return new WifiPI()
    }

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
}


class WifiPI extends Wifi {

    isConfigurable() {
        return true
    }

    setName(name) {
        if (!name) return false
        execSync('hostrename '+name)
        this.log("hostname changed to ", this.getName())
        execSync('setnet')
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
        execSync('setnet')
        execSync('ro')
        this.log("hotspot password updated to", this.getPass())
        return true
    }
}

module.exports = Wifi