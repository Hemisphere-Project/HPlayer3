
var System = require('./modules/system.js')
var isPi = require('detect-rpi');


// CONFIG
var config
if (isPi()) 
    config = {
        path_conf:  '/data/conf',
        path_media: '/data/media',
        path_temp:  '/data/var/tmp',
        web_port:   80
    }
else 
    config = {
        web_port:   5000
    }

// SYSTEM
//
var hplayer3 = new System(config)






