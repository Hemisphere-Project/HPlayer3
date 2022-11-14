//
// MEDIA GRID: create a grid of media thumbnails
//
function mediaGrid( hplayer3, dest, folder ) 
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
                let allFiles = data.fileTree
                let grid = $('<div class="mediagrid"></div>').appendTo(dest)

                // For each file
                allFiles.forEach((item, i) => 
                {
                    // VIDEO
                    if(item.type == 'video') {
                        let preview = $('<div class="item item-'+item.type+'" data-media="'+item.name+'"></div>').appendTo(grid)

                        // THUMBNAIL
                        let thumb = $('<div class="image_wrapper"></div>').appendTo(preview)
                        thumb.css('background-image', 'url(/assets/img/not_found.png)')
                        allFiles.forEach((file, i) => {
                            if((file.raw_name==item.raw_name)&&(file.type=='image')) 
                            {
                                let img = thumb.find('img')
                                thumb.css('background-image', 'url(/media/'+folder+'/'+file.name+')')
                            }
                        });

                        // DESCRIPTION
                        let title = item.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
                        let desc = $('<div class="infos"><div class="title">'+title+'</div><div class="subtitle">a movie file ...</div></div>').appendTo(preview)
                        const textExist = allFiles.some(file => ((file.raw_name === item.raw_name)&&(file.type === 'text')) );
                        if (textExist) {
                            $.get('/media/'+folder+'/'+item.raw_name +'.txt', (txt) => {
                                desc.empty()
                                desc.append(txt)
                            }, 'text')
                        }
                    }

                    // IMAGE
                    // TODO

                    // AUDIO
                    // TODO
                
                });

                resolve(grid)
            })
    })

}