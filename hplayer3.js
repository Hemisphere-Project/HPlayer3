
var System = require('./modules/system.js')
var isPi = require('detect-rpi');


// CONFIG
var config
if (isPi()) 
    config = {
        'path.conf':  '/data/conf',
        'path.media': '/data/media',

        'webserver.port':   80,
        'webserver.tmp':    '/data/var/tmp'
    }
else 
    config = {
        'webserver.port':   5000
    }

// SYSTEM
//
var hplayer3 = new System(config)
hplayer3.start()




