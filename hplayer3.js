
var System = require('./modules/system.js')

// CONFIG
var config
if (System.isPi()) 
    config = {
        'path.conf':            '/data/conf',
        'path.media':           '/data/media',
        'path.apps_external':   '/data/apps',
        'webserver.port':       80,
        'webserver.tmp':        '/data/var/tmp'
    }
else 
    config = {
        'webserver.port':       5000,
        'path.apps_external':   '/data/apps'      // path to clone external apps
    }

// SYSTEM
//
var hplayer3 = new System(config)
hplayer3.start()




