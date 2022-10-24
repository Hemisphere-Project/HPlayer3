///////////////////////////////////
//// HPLAYER3 WEBSOCKET CLIENT ///
/////////////////////////////////

class HModule extends EventEmitter2 {
    constructor() {
        super({
            wildcard: true,
            delimiter: '.',
            newListener: true,
            removeListener: false,
            maxListeners: 37,
            verboseMemoryLeak: false,
            ignoreErrors: false
          })
    }
}

class HProxy {
    constructor(sio, parentProperty) {
        this.sio = sio
        this.parentProperty = parentProperty
        return new Proxy(() => {}, this);
    }

    //
    // access sub-property recursively
    //
    get (target, prop) {
        // console.log('get', this.parentProperty+'.'+prop)
        return new HProxy(this.sio, this.parentProperty+'.'+prop);
    }


    //
    // generic function call -> relay to server
    //
    apply(target, thisArg, argumentsList) {

        // Value() SET/GET
        // if (this.parentProperty.split('.').slice(-1) == 'value') return this.value(...argumentsList)

        // console.log('apply', this.parentProperty, thisArg, argumentsList)
        return new Promise((resolve, reject) => {
                    this.sio.emit('call', [this.parentProperty, ...argumentsList],
                        (success, data) => {
                            if (success)
                            {
                                try {
                                    var parsedData = JSON.parse(data)
                                    resolve(parsedData)
                                }
                                catch(err) {
                                    reject('[HP3 callback] ' + err.message)
                                }
                            }
                            else reject('[HP3 server] '+data)
                        })
                });

    }
}


class HPlayer3 extends HModule {

    constructor(config) {
        super()

        // CONFIG
        //
        this.config = {
            divlogger: false,
            controls: false     // enable keyboard controls
        }
        for(var prop in config) this.config[prop]=config[prop];  

        // LOGS
        //
        if (this.config.divlogger)
            this.logger = new Divlogger()

        // CONTROLS
        //
        if (this.config.controls) this.controls()

        // PLAYERS
        //
        this._players = {}

        // SOCKET.IO
        //
        this.sio = io()
        this.serverUUID = null

        this.sio.onAny((event, ...args) => {
            console.log(`got ${event}`, args);
        });

        this.sio.on("connect", () => {
            this.emit('connect')
        });
        this.sio.on("uuid", (uuid) => {
            if (!this.serverUUID) this.serverUUID = uuid
            else if (this.serverUUID != uuid) location.reload()
        });
        this.sio.on("disconnect", () => {
            this.emit('disconnect')
        });

        return new Proxy(this, this);
    }



    //
    // access sub-property recursively until hit a function call -> relay to server
    //
    get (target, prop) {
        // console.log('get', prop, this[prop])
        if (prop in this || prop.startsWith('_')) return this[prop]
        return new HProxy(this.sio, prop);
    }


    //
    // Enable keyboard/mouse control
    //
    controls()
    {
        $(window).keypress((e) => {

            var key = String.fromCharCode(e.which).toLowerCase();
            // console.log('>', key, e.which)

            // R / 7 : Refresh
            if(key == 'r' || key == '7') {
                location.reload()
            }

            // C / 0 : Console
            if(key == 'c' || key == '0') {
                this.logger.toggle()
            }

        })
    }

    //
    // Video handler -> call this to link a front video Element to the backend
    //
    registerPlayer(videoEl, name)
    {
        if (name === undefined) name = 'player-'+Object.keys(this._players).length 
            
        if( this._players.hasOwnProperty(name) ) {
            console.error("A video player already exists with this name:", name)
            return this._players[name]
        }

        this._players[name] = new VideoPlayer(videoEl, name)
        return this._players[name]
    }

    //
    // Obtain Video handler
    //
    getPlayer(name) 
    {
        return this._players[name]
    }


}


// VIDEO PLAYER
//
class VideoPlayer extends EventTarget {

    constructor(videoEl, name) 
    {
        super()
        this.videoEl = $(videoEl)
        this.video = this.videoEl[0]
        this.name = (name)?name:'player'

        this.video.loop = false
        this.video.mute = false

        this.state = 'stop'     // stop - loading - playing - paused - stalled - stopping
        this.videoEl.css('visibility','hidden')

        // ENDED HARDFIX WATCHER
        //
        this.endWatchCounter = 0
        this.endWatchMAX = 5
        this.endedWatcher = setInterval(()=>{
            if ((this.video.duration-this.video.currentTime < 0.04 && !this.video.paused)) 
                if (this.endWatchCounter < this.endWatchMAX) this.endWatchCounter += 1
                else
                {
                    console.log('[VIDEO/'+this.name+'] ended (hard fix)')
                    this.video.pause()
                }
        }, 10)

        this.video.addEventListener('loadedmetadata', () => {
            this.endWatchCounter = 0
            console.log('[VIDEO/'+this.name+'] loaded', this.video.videoWidth, this.video.videoHeight);
        }, false);

        //  paused and playing events to control buttons
        this.video.addEventListener("pause", () => {
            console.log('[VIDEO/'+this.name+'] paused');

            // ENDED HARDFIX
            if (this.endWatchCounter == this.endWatchMAX) {
                this.endWatchCounter = 0
                this.video.dispatchEvent( new Event('ended') );
            }
            // STOPPING
            else if (this.state == 'stopping') {
                this.videoEl.css('visibility','hidden')
                this.state = 'stop'
                this.dispatchEvent(new Event(this.state));
            } 
            // PAUSED
            else {
                this.state = 'paused'
                this.dispatchEvent(new Event(this.state));
            }

        }, false);

        this.video.addEventListener("playing", () => {
            this.endWatchCounter = 0
            console.log('[VIDEO/'+this.name+'] playing');
            this.videoEl.css('visibility', 'visible')
            this.state = 'playing'
            this.dispatchEvent(new Event(this.state));
        }, false);

        this.video.addEventListener("ended", () => {
            this.videoEl.css('visibility','hidden')
            this.endWatchCounter = 0
            console.log('[VIDEO/'+this.name+'] ended');
            this.state = 'stop'
            this.dispatchEvent(new Event(this.state));
        }, false);

        this.video.addEventListener("stalled", () => {
            console.log('[VIDEO/'+this.name+'] stalled');
            this.state = 'stalled'
            this.dispatchEvent(new Event(this.state));
        }, false);

        this.video.addEventListener("timeupdate", () => {
            // console.log('[VIDEO/'+this.name+'] time', this.video.currentTime, this.video.duration, this.video.paused);
        }, false);
    }

    play(media) 
    {
        if (this.state == 'loading' || this.state == 'stopping') {
            console.warn("Player already loading/stopping, sorry can't play a new media right now ...")
            return
        } 
        else if (this.state != 'stop') {
            this.on('stop', ()=>{ this.play(media) }, {once: true})
            this.stop()
            return
        }

        this.videoEl.css('visibility','hidden') // Prevent pause image display before video is ready
        this.video.setAttribute('src', media)
        this.video.currentTime = 0
        this.state = 'loading'
        this.dispatchEvent(new Event(this.state));
        this.video.play()
    }

    pause() 
    {
        if (this.state == 'stop') 
            return 

        if (this.state == 'loading')
            this.on('playing', ()=>{ this.pause() }, {once: true})
        else
            this.video.pause()
    }

    stop() 
    {
        if (this.state == 'stop' || this.state == 'stopping') return
        
        var stillLoading = (this.state == 'loading')
        if (stillLoading) this.on('playing', ()=>{ this.stop() }, {once: true})

        this.state = 'stopping'
        this.dispatchEvent(new Event(this.state));
        
        if (!stillLoading) this.pause()
    }

    on(event, clbck, options)
    {
        this.addEventListener(event, clbck, options)
    }
}


// DIV-LOGGER
//
class Divlogger {

    constructor() {

        // OVERLAY LOG DIV
        //
        this.logdiv = $('<div style="font-size: 15px; line-height: 20px; border: 1px solid green; width: 600px; right: 20px; top: 20px; max-height: 523px; overflow:auto; position: absolute; background-color: black; color: white; z-index:1000;" id="log">CONSOLE LOGS<br /></div>').hide().appendTo('body')

        // SUPERCHARGE CONSOLE.LOG
        //
        if (typeof console  != "undefined") 
            if (typeof console.log != 'undefined') console.olog = console.log;
            else console.olog = function() {};

        console.log = function(...m) {
            var message = ''
            for (let i=0; i<m.length; i++) message += ' '+m[i]
            console.olog(message);
            $('#log').append('<div style="font-size: 15px; line-height: 20px;">[info] '+message+'</div>');

            var elem = document.getElementById('log');
            if (elem) elem.scrollTop = elem.scrollHeight;
        };

        // SUPERCHARGE CONSOLE.ERROR
        //
        if (typeof console  != "undefined") 
            if (typeof console.error != 'undefined') console.oerr = console.error;
            else console.oerr = function() {};

        console.error = function(...m) {
            var message = ''
            for (let i=0; i<m.length; i++) message += ' '+m[i]
            console.oerr(message);
            $('#log').append('<div style="font-size: 15px; line-height: 20px; color: red;">[err.] '+message+'</div>');

            var elem = document.getElementById('log');
            if (elem) elem.scrollTop = elem.scrollHeight;
        };

        // SUPERCHARGE CONSOLE.WARN
        //
        if (typeof console  != "undefined") 
            if (typeof console.warn != 'undefined') console.owarn = console.warn;
            else console.owarn = function() {};

        console.warn = function(...m) {
            var message = ''
            for (let i=0; i<m.length; i++) message += ' '+m[i]
            console.owarn(message);
            $('#log').append('<div style="font-size: 15px; line-height: 20px; color: yellow;">[warn] '+message+'</div>');

            var elem = document.getElementById('log');
            if (elem) elem.scrollTop = elem.scrollHeight;
        };

        print = console.debug = console.info =  console.log

        // Catch system ERROR
        window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
            console.error(errorMsg, url, lineNumber);
            return false;
        }

    }

    toggle(force) 
    {
        if (force === true) this.logdiv.show()
        else if (force === false) this.logdiv.hide()
        else this.logdiv.toggle()
    }
}



// TOOLS

// converting first letter to uppercase
function upperWord(str) {
    const capitalized = str.charAt(0).toUpperCase() + str.slice(1);
    return capitalized; 
}


// TOUCH DISABLE (prevent overflow) => Debounce touch
function debounce(millis)
{
    if ( typeof debounce.enable == 'undefined' )
        debounce.enable = true;

    if(!debounce.enable) return false
    debounce.enable = false
    setTimeout(()=>{debounce.enable = true}, millis)
    return true;
}