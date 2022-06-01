
var Files = require('./modules/files.js')
var Webserver = require('./modules/webserver.js')
var Socketio = require('./modules/socketio.js')


var hplayer3 = {}

hplayer3.media      = new Files( __dirname+'/media' )

hplayer3.webserver  = new Webserver({ 
                            hp3:    hplayer3,
                            port:   5000, 
                            apps:   './apps', 
                            media:  hplayer3.media.path 
                        })

hplayer3.socketio   = new Socketio(hplayer3)


// console.log( hplayer3.media.getTree('gallery1') )