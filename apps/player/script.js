// LOG
//
if (typeof console  != "undefined") 
    if (typeof console.log != 'undefined')
        console.olog = console.log;
    else
        console.olog = function() {};

console.log = function(...m) {
    message = ''
    for (let i=0; i<m.length; i++) message += ' '+m[i]
    console.olog(message);
    $('#log').append(message + '<br />');

    var elem = document.getElementById('log');
    elem.scrollTop = elem.scrollHeight;
};
print = console.error = console.debug = console.info =  console.log

// INFO
//
// CTRLS: info
$('#ctrls').html(" \
    .:: CTRL ::. <br />\
    R: reload page <br />\
    P: play/pause <br />\
    A: skip to 00:00:00 <br />\
    M: mute/unmute <br />\
    <br />\
    .:: VIEW ::. <br />\
    S: simple view <br />\
    X: mapping view <br />\
    <br /> \
    .:: MAPPING ::. <br />\
    dbl-click: select corner  <br />\
    click: deselect corner  <br />\
    mouse-move: move corner  <br />\
")



var endedWatcher = null

function controls(video) {

    
    // VIDEO
    //
    video.loop = false
    video.mute = false

    video.addEventListener('loadedmetadata', function () {
        console.log('[VIDEO] loaded');
        $("#time").html('Video: '+video.videoWidth+'x'+video.videoHeight)
        video.play()
    }, false);

    //  paused and playing events to control buttons
    video.addEventListener("pause", function () {
        console.log('[VIDEO] paused');
    }, false);

    video.addEventListener("playing", function () {
        console.log('[VIDEO] playing');
    }, false);

    video.addEventListener("ended", function () {
        // BROKEN ! use hard fix instead
        console.log('[VIDEO] ended');
    }, false);

    video.addEventListener("stalled", function () {
        console.log('[VIDEO] stalled');
    }, false);

    video.addEventListener("timeupdate", function () {
        // console.log('[VIDEO] time', video.currentTime, video.duration, video.paused);
    }, false);


    // ENDED HARDFIX WATCHER
    //
    if (endedWatcher) clearInterval(endedWatcher)
    endedWatcher = setInterval(()=>{
        if ((video.duration-video.currentTime < 0.05 && !video.paused)) 
        {
            console.log('[VIDEO] ended (hard fix)')
            video.currentTime = 0;
        }
    }, 10)

    // setInterval(()=>{
    //     console.log ( video.ended, video.duration-video.currentTime, video.paused) 
    // }, 2000)

    // KEYPRESS
    //
    $(window).keypress(function(e) {
                
        var key = String.fromCharCode(e.which).toLowerCase();
        // print('>', key)

        // A : Refresh
        if(key == 'r') {
            location.reload()
        }

        // P : play
        if(key == 'p') {
            if (video.paused) video.play()
            else video.pause()
            console.log('Play/Pause: ' + (video.paused  ? 'pause' : 'play'))
        }

        // A : origin
        if(key == 'a') 
        {
            video.currentTime = 0;
            video.play()
            console.log('Origin')
        }

        // M : mute
        if(key == 'm') 
        {
            video.muted = ! video.muted
            console.log('Mute: ' + (video.muted))
        }

        // S : simple view
        if(key == 's') 
        {
            window.location = 'index.html';
        }

        // X : mapping view
        if(key == 'x') 
        {
            window.location = 'mapping.html';
        }
        
    })

    
}


// SOCKETIO
//
var socket = io();

socket.emit('get', 'media.tree', (data)=>{
    console.log(data)
})
