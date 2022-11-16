//
// CARROUSEL: create a slide show of media files 
//
function carrouselFolder( hplayer3, dest, folder )   
{
    return new Promise((resolve, reject) => 
    {
        // Get media list
        hplayer3.files.media.getTree(folder)
            .catch( error => {
                console.warn(error) 
                reject(error)
            })
            .then( data => {

                // console.log(data)
                let carrouselDiv = $('<div class="carrousel">').appendTo(dest)

                // Video/Images only
                let images = data.fileTree.filter((item) => item.type === 'image' || item.type === 'video')

                // Fill with media
                let cellPlayers = []
                for (let file of images) 
                {
                    let player = null

                    if (file.type == 'image') {
                        let img = $('<img />').addClass("media").attr('src', '/media/' + file.path)
                        $('<div>').addClass('carousel-cell').append(img).appendTo(carrouselDiv)
                    } 
                    else if (file.type == 'video') 
                    {
                        let cell = $('<div>').addClass('carousel-cell').appendTo(carrouselDiv)
                        player = hplayer3.videoPlayer( cell, { closer: false, scrollbar: false, media: '/media/' +file.path } )

                        // Progress bar
                        let progress = $('<div>').addClass('progress').appendTo(cell)
                        let bar = $('<div>').addClass('bar').appendTo(progress)
                        let lastTime = 0

                        player.on("timeupdate", () => {
                            var now = (new Date()).getTime()
                            var percent = (player.video.currentTime / player.video.duration) * 100
                            bar.finish().animate({ 'width': percent + '%' }, now - lastTime, 'linear')
                            lastTime = now
                        })

                        player.on('stop', () => {
                            bar.finish().css({ 'width': '0%' })
                        })

                        // Next on end
                        player.on('ended', () => {
                            carrouselDiv.flickity('next')
                        })
                    }

                    cellPlayers.push(player)
                }
                
                // Flickity
                var carouselFlickity = carrouselDiv.flickity({
                    // options
                    cellAlign: 'left',
                    pageDots: false,
                    contain: true,
                    selectedAttraction: 0.37,
                    friction: 1,
                    draggable: false,
                    lazyLoad: 2,
                    // fade: true
                });
            
                carouselFlickity.on('change.flickity', function(event, index) 
                {
                    // console.log('change', index)                    
                    for (let p of cellPlayers) if (p) p.stop()
                });
            
                carouselFlickity.on('settle.flickity', function(event, index) 
                {
                    console.log('settle', index)
                    if (carouselFlickity.is(':visible'))
                        if (cellPlayers[index]) 
                            cellPlayers[index].play()
                });

                // SWIPE
                document.addEventListener('swipeleft', function(e) {
                    if (carouselFlickity.is(':visible'))
                        carouselFlickity.flickity('next')
                })
                document.addEventListener('swiperight', function(e) {
                    if (carouselFlickity.is(':visible'))
                        carouselFlickity.flickity('previous')
                })

                // CLOSE button
                $('<div class="carrousel-close-button">').appendTo(carrouselDiv)
                    .on('click', () => {
                        // Rewind Carrousel
                        carrouselDiv.flickity('select', 0)
                        for (let p of cellPlayers) if (p) p.stop()
                    })
                
                    
                resolve(carrouselDiv)
            })
    })

}