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

    config = {
        controls: false     // enable keyboard controls
    }

    constructor(config) {
        super()

        // CONFIG
        //
        for(var prop in config) this.config[prop]=config[prop];  

        // CONTROLS
        //
        if (this.config.controls) this.controls()

        // SOCKET.IO
        //
        this.sio = io()

        this.sio.onAny((event, ...args) => {
            console.log(`got ${event}`);
        });

        this.sio.on("connect", () => {
            this.emit('connect')
        });
        this.sio.on("disconnect", () => {
            this.emit('disconnect')
        });

        // socket.on('reset', (data) => {
        //   location.reload()
        // })

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
        $(window).keypress(function(e) {
                    
            var key = String.fromCharCode(e.which).toLowerCase();
            console.log('>', key, e.which)

            // R / 7 : Refresh
            if(key == 'r' || key == '7') {
                location.reload()
            }

            // C / 0 : Console
            if(key == 'c' || key == '0') {
                $('#log').toggle()
            }
            
        })
    }

}


// // DIV-LOGGER
// console.log = function(...m) {
//     message = ''
//     for (let i=0; i<m.length; i++) message += ' '+m[i]
//     console.olog(message);
//     $('#log').append(message + '<br />');

//     var elem = document.getElementById('log');
//     elem.scrollTop = elem.scrollHeight;
// };
// print = console.error = console.debug = console.info =  console.log