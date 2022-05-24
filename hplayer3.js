
var Files = require('./modules/files.js')
var Webserver = require('./modules/webserver.js')
var Socketio = require('./modules/socketio.js')
var System = require('./modules/system.js')
var isPi = require('detect-rpi');

var hplayer3 = {}


// MEDIA
//
if (isPi()) {
    hplayer3.media = new Files( '/data/media' )
} else {
    hplayer3.media = new Files( __dirname+'/media' )
}


// FILE SERVER
//
hplayer3.webserver  = new Webserver({
                            hp3:    hplayer3,
                            port:   5000,
                            apps:   './apps',
                            media:  hplayer3.media
                        })


// SOCKETIO SERVER
//                        
hplayer3.socketio   = new Socketio(hplayer3)


// SYSTEM CONTROLS
//
hplayer3.system   = new System(hplayer3)


