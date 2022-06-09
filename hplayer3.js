
var Files = require('./modules/files.js')
var Webserver = require('./modules/webserver.js')
var Socketio = require('./modules/socketio.js')
var System = require('./modules/system.js')
var isPi = require('detect-rpi');

var hplayer3 = {}
var configFile
// SYSTEM CONTROLS
//
// MEDIA
//
if (isPi()) {
    hplayer3.media = new Files( '/data/media' )
} else {
    hplayer3.media = new Files( __dirname+'/media' )
    hplayer3.conf = new Files( __dirname+'/conf' )
}


hplayer3.apps = new Files( __dirname+'/apps' )

// SYSTEM
//
hplayer3.system   = new System(hplayer3)

// FILE SERVER
//
hplayer3.webserver  = new Webserver({
                            hp3:    hplayer3,
                            port:   5000,
                            apps:   './apps',
                            media:  hplayer3.media,
                            conf:  hplayer3.conf,
                        })


// SOCKETIO SERVER
//
hplayer3.socketio   = new Socketio(hplayer3)
