
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

  // AUDIOSELECT
  $('input[type=radio][name=audioselect]').change(function() {
    hplayer3.system.audioselect(this.value).then(data => {
      refreshConfig()
    })
  })

  // VIDEOFLIP
  $('#videoflip').change(function() {
    hplayer3.system.videoflip($('#videoflip').is(':checked')).then(data => {
      refreshConfig()
    })
  })

  // VIDEOROTATE
  $('#videorotate').change(function() {
    hplayer3.system.videorotate(this.value).then(data => {
      refreshConfig()
    })
  })

  // PLAYERTYPE
  // $('input[type=radio][name=playerType]').change(function(){
  //   var playerType = this.value
  //   $('.option').filter(":visible").fadeOut(200,function(){
  //     $('.'+playerType).fadeIn(200)
  //   })
  // })
  // PLAYERMODULES
  $('.moduleSelect').change(function(){
    var module = $(this).val()
    if($(this).is(':checked')){ $('.'+module).fadeIn(100) }
    else{ $('.'+module).fadeOut(100) }
  })

  // INFOS
  $('.infosOpener').click(function(){
    var infosDiv = $(this).attr('href')
    $('.'+infosDiv).fadeIn(100)
  })
  $('.overlayCloser').click(function(){
    $('.overlay').fadeOut(100)
  })
  // $('.overlay').click(function(e){
  //   $('.overlay').fadeOut(100)
  // })
  $('body').on("keydown", function(e) {
    if(e.keyCode == 27){
      $('.overlay').fadeOut(100)
    }
  });

  // REBOOT
  $('.reboot').click(function(){
    hplayer3.system.reboot()
    $('.overlayReboot').fadeIn(200)
    setTimeout(function(){
      location.reload()
    }, 20000)
  })
  // GIT PULL
  $('.git').click(function(){
    hplayer3.system.gitpull()
    $('.overlayGit').fadeIn(200)
    setTimeout(function(){
      location.reload()
    }, 20000)
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

  //////////////// HPLAYER3 ////////////////

  var hplayer3 = new HPlayer3()

  hplayer3.on('connect', ()=>{
    $('.connectionInfo').removeClass('disconnected').addClass('connected')

    // Tree
    refreshTree()

    // Config
    refreshConfig()

  })

  hplayer3.on('disconnect', ()=>{
    $('.connectionInfo').removeClass('connected').addClass('disconnected')
  })


  //////////////// SYSTEM CONFIG ////////////////
  function refreshConfig()
  {
    hplayer3.system.getConf()
      .catch(data => {
        console.warn(data)
      })
      .then(data => {
        console.log('APPLY CONFIG')
        console.log(data)

        // AUDIOSELECT
        $('input:radio[name="audioselect"]').prop('checked', false);
        $('input:radio[name="audioselect"]').filter('[value="'+data.audioselect+'"]').prop('checked', true);

        // VIDEOFLIP
        $('#videoflip').prop('checked', data.videoflip);

        // VIDEO ROTATE
        $('#videorotate').val(data.videorotate);

      })
  }


  //////////////// FILES ////////////////

  var fileTree = new Array()
  var files = new Array()

  function refreshTree() {
    hplayer3.media.getTree()
      .catch(data => {
        console.warn(data)
      })
      .then(data => {
        console.log('BUILDING FILES')
        fileTree = data.fileTree
        console.log(data)
        $('.browser').empty()
        parseFileTree(fileTree)
        if (activeFolder == undefined) activeFolder = data.path
        baseFolder = data.path
        showActiveFolder()
      })
  }

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


  //////////////// FILE ////////////////
  function file(item){


    var that = this
    this.name = item.name
    this.raw_name = item.raw_name
    this.path = item.fullpath
    this.parent = this.path.substring(0, this.path.lastIndexOf('/'))+'/'
    this.mediaSubfolder = this.parent.split('/media/')[1]
    this.type = item.type



    // DOM
    this.preview = $('<div class="file ' + this.parent + '" path=' + this.path + '></div>').appendTo($(".browser"))
    this.fileName = $('<div class="fileName editableText">' + this.name + '</div>').appendTo(this.preview)
    this.controls = $('<div class="fileFunctions"></div>').appendTo(this.preview)
    this.delete = $('<img class="btn cross small" src="img/cross.svg">').appendTo(this.controls)

    // DL
    if(this.type!='folder'){
      this.download =  $('<a><img class="btn dl" src="img/download.svg"></a>').prependTo(this.controls)
      this.download.attr({target: '_blank', href: '/media/'+this.mediaSubfolder+this.name, download: this.name})
    }

    // SPECIFIC ICONS
    // MEDIA
    if((this.type=='audio')||(this.type=='video')){
      this.play =  $('<img class="btn add small" src="img/play2.svg">').prependTo(this.preview)
      this.play.click(function(){
        console.log('PLAY ME')
        $('.selectedMedia').html(that.name)
      })
    }
    // FOLDER
    else if(this.type=='folder'){
      this.opener = $('<img class="btn open" src="img/arrow_right.svg">').prependTo(this.preview)
      this.opener.click(function(){
        console.log('OPEN FOLDER')
        activeFolder = that.path+'/'
        showActiveFolder()
      })
    }
    // FILE
    else{
      this.icon = $('<img class="small open" src="img/file.svg">').prependTo(this.preview)
    }




    // DELETE
    this.delete.click(function() {
      console.log('DELETE ME', that.path)
      // socket.emit('delete', item)
      hplayer3.media.delete(that.path)
        .then(data => {
          console.log('DELETE: OK')
          refreshTree()
        })
        .catch(data => {
          console.warn('DELETE: FAIL', data)
        })

      that.preview.remove()
      files.splice(files.findIndex(function(item) {
        return item.name === that.name;
      }), 1);
    })

    // EDIT
    editableText($(this.fileName)[0])
    this.nameChange = function(newname) {
        console.log('NAME CHANGE')
        // socket.emit('rename', item, that.parent+newname)
        hplayer3.media.rename(that.path, that.parent + newname)
          .then(data => {
            console.log('RENAME: OK')
            refreshTree()
          })  .catch( data => { console.warn('RENAME: FAIL', data) })
    }

    // if(this.type=='folder'){
    //   this.opener.click(function(){
    //     console.log('OPEN FOLDER')
    //     activeFolder = that.path+'/'
    //     showActiveFolder()
    //   })
    // }



  }

  /////////////// FOLDER ///////////////
  $('.addFolder').click(function(){
    hplayer3.media.addFolder(activeFolder+'Nouveau_dossier')
      .then(data => {
        console.log('ADDED: OK')
        refreshTree()
      })
      .catch(data => {
        console.warn('ADDED: FAIL', data)
      })
  })

  /////////////// UPLOAD ///////////////


  // define URL and for element
  const url = "/upload-files"
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
    formData.append("destination", activeFolder)
    $('#progressBar').removeClass('invisible').addClass('visible')
    // post form data
    const xhr = new XMLHttpRequest()
    // response
    xhr.onload = () => {
      // console.log(xhr)
      $('#progressBar').removeClass('visible').addClass('invisible')
      document.querySelector('[name=fileInput]').value='';
      console.log('Upload OK')
      refreshTree()
    }
    // error
    xhr.onerror = (err) => {
      $('#progressBar').removeClass('visible').addClass('invisible')
      console.warn('Upload error', err)
    }
    xhr.upload.onprogress = (event) => {
      var percent = (event.loaded / event.total)*100
      $('#progressBar').find('.faderFiller').css('width', percent+'%')
    }
    // create and send the reqeust
    xhr.open('POST', url)
    xhr.send(formData)
  }

  /////////////// CODE EDITOR ///////////////

  var codeEditor = CodeMirror($('.codeEditor')[0], {
    value: "$('.editCSS').click(function(){$('.overlayEditor').fadeIn(100)$.get('/conf/complement.css', function(txt) \n{codeEditor.setValue(txt)codeEditor.setSize();codeEditor.refresh()}, 'text')})",
    theme: "moxer",
    mode:  "css"

    // theme: 'default',
  });

  $('.editCSS').click(function(){
    $('.overlayEditor').fadeIn(100)
    $.get('/conf/complement.css', function(txt) {
      codeEditor.setValue(txt)
      codeEditor.setSize("100%", "50vh")
      codeEditor.refresh()
    }, 'text')
  })

  $('.saveCode').click(function(){
    var content = codeEditor.getValue()

    hplayer3.conf.writeFile('/complement.css', content ).then(data => {
      console.log('ok')
      $('.overlayEditor').fadeOut(100)
    })

  })







});
