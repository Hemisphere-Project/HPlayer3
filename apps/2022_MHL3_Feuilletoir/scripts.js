//////////////// HPLAYER3 ////////////////
var hplayer3 = new HPlayer3({divlogger:true, controls:true})

///////// ON-SCREEN LOGGER /////////////
// hplayer3.logger.toggle(true)

///////// DISABLE ZOOM /////////////
hplayer3.disableZoom()

//////////////// MEDIA CARROUSEL ////////////////
carrouselFolder(hplayer3, "#page_carrousel", { folder: "" })
    .then(() => 
    { 
        carrouselify( {inactivity: 60} )
    })


////// TODO:
// - swipe threshold weird on touchscreens
// - hplayer3-ify video players