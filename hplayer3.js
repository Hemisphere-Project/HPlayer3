
var Files = require('./modules/files.js')
var Webserver = require('./modules/webserver.js')
var Socketio = require('./modules/socketio.js')
var System = require('./modules/system.js')
var Wifi = require('./modules/wifi.js')
var isPi = require('detect-rpi');

var hplayer3 = {}

// BASEPATH
var basepath = __dirname            // Default: local directory
if (isPi()) basepath = '/data'      // On RPi: use /data

// FILES
hplayer3.files = {
    media: new Files( basepath+'/media' ),
    conf:  new Files( basepath+'/conf' ),
    apps:  new Files( __dirname+'/apps' )
}


// SYSTEM
//
hplayer3.wifi   = new Wifi()
hplayer3.system = new System(hplayer3)

// FILE SERVER
//
var webPort = 5000
if (isPi()) webPort = 80
hplayer3.webserver  = new Webserver(hplayer3, {port: webPort, apps: './apps'})


// SOCKETIO SERVER
//
hplayer3.socketio   = new Socketio(hplayer3)
