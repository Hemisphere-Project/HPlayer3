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
    constructor() {
        super()

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

}