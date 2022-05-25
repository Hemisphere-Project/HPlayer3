const Module = require('./module.js')
const express = require('express')
const http = require('http')
const fileUpload = require('express-fileupload');
const fspath = require('path')
const fs = require('fs')

class Webserver extends Module {

    constructor(hp3)
    {
      super('webserver', hp3)

      this.requires('files')
    }


    // RUN when config is ready
    //
    init() 
    {
      
      // CONFIG
      //
      this.port = this.getConf('webserver.port', 5000)
      this.temp = this.getConf('webserver.tmp',  "/tmp")
      
      this.log('starting on *:'+this.port)

      //
      // EXPRESS Server
      //
      this.app = express()

      // DEFAULT index
      this.app.get('/', function(req, res) {
        // res.set('Content-Type', 'text/html');
        // res.send(Buffer.from('hp3'));
        res.redirect(307, '/controller');
      });

      // WEBAPPS
      this.app.use(express.static(this.hp3.files.apps.path))

      // MEDIAS
      if (this.hp3.files.media)
        this.app.use('/media', express.static(this.hp3.files.media.path))

      // CONF
      if (this.hp3.files.conf)
        this.app.use('/conf', express.static(this.hp3.files.conf.path))

      // HTTP bind
      this.http = http.createServer(this.app)
      this.http.listen(this.port, () => {
        // this.log('listening on *:', this.port)
      })


      // FILE UPLOAD
      fs.mkdirSync(this.temp, { recursive: true })
      this.app.use(fileUpload({
        createParentPath: true,
        limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10gb
        abortOnLimit: true,
        useTempFiles : true,
        tempFileDir : this.temp
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
            this.hp3.files.media.buildTree()

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
