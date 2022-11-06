//////////////// HPLAYER3 ////////////////
var hplayer3 = new HPlayer3({divlogger:true, controls:true})

///////// ON-SCREEN LOGGER /////////////
// hplayer3.logger.toggle(true)

///////// DISABLE ZOOM /////////////
hplayer3.disableZoom()

///////// GO HOME WHEN INACTIVE /////////////
hplayer3.inactivity( 60, ()=> { 
    console.log("Inactivity detected");
    $('.closeDiv').trigger('click')
})

//////////////// MEDIA CARROUSEL ////////////////
mediaCarrousel(hplayer3, "#page_carrousel", { folder: "", types: ['video', 'image', 'pdf'] })
    .then((carrousel) => { })


////// TODO:
// - swipe threshold weird on touchscreens
// - hplayer3-ify video players