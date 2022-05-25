
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

  // WIFI SSID
  $('#wifiSsid').change(function() {
    var newName = $('#wifiSsid > input').val()
    hplayer3.wifi.setName(newName).then(data => {
      refreshWifi()
    })
  })

  // WIFI PASS
  $('#wifiPass').change(function() {
    var newPass = $('#wifiPass > input').val()
    hplayer3.wifi.setPass(newPass).then(data => {
      refreshWifi()
    })
  })

  // INFOS
  $('.infosOpener').click(function(){
    var infosDiv = $(this).attr('href')
    $('.'+infosDiv).fadeIn(100)
  })
  $('.overlayCloser').click(function(){
    $('.overlay').fadeOut(100)
  })
  $('body').on("keydown", function(e) {
    if(e.keyCode == 27){
      $('.overlay').fadeOut(100)
    }
  });

  // REBOOT
  $('.reboot').click(function(){
    hplayer3.reboot()
    $('.overlayReboot').fadeIn(200)
    setTimeout(function(){
      location.reload()
    }, 20000)
  })
  // GIT PULL
  $('.git').click(function(){
    hplayer3.gitpull()
    $('.overlayGit').fadeIn(200)
    setTimeout(function(){
      location.reload()
    }, 20000)
  })

  // FADERS CLICK
  $('.faderContainer').click(function(e){
    var offset = $(this).offset()
    var relX = e.pageX - offset.left
    var percent = ( relX / $(this).width() )*100
    if (percent<5) percent = 0
    if (percent>95) percent = 100
    faderSet(this, percent, true)
  })

  // FADER SET
  function faderSet(el, percent, trigger) {
    // CSS
    $(el).find('.faderFiller').css('width', percent+'%')
    // VAL
    var unit = $(el).parent().attr('unit')
    if((unit=='%')||(unit=='ms')){
      var max = $(el).parent().attr('max')
      var val = percent * max/100
      $(el).parent().find('.faderDisplay').text(val.toString().split(".")[0]+unit)
      if (trigger)
        $(el).parent().find('.faderValue').val(Math.floor(val)).trigger('change')
    }
  }

  var activeFolder
  var baseFolder = '/data'

  //////////////////////////////////////////
  function refreshableField(div) {
    this.element = $(div)
    
    // PRIVATE
    this._getter = null                                 // Promise used to remote get value
    this._setter = null                                 // Promise used to remote set value
    this._getter_args = []
    this._setter_args = []
    this._value = function(el){ return el.val() }       // Default method to obtain value from element => can be overwriten with value(clbck)
    this._update = function(el, data){ el.val(data) }   // Default method to set value to element     => can be overwriten with update(clbck)

    // PUBLIC
    this.getter = function(src, ...args) {this._getter = src; this._getter_args=args; return this}
    this.setter = function(dest, ...args) {this._setter = dest; this._setter_args=args; return this}
    this.value = function(clbck) {this._value = clbck; return this}
    this.update = function(clbck) {this._update = clbck; return this}

    // INTERNAL
    this.refresh = function() {
      this._getter(...this._getter_args).then((data) => {
        // console.log('getter',  data)
        this.element.off('change')
        this._update(this.element, data)
        this.element.on('change', ()=>{
            let value = this._value(this.element)
            // console.log('setter ', value)
            this._setter(...this._setter_args, value).then(()=>{this.refresh()})
        })
      })
    }
    return this
  } 

  //////////////// HPLAYER3 ////////////////

  var hplayer3 = new HPlayer3()

  hplayer3.on('connect', ()=>{

    // Connect status
    $('.connectionInfo').removeClass('disconnected').addClass('connected')

    // Tree
    refreshMedia()

    // Wifi
    refreshWifi()

  })

  hplayer3.on('disconnect', ()=>
  {
    // Connect status
    $('.connectionInfo').removeClass('connected').addClass('disconnected')
  })
  

  //////////////// REFRESHABLE FIELDS ////////////////
  
  // MODULES LIST
  hplayer3.getAvailableModules()
    .then(data => {

      // BUILD LIST
      $('#sectionmodules').empty();
      $('#sectionmodules').append(`<div class="title_small">MODULES</div>`)
      for(let mod of data) {
        $('#sectionmodules').append(`<input class="moduleSelect" type="checkbox" name="module${mod}" value="${mod}">`)
        $('#sectionmodules').append(`<label for="module${mod}">${upperWord(mod)}</label><br>`)
      }

      // MODULE
      for(let mod of data)
        new refreshableField(`input[name=module${mod}]`)
          .getter(hplayer3.getModuleState, mod)
          .setter(hplayer3.setModuleState, mod)
          .value( (el)=>{ return el.is(':checked') })
          .update( (el, data)=>{
            el.prop('checked', data);
            if(data) $('.'+el.val()).fadeIn(100)
            else $('.'+el.val()).fadeOut(100)
          })
          .refresh()

    })


  // THEME LIST
  hplayer3.files.apps.getTree()
  .then(data => 
  {
    // BUILD LIST
    $('#themeSelector').empty()
    data.fileTree.forEach((item, i) => {
      if(item.type =='folder'){
        console.log(item.name)
        $('#themeSelector').append('<option value="'+item.name+'" >'+item.name+'</option>')
      }
    });

    // THEME SELECTOR
    new refreshableField("#themeSelector")
      .getter(hplayer3.getTheme)
      .setter(hplayer3.setTheme)
      .update( (el, data)=>{
        el.val(data)
        $(".themeLink").attr('href', '/'+data)
      })
      .refresh()
  })
  

  // VIDEOFLIP
  new refreshableField('#videoflip')
    .getter(hplayer3.getVideoflip)
    .setter(hplayer3.setVideoflip)
    .value( (el)=>{ return el.is(':checked') })
    .update( (el, data)=>{
      el.prop('checked', data);
    })
    .refresh()

    
  // VIDEO ROTATE
  new refreshableField('#videorotate')
    .getter(hplayer3.getVideorotate)
    .setter(hplayer3.setVideorotate)
    .refresh()


  // AUDIO VOLUME
  new refreshableField('div[name=audiovolume] > .faderValue')
    .getter(hplayer3.audio.getVolume)
    .setter(hplayer3.audio.setVolume)
    .update( (el, data)=>{
      faderSet('div[name=audiovolume] > .faderContainer', data)
    })
    .refresh()


  // AUDIO OUT LIST
  hplayer3.audio.listOuputs()
    .then(data => {

      // BUILD LIST
      $('#subsectionaudioout').empty();
      for(let out of data) {
        $('#subsectionaudioout').append(`<input type="radio" name="audioout" value="${out}">`)
        $('#subsectionaudioout').append(`<label for="system">${upperWord(out)}</label><br />`)
      }

      // AUDIO OUT 
      new refreshableField('input:radio[name="audioout"]')
        .getter(hplayer3.audio.getOutput)
        .setter(hplayer3.audio.setOutput)
        .update( (el, data)=>{
          el.prop('checked', false);
          el.filter('[value="'+data+'"]').prop('checked', true);
        })
        .refresh()

    })

  //////////////// WIFI CONFIG ////////////////
  function refreshWifi()
  {
    hplayer3.wifi.getName()
      .then(data => {
        $('.deviceName').html(data);
      })

    hplayer3.wifi.getPass()
      .then(data => {
        $('.devicePassword').html(data);
      })

    hplayer3.wifi.isConfigurable()
      .then(data => {
        if(!data) $('#sectionwifi').hide()
      })    
  }



  //////////////// FILES ////////////////

  var fileTree = new Array()
  var files = new Array()

  function refreshMedia() 
  {

    // MEDIA FILES
    hplayer3.files.media.getTree()
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
      hplayer3.files.media.delete(that.path)
        .then(data => {
          console.log('DELETE: OK')
          refreshMedia()
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
        hplayer3.files.media.rename(that.path, that.parent + newname)
          .then(data => {
            console.log('RENAME: OK')
            refreshMedia()
          })  .catch( data => { console.warn('RENAME: FAIL', data) })
    }



  }

  /////////////// FOLDER ///////////////
  $('.addFolder').click(function(){
    hplayer3.files.media.addFolder(activeFolder+'Nouveau_dossier')
      .then(data => {
        console.log('ADDED: OK')
        refreshMedia()
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
      refreshMedia()
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
  var editedFile = ''
  var codeEditor = CodeMirror($('.codeEditor')[0], {
    value: "",
    theme: "moxer",
    mode:  "css"
  });

  $('.editCode').click(function(){
    editedFile = $(this).attr('file')
    $('.overlayEditor').fadeIn(100)
    $.get('/conf/'+editedFile, function(txt) {
      codeEditor.setValue(txt)
      codeEditor.setSize("100%", "50vh")
      codeEditor.refresh()
    }, 'text')
  })

  $('.saveCode').click(function(){
    var content = codeEditor.getValue()
    hplayer3.conf.writeFile('/'+editedFile, content ).then(data => {
      $('.overlayEditor').fadeOut(100)
    })

  })







});
