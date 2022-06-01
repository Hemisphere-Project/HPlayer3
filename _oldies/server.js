var express = require('express')
var app = express()
var http = require('http').createServer(app)
var io = require('socket.io')(http)

const { readdirSync } = require('fs')
const fs = require('fs')
const os = require('os')
const chokidar = require('chokidar')


/////////////////////// SERVERS ///////////////////////

// EXPRESS Server
app.use(express.static(__dirname))

// INDEX
app.get('/', function(req, res) {
  res.set('Content-Type', 'text/html');
  res.send(Buffer.from('<h2>HPlayer3</h2>'));
});

// MEDIAS path /files
app.use('/files', express.static(__dirname + '/media'))

// HTTP
http.listen(5000, () => {
  console.log('listening on *:5000')
})

// SOCKETIO
io.on('connection', (socket) => {
  // start
  console.log('client connected')
  socket.emit('files', {path:mediaPath, fileTree: makeFileTree(mediaPath)})
  // re ask fileTree
  socket.on('filesRebuild', () => {
    socket.emit('files', {path:mediaPath, fileTree: makeFileTree(mediaPath)})
  })
  // on disconnect
  socket.on('disconnect', () => {
    console.log('client disconnected')
  })
  // delete
  socket.on('delete', (item) => {
    fs.unlink(item.path,function(err){
      if (err) {
        console.log(err)
        return
      }
    })
  })
  // rename
  socket.on('rename', (item, newPath) => {
    fs.rename( item.path, newPath, function(err){
      if (err) {
        console.log(err)
        return
      }
    })

  })

})


/////////////////////// FILETREE ///////////////////////

var mediaPath = __dirname + '/media/'

// FILE TYPES
var excluded = ['._','.DS_Store']
var ext_images = ['jpg', 'jpeg', 'png', 'gif']
var ext_videos = ['mp4', 'webm', 'mov']
var ext_sounds = ['mp3', 'wav', 'aiff']
var ext_text = ['txt']

function isValid(name){
  var validity = true
  excluded.forEach((excluder) => { if(name.indexOf(excluder)>=0) validity=false })
  return validity
}
function getType(item){
  var type = 'unknown'
  if (ext_images.indexOf(item.name.replace(/.*\./, '').toLowerCase()) >= 0) type = 'image'
  if (ext_videos.indexOf(item.name.replace(/.*\./, '').toLowerCase()) >= 0) type = 'video'
  if (ext_sounds.indexOf(item.name.replace(/.*\./, '').toLowerCase()) >= 0) type = 'audio'
  if (ext_text.indexOf(item.name.replace(/.*\./, '').toLowerCase()) >= 0) type = 'text'
  if (item.isDirectory()) type = 'folder'
  return type
}

// MAKE
function makeFileTree(dir) {
  var fileTree=fs.readdirSync(dir, { withFileTypes: true })
    .filter(item => isValid(item.name))
    .map(item => ({
      name:item.name,
      raw_name: item.name.substring(0, item.name.lastIndexOf('.')),
      // path: dir+item.name+'/',
      path: dir+item.name,
      type: getType(item)
     }));
  fileTree.forEach(item => {
    if(item.type=='folder'){
      item.children = makeFileTree(item.path+'/')
    }
  });
  return fileTree
}


// console.log(JSON.stringify(makeFileTree(mediaPath), null, 2));


/////////////////////// UPLOAD ///////////////////////
const fileUpload = require('express-fileupload');

app.use(fileUpload({
  createParentPath: true
}));

app.post('/upload-files', async (req, res) => {
  try {
    if (!req.files) {
      res.send({
        status: false,
        message: 'No file uploaded'
      });
    } else {
      // if array - forEach move, if not, move
      if (Array.isArray(req.files.myfiles)) {
        req.files.myfiles.forEach((item, i) => {
          item.mv('./media/' + item.name);
        });
      } else {
        req.files.myfiles.mv('./media/' + req.files.myfiles.name);
      }
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
