
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
                    var attributes = data.shift().split('.')
                    var method = attributes.pop()

                    var path = this.hp3 
                    for(const a of attributes) path = path[a]

                    console.log(data, path[method])
                    let result = path[method].call (path, ...data)
                    if (callback) callback( true, JSON.stringify(result) )
                } 
                catch(err) {
                    console.log(err)
                    callback( false, String(err) )
                }
            })

            // //
            // // Getter: data = 'path.to.getter'
            // //
            // socket.on('get', (data, callback) => {
            //     console.log('GET', data)
            //     try{
            //         var attributes = data.split('.')

            //         var path = this.hp3  
            //         for(const a of attributes) path = path[a]
            //         console.log(path)

            //         if (callback) callback( true, JSON.stringify(path) )
            //     } 
            //     catch(err) {
            //         console.log(err)
            //         callback( false, String(err) )
            //     }
            // })

            // //
            // // Setter: data = ['path.to.setter', value]
            // //
            // socket.on('set', (data, callback) => {
            //     console.log('SET', data)
            //     try{
            //         var attributes = data[0].split('.')
            //         var value = data[1]

            //         var path = this.hp3 
            //         for(const a of attributes) path = path[a]

            //         path = value
            //         callback( true )
            //     } 
            //     catch(err) {
            //         console.log(err)
            //         callback( false, String(err) )
            //     }
            // })

            // //
            // // Subscribe: data = 'event'
            // //
            // socket.on('subscribe', (data, callback) => {
            //     try{
            //         let event = data
            //         this.hp3.on(event, (...args) => {
            //             socket.emit(event, ...args)
            //         })
            //         callback( true )
            //     } 
            //     catch(err) {
            //         console.log(err)
            //         callback( false, String(err) )
            //     }
            // })
        
        }) 


        
    }

    log(...v) {
      console.log(`[socketio]`, ...v)
    }
}

module.exports = Socketio