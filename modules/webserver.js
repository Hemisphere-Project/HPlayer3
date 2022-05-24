const Module = require('./module.js')
const express = require('express')
const http = require('http')
const fileUpload = require('express-fileupload');
const fspath = require('path')

class Webserver extends Module {

    // DEFAULT CONFIG
    //
    config = {
        port:   5000,
        apps:   './apps'
    }

    constructor(hplayer3, config)
    {
      super('webserver', hplayer3)

      

      // APPLY CONFIG
      //
      for(var prop in config) this.config[prop]=config[prop];

      //
      // EXPRESS Server
      //
      this.app = express()

      // DEFAULT index
      this.app.get('/', function(req, res) {
        // res.set('Content-Type', 'text/html');
        // res.send(Buffer.from('HPlayer3'));
        res.redirect(307, '/controller');
      });

      // WEBAPPS
      this.app.use(express.static(this.config.apps))

      // MEDIAS
      if (this.hp3.files.media)
        this.app.use('/media', express.static(this.hp3.files.media.path))

      // CONF
      if (this.hp3.files.conf)
        this.app.use('/conf', express.static(this.hp3.files.conf.path))

      // HTTP bind
      this.http = http.createServer(this.app)
      this.http.listen(this.config.port, () => {
        this.log('listening on *:', this.config.port)
        })


      // FILE UPLOAD
      this.app.use(fileUpload({
        createParentPath: true
      }));

      this.app.post('/upload-files', async (req, res) => {

        try {
          if (!req.files) {
            res.send({
              status: false,
              message: 'No file uploaded'
            });
          } else {

            this.log('Uploading...')

            // if array - forEach move, if not, move
            if (Array.isArray(req.files.myfiles)) {
              req.files.myfiles.forEach((item, i) => {
                  item.mv( fspath.join(req.body.destination, item.name) );
              });
            } else {
              req.files.myfiles.mv( fspath.join(req.body.destination, req.files.myfiles.name) );
            }

            this.log('Upload OK')

            // refresh files
            this.config.media.buildTree()

            //return response
            res.send({
              status: true,
              message: 'Files are uploaded'
            });
          }
        } catch (err) {
          res.status(500).send(err);
        }
      });

    }

}

module.exports = Webserver
