
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

  ////////////////// AUTO FIELD: automatted setter / getter with hplayer3 ////////////////////////

  function autoField(div)
  {
    this.element = $(div)   // NEEDED: div is the base selector which is watched for change (which triggers the setter)

    // PRIVATE
    this._getter = null                       // INFO: Promise used to remote get value
    this._setter = null                       // INFO: Promise used to remote set value
    this._getter_args = []
    this._setter_args = []
    this._value = function(el){               // INFO: Default method to obtain value from element => can be overwriten with value(clbck)
      if (el.is(':checkbox')) return el.is(':checked')
      else if (el.is(':radio')) return el.filter(':checked').val()
      else return el.val()
    }
    this._update = function(el, data){        // INFO: Default method to set value to element     => can be overwriten with update(clbck)
      if (el.is(':checkbox')) el.prop('checked', data);
      else if (el.is(':radio')) { el.prop('checked', false);  el.filter('[value="'+data+'"]').prop('checked', true);  }
      else el.val(data)
    }

    // PUBLIC
    this.getter = function(src, ...args) {this._getter = src; this._getter_args=args; return this}    // NEEDED: define the method call, and optional args, to obtain field value
    this.setter = function(dest, ...args) {this._setter = dest; this._setter_args=args; return this}  // NEEDED: define method call, and optional args, to set field value
    this.value = function(clbck) {this._value = clbck; return this}                                   // OPTIONAL: custom way to obtain the field value
    this.update = function(clbck) {this._update = clbck; return this}                                 // OPTIONAL: custom way to update the field when new value is received from server

    // INTERNAL
    this.refresh = function() {                                                                       // NEEDED: call it at least one time to populate field with server value (can't be automated yet)
      this._getter(...this._getter_args).then((data) => {
        // console.log('getter',  data)
        this.element.off('change')
        this._update(this.element, data)
        this.element.on('change', ()=>{
            let value = this._value(this.element)
            // console.log('setter ', this.element, value)
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
  })

  hplayer3.on('disconnect', ()=>
  {
    // Connect status
    $('.connectionInfo').removeClass('connected').addClass('disconnected')
  })


  //////////////// MODULES LIST ////////////////

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
        new autoField(`input[name=module${mod}]`)
          .getter(hplayer3.getModuleState, mod)
          .setter(hplayer3.setModuleState, mod)
          .update( (el, data)=>{
            el.prop('checked', data);
            if(data) $('.'+el.val()).fadeIn(100)
            else $('.'+el.val()).fadeOut(100)
          })
          .refresh()

    })


  //////////////// KIOSK CONFIG ////////////////

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
    new autoField("#themeSelector")
      .getter(hplayer3.kiosk.getTheme)
      .setter(hplayer3.kiosk.setTheme)
      .update( (el, data)=>{
        el.val(data)
        $(".themeLink").attr('href', '/'+data)
      })
      .refresh()
  })


  // VIDEOFLIP
  new autoField('#videoflip')
    .getter(hplayer3.kiosk.getVideoflip)
    .setter(hplayer3.kiosk.setVideoflip)
    .refresh()


  // VIDEO ROTATE
  new autoField('#videorotate')
    .getter(hplayer3.kiosk.getVideorotate)
    .setter(hplayer3.kiosk.setVideorotate)
    .refresh()


  //////////////// AUDIO CONFIG ////////////////

  // AUDIO VOLUME
  new autoField('div[name=audiovolume] > .faderValue')
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
      new autoField('input:radio[name="audioout"]')
        .getter(hplayer3.audio.getOutput)
        .setter(hplayer3.audio.setOutput)
        .refresh()

    })

  //////////////// WIFI CONFIG ////////////////
  new autoField('#wifiSsid')
    .getter(hplayer3.wifi.getName)
    .setter(hplayer3.wifi.setName)
    .value( (el)=>{
      return el.find('input').val()
    })
    .update( (el, data) => $('.deviceName').html(data) )
    .refresh()

  new autoField('#wifiPass')
    .getter(hplayer3.wifi.getPass)
    .setter(hplayer3.wifi.setPass)
    .value( (el)=>{
      return el.find('input').val()
    })
    .update( (el, data) => $('.devicePassword').html(data) )
    .refresh()

  // APPLY WIFI
  $('.applywifi').click(function(){
    hplayer3.wifi.apply()
  })

  // HIDE SECTION
  hplayer3.wifi.isConfigurable()
    .then(data => {
      if(!data) $('#sectionwifi').hide()
    })



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

    editedLanguage = $(this).attr('language')
    codeEditor.setOption("mode", editedLanguage)

    $.get('/conf/'+editedFile, function(txt) {
      codeEditor.setValue(txt)
      codeEditor.setSize("100%", "60vh")
      codeEditor.refresh()
    }, 'text')
  })

  $('.saveCode').click(function(){
    var content = codeEditor.getValue()
    hplayer3.files.conf.writeFile('/'+editedFile, content ).then(data => {
      $('.overlayEditor').fadeOut(100)
    })

  })








});
