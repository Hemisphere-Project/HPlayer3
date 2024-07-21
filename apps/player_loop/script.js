$( document ).ready(function()
{

    //////////////// HPLAYER3 ////////////////
    var hplayer3 = new HPlayer3({divlogger:false, controls:true})

    //////////////// PLAYER ////////////////
    var player = hplayer3.videoPlayer( "#videoplayer", { closer: false, scrollbar: false })

    /////////////// MEDIA LIST ///////////////
    let video
    hplayer3.files.media.getTree()
        .then( data => {
            console.log(data)

            video = data.fileTree.filter((item) => (item.type === 'video') || (item.type === 'audio'))[0]
            player.play('/media'+video.path)
        })
    
    // LOOP
    player.on('ended',() => {
        player.play('/media'+video.path)
    });

});
