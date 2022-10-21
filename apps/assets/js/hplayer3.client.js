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
    videoPlayer( div, opts )
    {
        opts = (opts) ? opts : {}

        if (opts.name === undefined) opts.name = 'player-'+Object.keys(this._players).length 
            
        if( this._players.hasOwnProperty(opts.name) ) {
            console.warn("A video player already exists with this name:", opts.name)
            return this._players[opts.name]
        }

        this._players[opts.name] = new VideoPlayer(div, opts)
        return this._players[opts.name]
    }

    //
    // Obtain Video handler
    //
    getPlayer(name) 
    {
        return this._players[name]
    }


    //
    // MEDIA GRID: create a grid of media thumbnails
    //
    mediaGrid( div, opts ) 
    {
        let options = {...{
        // default options
        folder: '',
        types: [],  // 'video', 'image', 'audio'
        }, ...opts}

        return new Promise((resolve, reject) => 
        {
            // Get media list
            this.files.media.getTree(options.folder)
                .catch( error => {
                    console.warn(error) 
                    reject(error)
                })
                .then( data => {

                    // console.log(data)
                    let allFiles = data.fileTree
                    $(div).empty()
                    let grid = $('<div class="mediagrid"></div>').appendTo(div)

                    // For each file
                    allFiles.forEach((item, i) => 
                    {
                        // Wanted type ?
                        if(!options.types.includes(item.type)) return 

                        // VIDEO
                        if(item.type == 'video') {
                            let preview = $('<div class="item item-'+item.type+'" data-media="'+item.name+'"></div>').appendTo(grid)

                            // THUMBNAIL
                            let thumb = $('<div class="image_wrapper"><img class="thumb" src="/assets/img/video-placeholder.jpg"></div>').appendTo(preview)
                            allFiles.forEach((file, i) => {
                                if((file.raw_name==item.raw_name)&&(file.type=='image')) 
                                {
                                    let img = thumb.find('img')
                                    img.on('load', ()=>{ img.css('height', img.width()*0.5625) })   // Image RATIO
                                    img.attr('src', '/media/'+options.folder+'/'+file.name)         // Image SRC
                                }
                            });

                            // DESCRIPTION
                            let title = item.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
                            let desc = $('<div class="infos"><div class="title">'+title+'</div><div class="subtitle">a movie file ...</div></div>').appendTo(preview)
                            const textExist = allFiles.some(file => ((file.raw_name === item.raw_name)&&(file.type === 'text')) );
                            if (textExist) {
                                $.get('/media/'+options.folder+'/'+item.raw_name +'.txt', (txt) => {
                                    desc.empty()
                                    desc.append(txt)
                                }, 'text')
                            }
                        }

                        // IMAGE
                        // TODO

                        // AUDIO
                        // TODO
                    
                    });

                    resolve(grid)
                })
        })
    
    }

}


// VIDEO PLAYER
//
class VideoPlayer extends EventTarget {

    constructor(div, opts) 
    {
        super()

        // OPTIONS
        let options = {...{
            // default options
            name: undefined,
            closer: true,
            scrollbar: true,
        }, ...opts}

        this.name = (options.name)?options.name:'player'

        this.div = $(div)
        
        // VIDEO ELEMENT
        this.videoEl = $('<video id="videoplayer" src=""></video>').appendTo(div)
        this.video = this.videoEl[0]
        this.video.loop = false
        this.video.mute = false
        
        // SCROLLBAR
        this.scrollBar = (options.scrollbar)?$('<div class="scrollbar">').appendTo(div).hide():null
        if (this.scrollBar) {
            var sb_container = $('<div class="scrollbar_container">').appendTo(this.scrollBar)
                $('<div class="scrollbar_left">').appendTo(sb_container)
                $('<div class="scrollbar_tick">').appendTo(sb_container)
                $('<div class="scrollbar_background">').appendTo(sb_container)

            $('<div class="scrollbar_time">00:00</div>').appendTo(this.scrollBar)

            sb_container.on('click', (e) => 
            {
                // %
                var percent = ( (e.pageX - sb_container.offset().left) / sb_container.width() ) * 100
                this.timeClick = Date.now()
                this.video.currentTime = percent * this.video.duration / 100
                if(this.video.paused) this.video.play()
            })

            this.on('playing', ()=>{
                clearInterval(this.scrollBarUpdate)
                this.scrollBarUpdate = setInterval(() => {
                    var currentTime = this.video.currentTime
                    var percent = currentTime*100 / this.video.duration
                    $('.scrollbar_left').css('width', percent+'%')
                    $('.scrollbar_tick').css('margin-left', percent+'%')
                    $('.scrollbar_time').text(secondsToTime(currentTime))
                    }, 20)
                this.scrollBar.show()
            })
            this.on('stop', ()=>{ 
                clearInterval(this.scrollBarUpdate)
                this.scrollBar.hide() 
                $('.scrollbar_left').css('width', '0%')
                $('.scrollbar_tick').css('margin-left', '0%')
                $('.scrollbar_time').text('')
            })
        }
        
        // CLOSER
        this.videoCloser = (options.closer)?$('<div class="closer">').appendTo(div).hide():null
        if (this.videoCloser) {
            this.videoCloser.on('click', () => { this.stop() });
            
            this.on('playing', ()=>{ this.videoCloser.show() })
            this.on('stop', ()=>{ this.videoCloser.hide() })
        }
        else this.videoEl.on('click', () => { this.stop() });


        // TIME WATCH
        this.timeClick = 0
        
        //
        // VIDEO ELEMENT EVENTS
        //

        // ENDED HARDFIX WATCHER
        this.endWatchCounter = 0
        this.endWatchMAX = 5
        this.endedWatcher = setInterval(()=>{
            if ((this.video.duration-this.video.currentTime < 0.04 && this.state == 'playing')) 
                if (this.endWatchCounter < this.endWatchMAX) this.endWatchCounter += 1
                else
                {
                    console.log('['+this.name+'/video] ended (hard fix)')
                    this.video.pause()
                }
        }, 10)

        // LOADED
        this.video.addEventListener('loadedmetadata', () => {
            this.endWatchCounter = 0
            // console.log('['+this.name+'/video] loaded', this.video.videoWidth, this.video.videoHeight);
        }, false);

        // PLAYING
        this.video.addEventListener("playing", () => {
            this.state = 'playing'
            this.dispatchEvent(new Event(this.state));
        }, false);

        // PAUSED - ENDED (hardfix) - STOP
        this.video.addEventListener("pause", () => {
            // console.log('['+this.name+'/video] pause', this.state);
            // ENDED HARDFIX
            if (this.endWatchCounter == this.endWatchMAX) {
                this.video.dispatchEvent( new Event('ended') );
            }
            // STOPPING
            else if (this.state == 'stopping') {
                this.state = 'stop'
                this.dispatchEvent(new Event(this.state));
            } 
            // PAUSED
            else {
                this.state = 'paused'
                this.dispatchEvent(new Event(this.state));
            }
        }, false);

        // ENDED
        this.video.addEventListener("ended", () => {
            if (this.state != 'stop') {
                this.state = 'stop'
                this.dispatchEvent(new Event(this.state));
            }
        }, false);

        // STALLED
        this.video.addEventListener("stalled", () => {
            this.state = 'stalled'
            this.dispatchEvent(new Event(this.state));
        }, false);

        // TIME UPDATE
        this.video.addEventListener("timeupdate", () => {
            // console.log('['+this.name+'/video] time', this.video.currentTime, this.video.duration, this.video.paused);
        }, false);


        //
        // VIDEO PLAYER EVENTS
        //

        this.on('loading', () => {
            this.timeClick = Date.now()
            console.log('['+this.name+'/player] loading');
            this.videoEl.css('visibility','hidden') // Prevent pause image display before video is ready
        })

        this.on('playing', () => {
            this.endWatchCounter = 0
            this.videoEl.css('visibility', 'visible')
            console.log('['+this.name+'/player] playing (load time = '+(Date.now()-this.timeClick)+'ms)');
        })

        this.on('paused', () => {
            console.log('['+this.name+'/player] paused');
        })

        this.on('stalled', () => {
            console.log('['+this.name+'/player] stalled');
        })

        this.on('stop', () => {
            console.log('['+this.name+'/player] stop');
            this.endWatchCounter = 0
            this.videoEl.css('visibility','hidden')
        })

        //
        // STATE INIT
        //

        this.state = 'stop'     // stop - loading - playing - paused - stalled - (stopping)
        this.dispatchEvent(new Event(this.state));
    }

    // CMD PLAY
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

        // Loading
        this.video.setAttribute('src', media)
        this.video.currentTime = 0
        this.state = 'loading'
        this.dispatchEvent(new Event(this.state));
        

        // Play
        this.video.play()
            .catch((error) => {
                this.state = 'stop'
                this.dispatchEvent(new Event(this.state));
                console.error(error)
            })

    }

    // CMD PAUSE
    pause() 
    {
        if (this.state == 'stop' || this.state == 'stopping') return

        if (this.state == 'loading')
            this.on('playing', ()=>{ this.pause() }, {once: true})
        else {
            this.video.pause()
        }
    }

    // CMD STOP
    stop() 
    {
        if (this.state == 'stop' || this.state == 'stopping') return
        
        if (this.state == 'loading') {
            this.on('playing', ()=>{ this.stop() }, {once: true})
        }
        else {
            this.state = 'stopping'
            this.video.pause()
        }
    }

    // ON EVENT
    on(event, clbck, options)
    {
        this.addEventListener(event, clbck, options)
    }

    // OFF EVENT
    off(event, clbck, options)
    {
        this.removeEventListener(event, clbck, options)
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

  // UTILS
  function secondsToTime(secs)
  {
    var minutes = Math.floor(secs / 60)
    var seconds = Math.floor(secs - minutes * 60)
    var x = minutes < 10 ? "0" + minutes : minutes
    var y = seconds < 10 ? "0" + seconds : seconds
    return x + ":" + y
  }