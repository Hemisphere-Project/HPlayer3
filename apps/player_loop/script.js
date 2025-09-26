$( document ).ready(function()
{

    //////////////// HPLAYER3 ////////////////
    var hplayer3 = new HPlayer3({divlogger:false, controls:true})

    //////////////// PLAYER ////////////////
    var player = hplayer3.videoPlayer( "#videoplayer", { closer: false, scrollbar: false, loop: true })

    /////////////// MEDIA LIST ///////////////
    let videolist = []
    let videoindex = -1

    hplayer3.files.media.getTree()
        .then( data => {
            console.log(data)

            videolist = data.fileTree.filter((item) => (item.type === 'video') || (item.type === 'audio'))
            if (videolist.length > 0) {
                console.log(videolist)
                videoindex = 0
                player.play('/media'+videolist[0].path)
            }
        })
    
    // LOOP
    player.on('ended',() => {
        videoindex++
        if (videoindex >= videolist.length) videoindex = 0
        player.play('/media'+videolist[videoindex].path)
    });

});
