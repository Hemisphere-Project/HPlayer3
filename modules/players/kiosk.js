const Baseplayer = require('./baseplayer.js')
const isPi = require('detect-rpi');
const { execSync } = require('child_process');
const { spawn } = require('child_process');

class Kiosk extends Baseplayer {

    constructor(hp3) {
        super('kiosk', hp3)
        this.requires('gpio')
    }

    init() 
    {    
        this.log('starting')

        // CONFIG
        //
        this.getConf('kiosk.videorotate', 0)
        this.getConf('kiosk.videoflip', false)
        this.getConf('kiosk.theme', 'controller')

        // Start kiosk now
        if (this.getConf('player.type') == 'kiosk') 
            this.startProcess()  

        // Restart on audio output change
        this.on('config.audio.output', (out)=>{
            this.restartProcess()
        })

        // Restart on player type change
        this.on('config.player.type', (out)=>{
            this.restartProcess()
        })
    }

    stopProcess() {
        this.log('No kiosk available on this machine...')
    }

    startProcess() {
        if (this.getConf('player.type') != 'kiosk') return
        this.log('No kiosk available on this machine...')
    }

    restartProcess() {
        if (this.getConf('player.type') != 'kiosk') return
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
        // TODO : check if theme is valid !
        if ( this.setConf('kiosk.theme', theme) ) this.restartProcess()
    }
}


class KioskPI extends Kiosk {

    stopProcess(allowrespawn) 
    {
        this.autorespawn = allowrespawn

        // Stop Kiosk (if already running as a service)
        try {
            execSync('systemctl is-active --quiet kiosk')
            execSync('systemctl stop kiosk')
            this.log('kiosk service stopped')
        }
        catch (error) {
            //this.log(error.status)
        }

        // Stop Weston/Cog/Kiosk
        // try {
        //     execSync('pkill weston')
        //     execSync('pkill cog')
        //     execSync('pkill kiosk')
        //     this.log('kiosk killed')
        // }
        // catch (error) {
        //     //this.log(error.status)
        // }

        // Stop startX
        try {
            execSync('pkill Xorg')
            this.log('Xorg killed')
        }
        catch (error) {
            //this.log(error.status)
        }

    }

    startProcess() 
    {   
        if (this.getConf('player.type') != 'kiosk') {
            this.stopProcess(false)
            return
        }

        this.autorespawn = true

        if (this.kioskprocess) this.restartProcess()
        else 
        {
            var args = [
                '--url', `http://localhost:${this.getConf('webserver.port')}/${this.getConf('kiosk.theme')}`,
                '--rotate', `${this.getVideorotate()}`,
                '--reflect', `${this.getVideoflip()?'x':'n'}`]

            this.log('kiosk', ...args)
            this.kioskprocess = spawn('kiosk', args)

            // Program auto-respawn once terminated
            this.kioskprocess.on('exit', (code, signal) => 
            {
                this.log('kioskprocess exited with ' + `code ${code} and signal ${signal}`);
                this.kioskprocess = null
                if (this.autorespawn) {
                    this.log('restarting..');
                    this.stopProcess(this.autorespawn)
                    this.startProcess()
                }
            });

            // LOGS
            // this.kioskprocess.stdout.setEncoding('utf8');
            // this.kioskprocess.stdout.on('data', (data) => { this.log('stdout: ' + data); });
            // this.kioskprocess.stderr.setEncoding('utf8');
            // this.kioskprocess.stderr.on('data', (data) => { this.log('stderr: ' + data); });

            // this.log('started.')
        }
    }

    restartProcess()
    {
        if (this.kioskprocess) this.stopProcess(true)
        else this.startProcess()
    }   

    setVideorotate(degree)
    {
        degree = degree % 360
        if (degree%90 != 0) degree = 0

        if (degree != this.getConf('kiosk.videorotate')) 
        {
            this.setConf('kiosk.videorotate', degree)
            this.restartProcess()
        }
    }

    setVideoflip(doFlip)
    {
        if (doFlip != this.getConf('kiosk.videoflip')) 
        {
            this.setConf('kiosk.videoflip', doFlip)
            this.restartProcess()
        }
    }

}

module.exports = Kiosk
if (isPi()) module.exports = KioskPI