
const Module = require('./module.js')
const os = require("os");
const { execSync } = require('child_process');
const { Stats } = require('fs');

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

    reset() {
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
        this.status = null

        this.checkRate = 5000                           // 5s
        this.discoCounter = 30 * 1000/this.checkRate    // 30s

        // Disable hotspot if -1 timeout
        if (this.getTurnoff() == -1) this.discoCounter = -1

        // Disable already launched Hotspot
        this.hotspotOFF().catch(() => {})

        // Disable watchers
        if (this.turnoffWatcher) clearTimeout(this.turnoffWatcher)
        if (this.connectedWatcher) clearInterval(this.connectedWatcher)

        // Watch for wifi status
        this.connectedWatcher = setInterval(() => 
        {
            this.network
                .deviceStatus()
                .then((result) => {
                    for (var status of result) {
                        if (status['device'] == "wlan0") 
                        {
                            // State changed
                            if (!this.status || this.status['state'] != status['state'] || this.status['connection'] != status['connection']) {
                                var s =  status['state'].split(' ')[0]
                                this.log('wlan0 status:', s, status['connection'])
                                this.emit(s, status['connection'])
                            }
                            
                            // Wifi disconnected
                            if (status['state'] == "disconnected") 
                            {
                                // Previous state was connected OR maxretry reached => create hotspot
                                if (this.discoCounter >= 0 && ((this.status && this.status['state'] == 'connected') || this.discoCounter-- == 0)) 
                                {
                                    this.log('wlan0 disconnected -> enabling hotspot')
                                    this.hotspotON()
                                    this.discoCounter = -1 // disable disco counter
                                }
                                else if (this.discoCounter >= 0 || (this.status && this.status['state'] != status['state'])) 
                                    this.log('wlan0 disconnected, waiting for connection..', this.discoCounter)
                            }
                            
                            // Save status
                            this.status = status
                            
                            break;
                        }
                    }
                })
                .catch((error) => console.log(error));

        }, this.checkRate) 

    }

    // create AP based on wlan0-hotspot
    hotspotON()
    {
        return new Promise((resolve, reject) => 
        {
            this.log('creating wlan0-hotspot Access point..')
            this.network
                .connectionUp("wlan0-hotspot")
                .then((data) => {
                    this.log('Access Point created:', this.getName())
                    
                    // Hotspot turnoff
                    this.watchTurnoff()

                    resolve()
                })
                .catch((error) => {
                    this.log('Access Point error:', error)
                    reject()
                });
        })
    }

    // Turnoff Hotspot
    hotspotOFF()
    {
        return new Promise((resolve, reject) =>
        {
            this.log('turning off hotspot')
            this.network
                .connectionDown("wlan0-hotspot")
                .then((data) => {
                    this.log('hotspot turned off')
                    resolve()
                })
                .catch((error) => {
                    this.log('hotspot turn off error:', error)
                    reject()
                });
        })
    }

    // watch for hotspot turnoff
    watchTurnoff()
    {
        if (this.turnoffWatcher) clearTimeout(this.turnoffWatcher)

        if (this.getTurnoff() == 0) return

        this.turnoffWatcher = setTimeout(() => {
            this.log('turning off hotspot')
            this.turnoffWatcher = null
            this.hotspotOFF()
        }, this.getTurnoff() * 1000 * 60)
        this.log('hotspot will turn off in', this.getTurnoff(), 'minutes')
    }

    isConfigurable() {
        return true
    }

    setName(name) {
        if (!name) return false
        execSync('rw')
        execSync(`sed -i -E 's/^ssid=.*/ssid='${name}'/' /etc/NetworkManager/system-connections/wlan0-hotspot.nmconnection`)
        execSync(`hostnamectl set-hostname ${name}`)
        execSync('systemctl restart avahi-daemon')
        execSync('ro')

        this.log("hotspot ssid updated to", name)
        this.log("hostname changed to ", this.getName())
        return true
    }

    getPass() {
        var pass = execSync("sed -n -e '/^psk=/p' /etc/NetworkManager/system-connections/wlan0-hotspot.nmconnection").toString().split('psk=')
        if (pass.length > 1) return pass[1]
        else return ''
    }

    setPass(pass) {
        execSync('rw')
        execSync(`sed -i -E 's/^psk=.*/psk='${pass}'/' /etc/NetworkManager/system-connections/wlan0-hotspot.nmconnection`)
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

        if (this.status['connection'] == "wlan0-hotspot")
            this.watchTurnoff()

        return false
    }

    reset()
    {
        // Disable watchers
        if (this.turnoffWatcher) clearTimeout(this.turnoffWatcher)
        if (this.connectedWatcher) clearInterval(this.connectedWatcher)

        // Restart NetworkManager
        this.log('restarting NetworkManager')
        execSync('systemctl restart NetworkManager')
        this.start()
    }
}

module.exports = Wifi
if (Module.isPi()) module.exports = WifiPI