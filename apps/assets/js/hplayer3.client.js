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
class VideoPlayer {

    constructor(videoEl, name) {
        this.videoEl = $(videoEl)
        this.name = name

        this.videoEl[0].loop = false
        this.videoEl[0].mute = false

        // ENDED HARDFIX WATCHER
        //
        this.endWatchCounter = 0
        this.endWatchMAX = 5
        this.endedWatcher = setInterval(()=>{
            if ((this.videoEl[0].duration-this.videoEl[0].currentTime < 0.04 && !this.videoEl[0].paused)) 
                if (this.endWatchCounter < this.endWatchMAX) this.endWatchCounter += 1
                else
                {
                    console.log('[VIDEO/'+this.name+'] ended (hard fix)')
                    this.videoEl[0].pause()
                }
        }, 10)

        this.videoEl[0].addEventListener('loadedmetadata', () => {
            this.endWatchCounter = 0
            console.log('[VIDEO/'+this.name+'] loaded', this.videoEl[0].videoWidth, this.videoEl[0].videoHeight);
        }, false);

        //  paused and playing events to control buttons
        this.videoEl[0].addEventListener("pause", () => {
            console.log('[VIDEO/'+this.name+'] paused');

            // ENDED HARDFIX
            if (this.endWatchCounter == this.endWatchMAX) {
                this.endWatchCounter = 0
                this.videoEl[0].dispatchEvent( new Event('ended') );
            }
        }, false);

        this.videoEl[0].addEventListener("playing", () => {
            this.endWatchCounter = 0
            console.log('[VIDEO/'+this.name+'] playing');
            this.videoEl.css('visibility', 'visible')
        }, false);

        this.videoEl[0].addEventListener("ended", () => {
            // BROKEN ! use hard fix instead
            this.endWatchCounter = 0
            console.log('[VIDEO/'+this.name+'] ended');
        }, false);

        this.videoEl[0].addEventListener("stalled", () => {
            console.log('[VIDEO/'+this.name+'] stalled');
        }, false);

        this.videoEl[0].addEventListener("timeupdate", () => {
            // console.log('[VIDEO/'+this.name+'] time', this.videoEl[0].currentTime, this.videoEl[0].duration, this.videoEl[0].paused);
        }, false);


        
    }

    play(media) {
        this.videoEl.css('visibility','hidden') // Prevent pause image display before video is ready

        this.videoEl[0].setAttribute('src', media)
        this.videoEl[0].currentTime = 0
        this.videoEl[0].play()
    }

    pause() {
        this.videoEl[0].pause()
    }

    stop() {
        this.videoEl[0].pause()
        this.videoEl.css('visibility','hidden')
    }

}



// DIV-LOGGER
//
class Divlogger {

    constructor() {

        // OVERLAY LOG DIV
        //
        this.logdiv = $('<div style="font-size: 15px; line-height: 20px; border: 1px solid green; width: 800px; right: 20px; top: 20px; max-height: 523px; overflow:auto; position: absolute; background-color: black; color: white; z-index:1000;" id="log">CONSOLE LOGS<br /></div>').hide().appendTo('body')

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
            if (elem)
            elem.scrollTop = elem.scrollHeight;
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
            $('#log').append('<div style="font-size: 15px; line-height: 20px; color: red;">[erro] '+message+'</div>');

            var elem = document.getElementById('log');
            if (elem)
            elem.scrollTop = elem.scrollHeight;
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
function touchSafe(millis)
{
    if ( typeof touchSafe.touchEnable == 'undefined' )
        touchSafe.touchEnable = true;

    if(!touchSafe.touchEnable) return false
    touchSafe.touchEnable = false
    setTimeout(()=>{touchSafe.touchEnable = true}, millis)
    return true;
}