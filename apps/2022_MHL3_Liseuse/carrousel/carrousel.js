//
// CARROUSEL: create a slide show of media files
//
function mediaCarrousel( hplayer3, div, opts ) 
{
    let options = {...{
    // default options
    folder: '',
    types: [],  // 'video', 'image', 'audio', 'pdf'
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

                //// CLEAN
                var mainDiv = $(div)
                mainDiv.empty()

                //// LOAD FILES
                let allFiles = data.fileTree
                // console.log(data.fileTree)

                //// FOLDERS
                let folders = allFiles.filter((item) => item.type === 'folder')

                // sort folders by name
                folders.sort((a, b) => {
                    if (a.name < b.name) return -1
                    if (a.name > b.name) return 1
                    return 0
                })

                //// MENU 
                let languages = ['FR', 'EN', 'ES', 'DE']
                let menu = {}
                let index = 0
                folders.forEach((item) => 
                {
                    if (!item.children.length) return

                    // search for language in folder name
                    let lang = languages.find((lang) => item.name.includes(lang))
                    if (!lang) lang = 'NC'
                    if (!menu[lang]) menu[lang] = []
                    item.lang = lang
                    item.index = index
                    menu[lang].push(item)
                    index++
                })


                //// PAGE MENU
                let menuDiv = $('<div class="menuCarrousel">').appendTo(mainDiv)
                let langDiv = $('<div class="langCarrousel">').appendTo(menuDiv)
                for (let lang in menu) 
                {
                    let langButton = $('<button class="lang-button">'+lang+'</button>').appendTo(langDiv)
                    langButton.click(() => {
                        $('.menuList').hide()
                        $('.menuList-'+lang).show()
                    })

                    let menuList = $('<ul class="menuList menuList-'+lang+'">').appendTo(menuDiv)
                    for (let folder of menu[lang]) 
                    {
                        let li = $('<li class="menuFolder">').appendTo(menuList)
                        let img = $('<img class="imgFolder" alt="'+folder.name+'" />').attr('src', '/media/'+folder.name+'.jpg').appendTo(li)
                        img.click(() => {
                            $('.carrouselDiv').hide().removeClass('is-active')
                            $('.carrouselDiv-'+folder.index).show().addClass('is-active').flickity('select', 0)
                            console.log('selecting folder', folder.index, folder.name)
                            menuDiv.fadeOut(700)
                            $('.carousel-cell.is-selected').find('video').each((i, d) => {
                                d.play()
                            })
                        })    
                    }
                }
                // show first menu
                $('.menuList').hide()
                $('.menuList-'+Object.keys(menu)[0]).show()
                

                ///// CARROUSELS
                for (let lang in menu) 
                    for (let folder of menu[lang]) 
                    {   
                        let carrouselDiv = $('<div class="carrouselDiv carrouselDiv-'+folder.index+' carrouselDiv-'+folder.lang+'">').appendTo(mainDiv)

                        // Fill with media
                        for (let file of folder.children) 
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

                    }                
                
                //// FLICKITY
                ////

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

                ///// CLOSE

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


                resolve(mainDiv)
            })
    })

}