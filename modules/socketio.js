const Module = require('./module.js')
var socketio = require('socket.io')
const crypto = require('crypto');

class Socketio extends Module
{    
    constructor(hplayer3) 
    {   
        super('socketio', hplayer3)

        this.mute = false

        this.requires('webserver')
    }

    init() {
        this.uuid = crypto.randomUUID()

        this.logi('starting')

        this.sio = socketio(this.hp3.webserver.http)  

        this.sio.on('connection', (socket) => 
        {
            // start
            this.log('client connected')

            // send current session UUID (allow clients to check if server did restart)
            socket.emit('uuid', this.uuid)

            // on disconnect
            socket.on('disconnect', () => {
                this.log('client disconnected')
            })

            // on subscribe
            socket.on('subscribe', (event) => {
                this.log('client subscribed to', event)
                this.hp3.on(event, (...data) => {
                    socket.emit(event, ...data)
                })
            })


            //
            // Method call: data = ['path.to.method', arg1, arg2, ...]
            //
            socket.on('call', (data, callback) => {
                // this.log('sio-call', data)
                try {
                    if (!Array.isArray(data)) data = [data]
                    // this.log(data)
                    var attributes = data.shift().split('.')
                    var method = attributes.pop()

                    var path = this.hp3 
                    for(const a of attributes) path = path[a]
                    
                    let result
                    if (path[method]) {
                        result = path[method].call(path, ...data)
                        if (callback) callback( true, JSON.stringify(result) )
                    }
                    else {
                        var err = "Call unknown method: "+attributes.join('.')+'.'+method+'()'
                        this.log(err)
                        if (callback) callback( false, err)
                    }
                } 
                catch(err) {
                    this.log(err)
                    if (callback) callback( false, String(err) )
                }
            })

        })
    }

}

module.exports = Socketio