const Baseplayer = require('./baseplayer.js')
const isPi = require('detect-rpi');
const { execSync } = require('child_process');


class Kiosk extends Baseplayer {

    constructor(hp3) {
        super('kiosk', hp3)
        this.requires('config')
    }

    init() 
    {    
        // CONFIG
        //
        this.setVideorotate( this.getConf('kiosk.videorotate', 0) )
        this.setVideoflip( this.getConf('kiosk.videoflip', false) )
        this.setTheme( this.getConf('kiosk.theme', 'controller') )

        // Start kiosk now
        this.restart()

        // Restart on audio output change
        this.on('audio.output', (out)=>{
            this.restart()
        })
    }

    restart() {
        this.log('No kiosk available on this machine...')
    }
    
    getVideorotate(){
        return this.getConf('kiosk.videorotate')
    }

    setVideorotate(degree){
        this.log("Can't set video rotation on this machine...")
    }

    getVideoflip() {
        return this.getConf('kiosk.videoflip')
    }
    
    setVideoflip(doFlip)
    {
        this.log("Can't set video flip on this machine...")
    }

    getTheme(theme){
        return this.getConf('kiosk.theme')
    }

    setTheme(theme)
    {
        this.log("Can't set theme on this machine...")
    }
}


class KioskPI extends Kiosk {

    restart()
    {
        // Stop Kiosk (if already running)
        try {
            execSync('systemctl is-active --quiet kiosk')
            execSync('systemctl stop kiosk')
            this.log('kiosk stopped')
        }
        catch (error) {
            //this.log(error.status)
        }

        // Start Kiosk
        try {
            execSync('systemctl start kiosk')
            this.log('kiosk started')
        }
        catch (error) {
            this.log('kiosk ERROR')
            this.log(error)
        }
    }

    setVideorotate(degree)
    {
        degree = degree % 360
        if (degree%90 == 0) {

            try {
            let currentMode = String(execSync("sed -n -e '/^ROTATE/p' /boot/kiosk.conf")).trim().split('=')[1]
            let newMode = currentMode

            if (degree == 0 && currentMode.includes('rotate-')) {
                if (currentMode.startsWith('flipped')) newMode = 'flipped'
                else newMode = 'normal'
            }
            else if (degree != 0 && !currentMode.includes('rotate-'+degree)) {
                if (currentMode.startsWith('flipped')) newMode = 'flipped-rotate-'+degree
                else newMode = 'rotate-'+degree
            }

            if (newMode != currentMode)
            {
                execSync("rw")
                execSync("sed -i 's/ROTATE=.*/ROTATE="+newMode+"/g' /boot/kiosk.conf")
                execSync("ro")

                this.setConf('kiosk.videorotate', degree)
                this.log('rotating video', degree)

                this.restart()
            }

            }
            catch(err) {
            this.log('error when rotating video', err)
            }

        }
        else this.log('video rotation not allowed (0|90|180|270)')
    }


    setVideoflip(doFlip)
    {
        try {
            let currentMode = String(execSync("sed -n -e '/^ROTATE/p' /boot/kiosk.conf")).trim().split('=')[1]
            let newMode = currentMode

            if (doFlip && !currentMode.startsWith('flipped')) {
            if (currentMode == 'normal') newMode = 'flipped'
            else newMode = 'flipped-'+currentMode
            }
            else if (!doFlip && currentMode.startsWith('flipped')) {
            if (currentMode == 'flipped') newMode = 'normal'
            else newMode = currentMode.split('flipped-')[1]
            }

            if (newMode != currentMode)
            {
            execSync("rw")
            execSync("sed -i 's/ROTATE=.*/ROTATE="+newMode+"/g' /boot/kiosk.conf")
            execSync("ro")

            this.setConf('kiosk.videoflip', doFlip)
            if (doFlip) this.log('flipping video')
            else this.log('unflipping video')

            this.restart()
            }

        }
        catch(err) {
            this.log('error when flipping video')
        }
    }


    setTheme(theme)
    {

        // TODO : check if theme is valid !

        try {
            let currentThemeUrl = String(execSync("sed -n -e '/^URL/p' /boot/kiosk.conf")).trim().split('=')[1]
            let newThemeUrl = `http://localhost:${this.getConf('webserver.port')}/${theme}`

            if (newThemeUrl != currentThemeUrl)
            {
            execSync("rw")
            var cmd = "sed -i 's/URL=.*/URL="+newThemeUrl.replace(/\//g, '\\/')+"/g' /boot/kiosk.conf"
            // this.log( cmd)
            execSync(cmd)
            execSync("ro")

            this.setConf('kiosk.theme', theme)
            this.log('new kiosk url', newThemeUrl)

            this.restart()
            }

        }
        catch(err) {
            this.log('error when setting theme URL', err)
        }

    }

}

module.exports = Kiosk
if (isPi()) module.exports = KioskPI