
var socketio = require('socket.io')

class Socketio 
{    
    constructor(hplayer3) 
    {   
        this.hp3 = hplayer3
        this.sio = socketio(this.hp3.webserver.http)  

        this.sio.on('connection', (socket) => 
        {
            // start
            this.log('client connected')

            // on disconnect
            socket.on('disconnect', () => {
                this.log('client disconnected')
            })

            //
            // Method call: data = ['path.to.method', arg1, arg2, ...]
            //
            socket.on('call', (data, callback) => {
                try {
                    if (!Array.isArray(data)) data = [data]
                    // console.log(data)
                    var attributes = data.shift().split('.')
                    var method = attributes.pop()

                    var path = this.hp3 
                    for(const a of attributes) path = path[a]

                    let result = path[method].call (path, ...data)
                    if (callback) callback( true, JSON.stringify(result) )
                } 
                catch(err) {
                    console.log(err)
                    callback( false, String(err) )
                }
            })

        }) 


        
    }

    log(...v) {
      console.log(`[socketio]`, ...v)
    }
}

module.exports = Socketio