
var express = require('express')
var http = require('http')

class Webserver {

    // DEFAULT CONFIG 
    //
    config = { 
        hp3:  null,
        port:   5000, 
        apps:   './apps', 
        media:  null
    }

    constructor(config) 
    {
      // APPLY CONFIG 
      //
      for(var prop in config) this.config[prop]=config[prop];   

      //
      // EXPRESS Server
      //

      this.app = express()

      // DEFAULT index
      this.app.get('/', function(req, res) {
        res.set('Content-Type', 'text/html');
        res.send(Buffer.from('HPlayer3'));
      });

      // WEBAPPS
      this.app.use(express.static(this.config.apps))

      // MEDIAS
      if (this.config.media)
        this.app.use('/media', express.static(this.config.media))
      
      // HTTP bind
      this.http = http.createServer(this.app)
      this.http.listen(this.config.port, () => {
        this.log('listening on *:', this.config.port)
        })
        
    }

    log(...v) {
      console.log(`[webserver]`, ...v)
    }

}
  
module.exports = Webserver
