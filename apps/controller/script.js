
$(function() {

  // EDITABLE TEXT
  document.querySelectorAll(".editableText").forEach(function(div){
    editableText(div)
  });

  function editableText(div){
    div.ondblclick=function(){
      var val=this.innerHTML;
      var input=document.createElement("input");
      input.type = "text";
      input.value=val;
      var newval
      input.addEventListener("keydown", function(e) {
        if(e.keyCode == 13){
          newval=this.value;
          input.blur()
        }
        if(e.keyCode == 27){
          newval = val
          input.blur()
        }
      });
      input.onblur=function(){
        if(newval==undefined)newval=val
        input.parentNode.innerHTML=newval;
        if(newval!=val){
          // LINK WITH FILE OBJECT
          var editedPath = $(div).parent().attr('path')
          var i = files.findIndex(function(item){ return item.path === editedPath; })
          if(i!=-1) files[i].nameChange(newval)
        }

      }
      this.innerHTML="";
      this.appendChild(input);
      input.focus();
    }
  }



  // INFOS
  $('.infosOpener').click(function(){
    var infosDiv = $(this).attr('href')
    $('.'+infosDiv).fadeIn(100)
  })
  $('.overlayCloser').click(function(){
    $('.overlay').fadeOut(100)
  })
  $('.overlay').click(function(e){
    $('.overlay').fadeOut(100)
  })
  $('body').on("keydown", function(e) {
    if(e.keyCode == 27){
      $('.overlay').fadeOut(100)
    }
  });

  // REBOOT
  $('.reboot').click(function(){
    $('.overlayReboot').fadeIn(200)
  })

  // FADERS CTRL
  $('.faderContainer').click(function(e){
    var name = $(this).parent().attr('id')
    var offset = $(this).offset()
    var relX = e.pageX - offset.left
    var percent = ( relX / $(this).width() )*100
    if (percent<5) percent = 0
    if (percent>95) percent = 100
    // CSS
    $(this).find('.faderFiller').css('width', percent+'%')
    // VAL
    var unit = $(this).parent().attr('unit')
    if((unit=='%')||(unit=='ms')){
      var max = $(this).parent().attr('max')
      var val = percent * max/100
      $(this).parent().find('.faderValue').text(val.toString().split(".")[0]+unit)
    }

  })

  var activeFolder
  var baseFolder = '/data'

  //////////////// FILES ////////////////

  var fileTree = new Array()
  var files = new Array()
  
  //////////////// HPLAYER3 ////////////////

  var hplayer3 = new HPlayer3()

  hplayer3.media.getTree()
      .then( data => {
          console.log('BUILDING FILES')
          fileTree = data.fileTree
          $('.browser').empty()
          parseFileTree(fileTree)
          if(activeFolder==undefined) activeFolder = data.path
          baseFolder = data.path
          showActiveFolder()
        })

  function parseFileTree(folder){
    folder.forEach((item, i) => {
      files.push(new file(item))
      if(item.type=="folder") parseFileTree(item.children)
    });
  }

  //////////////// NAV ////////////////
  function showActiveFolder(){
    console.log('showing folder '+activeFolder)
    $('.file').hide()
    // $('.file .'+activeFolder).show()
    // don't work because of slashes / in jquery
    $(document.getElementsByClassName(activeFolder)).fadeIn(100);
    $('.folderPath').html(activeFolder)
    if(activeFolder==baseFolder) { $('.nav.back').hide() }
    else{ $('.nav.back').show() }
  }

  $('.nav.back').click(function(){
    activeFolder = activeFolder.substring(0, activeFolder.slice(0, -1).lastIndexOf('/'))+'/'
    showActiveFolder()
  })


  //////////////// VIDEO ////////////////
  function file(item){


    var that = this
    this.name = item.name
    this.raw_name = item.raw_name
    this.path = item.path
    this.parent = this.path.substring(0, this.path.lastIndexOf('/'))+'/'
    this.type = item.type


    // DOM
    this.preview = $('<div class="file '+this.parent+'" path='+this.path+'></div>').appendTo($(".browser"))
    this.fileName = $('<div class="fileName editableText">'+this.name+'</div>').appendTo(this.preview)
    this.controls = $('<div class="fileFunctions"></div>').appendTo(this.preview)
    this.delete =  $('<img class="btn cross" src="assets/img/cross.svg">').appendTo(this.controls)


    // PLAY
    if((this.type=='audio')||(this.type=='video')){
      this.play =  $('<img class="btn add" src="assets/img/add.svg">').prependTo(this.controls)
      this.play.click(function(){
        console.log('PLAY ME')
        $('.selectedMedia').html(that.name)
      })
    }

    // DELETE
    this.delete.click(function(){
      console.log('DELETE ME')
      
      // socket.emit('delete', item)
      hplayer3.media.delete(item)
          .then( data => { console.log('DELETE: OK') })
          .catch( data => { console.warn('DELETE: FAIL', data) })

      that.preview.remove()
      files.splice(files.findIndex(function(item){ return item.name === that.name; }), 1);
      socket.emit('filesRebuild')
    })

    // EDIT
    editableText($(this.fileName)[0])
    this.nameChange=function(newname){
      console.log('NAME CHANGE')

      // socket.emit('rename', item, that.parent+newname)
      hplayer3.media.rename(item, that.parent+newname)
          .then( data => { console.log('RENAME: OK') })
          .catch( data => { console.warn('RENAME: FAIL', data) })
          
      // not changing that.name & DOM (that.preview), rebuilding files instead --->
      socket.emit('filesRebuild')
    }

    if(this.type=='folder'){
      this.preview.click(function(){
        console.log('OPEN FOLDER')
        activeFolder = that.path+'/'
        showActiveFolder()
      })
    }

  }


  /////////////// UPLOAD ///////////////


  // define URL and for element
  const url = "http://localhost:5000/upload-files"
  const form = document.querySelector('form')

  // add event listener
  // form.addEventListener('submit', e => {
  //   e.preventDefault()
  //   submitUpload()
  // });

  // BTN replacing standard input type file
  $('.upload').click(function(){
    $("#fileInput").click()
  })
  // Listen -> Upload
  $('#fileInput').on('change',function(){
    submitUpload()
  })

  function submitUpload(){
    const files = document.querySelector('[name=fileInput]').files;
    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append("myfiles", file)
    })
    $('#progressBar').removeClass('invisible').addClass('visible')
    // post form data
    const xhr = new XMLHttpRequest()
    // response
    xhr.onload = () => {
      console.log(xhr.responseText)
      $('#progressBar').removeClass('visible').addClass('invisible')
      socket.emit('filesRebuild')
    }
    // error
    xhr.onerror = () => {
      $('#progressBar').removeClass('visible').addClass('invisible')
    }
    xhr.upload.onprogress = (event) => {
      var percent = (event.loaded / event.total)*100
      $('#progressBar').find('.faderFiller').css('width', percent+'%')
    }
    // create and send the reqeust
    xhr.open('POST', url)
    xhr.send(formData)
  }







});
