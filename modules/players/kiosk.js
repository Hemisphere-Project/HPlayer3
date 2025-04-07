const Baseplayer = require('./baseplayer.js')
const { execSync } = require('child_process');
const { spawn } = require('child_process');
const glob = require('glob');
const fs = require('fs')

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

    getDevtools() {
        return this.getConf('kiosk.devtools')
    }
    
    setDevtools(doDevtools)
    {
        this.log("Can't set devtools on this machine...")
    }

    getCursor() {
        return this.getConf('kiosk.cursor')
    }
    
    setCursor(doCursor)
    {
        this.log("Can't set cursor visibility on this machine...")
    }

    getTheme(theme){
        return this.getConf('kiosk.theme')
    }

    setTheme(theme)
    {
        // TODO : check if theme is valid !
        if ( this.setConf('kiosk.theme', theme) ) this.restartProcess()
    }

    getThemeGit() {
        return this.getConf('kiosk.theme_git')
    }

    setThemeGit(theme_git) {
        this.setConf('kiosk.theme_git', theme_git)
        this.refreshThemeGit()
    }

    refreshThemeGit() {
        this.log('Refreshing theme git repository')
        // theme_git = this.getConf('kiosk.theme_git') 
        // theme git must be cloned in this.files.apps_external (if not null)
        // if folder exists, check if it is a git repository and that .git/config url match, 
        // otherwise remove it and re-clone it
        // if it matches, do a git pull

        if (!this.hp3.files.apps_external) {
            this.log('No external apps folder set, please set "path.apps_external" in config')
            return
        }
        
        let theme_git = this.getConf('kiosk.theme_git')
        let theme_path = this.hp3.files.apps_external.path

        // If the folder exists, check if it is a git repository, and that .git/config url match
        if (fs.existsSync(theme_path)) {
            if (fs.existsSync(theme_path + '/.git')) {
                // Check if the url matches
                let config = fs.readFileSync(theme_path + '/.git/config', 'utf8')
                if (!theme_git || !config.includes(theme_git)) {
                    this.log('git URL changed, removing theme current theme repository')
                    execSync('rm -rf ' + theme_path)
                }
            }
            else {
                // if folder empty: remove it
                if (fs.readdirSync(theme_path).length == 0) {
                    this.log('Theme folder is empty, removing it')
                    execSync('rm -rf ' + theme_path)
                }
                else {
                    this.log('Theme folder '+theme_path+' is not empty and not a git repo, please remove it manually')
                    return
                }
            }
        }

        // Git set ?
        if (!theme_git) {
            this.log('No theme git repository set, please set "kiosk.theme_git" in config')
            return
        }

        // Clone the repository
        if (!fs.existsSync(theme_path)) {
            this.log('Cloning theme git repository')
            execSync('git clone ' + theme_git + ' ' + theme_path)
        }

        // Pull the repository
        else {
            this.log('Pulling theme git repository')
            execSync('cd ' + theme_path + ' && git pull')
        }
        this.log('Theme git repository refreshed')
        
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
                '--reflect', `${this.getVideoflip()?'x':'n'}`,
            ]

            if (this.getConf('kiosk.devtools')) args.push('--devtools')
            if (!this.getConf('kiosk.cursor')) args.push('--nocursor')

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
            this.kioskprocess.stdout.setEncoding('utf8');
            this.kioskprocess.stdout.on('data', (data) => { this.log('stdout: ' + data); });
            this.kioskprocess.stderr.setEncoding('utf8');
            this.kioskprocess.stderr.on('data', (data) => { this.log('stderr: ' + data); });

            this.log('started.')
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

    setDevtools(doDevtools)
    {
        if (doDevtools != this.getConf('kiosk.devtools')) 
        {
            this.setConf('kiosk.devtools', doDevtools)
            this.restartProcess()
        }
    }

    setCursor(doCursor)
    {
        if (doCursor != this.getConf('kiosk.cursor')) 
        {
            this.setConf('kiosk.cursor', doCursor)
            this.restartProcess()
        }
    }

    ///////////// PLAYER COMMANDS /////////////

    play(url) {
        if (!url.startsWith('/')) 
            url = this.hp3.files.media.path + '/' + url
        
        this.log('PLAY', url)
        var files = glob.sync(url)

        if (files.length > 0) {
            var media = files[0].replace(this.hp3.files.media.path, '')
            this.emit('play', media)
        }
        else {
            this.log('No file found: ' + url)
        }      
    }

    pause() {
        this.emit('pause')
    }

    resume() {
        this.emit('resume')
    }

    stop() {
        this.emit('stop')
    }

    seek(seconds) {
        this.emit('seek', seconds)
    }

    volume(vol) {
        this.emit('volume', vol)
    }

    mute() {
        this.emit('mute')
    }

    unmute() {
        this.emit('unmute')
    }

    toggleMute() {
        this.emit('toggleMute')
    }

    setLoop(loop) {
        this.emit('setLoop', loop)
    }

    setSpeed(speed) {
        this.emit('setSpeed')
    }

    setProperty(prop, value) {
        this.emit('setProperty', prop, value)
    }

    getProperty(prop) {
        this.emit('getProperty', prop)
    }

    getDuration() {
        this.emit('getDuration')
    }

    getTimePosition() {
        this.emit('getTimePosition')
    }

    getVolume() {
        this.emit('getVolume')
    }

    getMute() {
        this.emit('getMute')
    }

    getLoop() {
        this.emit('getLoop')
    }

    getSpeed() {
        this.emit('getSpeed')
    }

}

module.exports = Kiosk
if (Baseplayer.isPi()) module.exports = KioskPI