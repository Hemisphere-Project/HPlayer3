//
// CARROUSEL: flickity logic (apply once all Carrousel are created)
//

function carrouselify( opts ) 
{
    var carousel = $('.carrouselDiv').flickity({
        // options
        cellAlign: 'left',
        pageDots: false,
        contain: true,
        selectedAttraction: 0.2,
        friction: 0.8,
        dragThreshold: 1
        // fade: true
    });

    carousel.on('change.flickity', function(event, index) 
    {
        console.log('change', index)
        // VIDEO pause
        $('video').each((i, d) => {
            d.pause()
            d.currentTime = 0
        })
    });

    carousel.on('settle.flickity', function(event, index) 
    {
        console.log('settle', index)
        // VIDEO playback
        $('.carousel-cell.is-selected').find('video').each((i, d) => {
            if($(d).is(":visible")) d.play()
        })
    });
    $('.carrouselDiv').hide()

    // CLOSE button
    $('.carrouselDiv').each((i, d) => {
        let close = $('<div class="closeDiv">').appendTo(d)
        close.on('click', () => {
            // Rewind Carrousel
            $('.carrouselDiv').flickity('select', 0)

            // Video stop
            $('video').each((i, d) => {
                d.pause()
                d.currentTime = 0
            })
        })
    })

    // Close on incativity
    if (opts.inactivity) 
        hplayer3.inactivity( opts.inactivity, ()=> { 
            console.log("Inactivity detected");
            $('.closeDiv').trigger('click')
        })
    

    ///// SOLO CARROUSSEL : show it !
    if ( $('.carrouselDiv').length == 1 ) 
    {
        $('.carrouselDiv').show().addClass('is-active').flickity('select', 0)
        $('.carousel-cell.is-selected').find('video').each((i, d) => d.play())

        $('.closeDiv').hide() // hide close button
    }

    ///// MULTIPLE CARROUSSEL : add close button to each carrouselDiv
    else 
    {
        // add close button to each carrouselDiv
        $('.carrouselDiv').each((i, d) => {
            let close = $('<div class="closeDiv">').appendTo(d)
            close.on('click', () => {
                // HIDE and reset
                $('.carrouselDiv').hide().removeClass('is-active').flickity('select', 0)

                // VIDEO stop
                $('video').each((i, d) => {
                    d.pause()
                    d.currentTime = 0
                })

                // SHOW menu
                $('.menuCarrousel').fadeIn(500)
            })
        })

        // Close on incativity
        if (opts.inactivity) 
            hplayer3.inactivity( opts.inactivity, ()=> { 
                console.log("Inactivity detected");
                $('.closeDiv').trigger('click')
            })

    }
}


//
// CARROUSEL: create a slide show of media files 
//
function carrouselFolder( hplayer3, div, opts )      // div = destination / folder = media sub-folder
{
    let options = {...{
    // default options
    folder: '',
    index: 0,
    lang: 'fr',
    }, ...opts}

    return new Promise((resolve, reject) => 
    {
        // Get media list
        hplayer3.files.media.getTree(options.folder)
            .catch( error => {
                console.warn(error) 
                reject(error)
            })
            .then( data => {

                var mainDiv = $(div)

                //// MEDIA only
                let images = data.fileTree.filter((item) => item.type === 'image' || item.type === 'video')

                let carrouselDiv = $('<div class="carrouselDiv carrouselDiv-'+options.index+' carrouselDiv-'+options.lang+'">').appendTo(mainDiv)

                // Fill with media
                for (let file of images) 
                {
                    if (file.type == 'image') {
                        let img = $('<img />').addClass("media").attr('src', '/media/' + file.path)
                        $('<div>').addClass('carousel-cell').append(img).appendTo(carrouselDiv)
                    } 
                    else if (file.type == 'video') 
                    {
                        // Video
                        let video = $('<video>').addClass("media")
                        $('<source>').attr('src', '/media/' + file.path).attr('type', 'video/mp4').appendTo(video)

                        // Progress bar
                        let progressbar = $('<div>').addClass('bar')
                        let progress = $('<div>').addClass('progress').append(progressbar)
                        $('<div>').addClass('carousel-cell').append(video).append(progress).appendTo(carrouselDiv)

                        video.on('ended', () => {
                            setTimeout(() => { $('.main-carousel.is-active').flickity('next') }, 300)
                        })

                        var lastTime = (new Date()).getTime();
                        video.on('timeupdate', () => {
                            var now = (new Date()).getTime()
                            const percent = (video[0].currentTime / video[0].duration) * 100
                            progressbar.finish()
                            progressbar.animate({ 'width': percent + '%' }, now - lastTime, 'linear')
                            lastTime = now
                        });
                    }
                }
        
                

                resolve(mainDiv)
            })
    })

}