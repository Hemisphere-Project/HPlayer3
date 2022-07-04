$( document ).ready(function()
{

    //////////////// HPLAYER3 ////////////////
    var hplayer3 = new HPlayer3({divlogger:true, controls:true})

    //////////////// PLAYER ////////////////
    hplayer3.registerPlayer( "#videoplayer", "player")

    /////////////// MEDIA LIST ///////////////
    hplayer3.files.media.getTree()
        .then( data => {
            console.log(data)
            data.fileTree.forEach((item, i) => {
                if(item.type=='video') {
                    $('#videoplayer')[0].setAttribute('src', '/media/'+item.name)
                    $('#videoplayer')[0].currentTime = 0
                    $("#videoplayer")[0].play()
                    return
                }
            });
        })
    
    // LOOP
    $('#videoplayer').on('ended',function(){
        $('#videoplayer')[0].currentTime = 0
        $("#videoplayer")[0].play()
    });


});