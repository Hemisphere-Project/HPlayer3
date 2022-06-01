const vs = `
precision mediump float;

// those are the mandatory attributes that the lib sets
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

// those are mandatory uniforms that the lib sets and that contain our model view and projection matrix
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
    
uniform mat4 videoTextureMatrix;

// 4 corners (x,y) coordinates
uniform vec3 uPosA;
uniform vec3 uPosB;
uniform vec3 uPosC;
uniform vec3 uPosD;

// if you want to pass your vertex and texture coords to the fragment shader
varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

void main() 
{
  // Apply 4corner mapping based on uniforms
  vec3 vPos = aVertexPosition;
  vPos = uPosA * (vPos.x - 1.0)*(vPos.y + 1.0) / -4.0 
          + uPosB * (vPos.x + 1.0)*(vPos.y + 1.0) / 4.0 
          + uPosC * (vPos.x + 1.0)*(vPos.y - 1.0) / -4.0 
          + uPosD * (vPos.x - 1.0)*(vPos.y - 1.0) / 4.0;

  gl_Position = uPMatrix * uMVMatrix * vec4(vPos, 1.0);

  // varyings
    vTextureCoord = (videoTextureMatrix * vec4(aTextureCoord, 0.0, 1.0)).xy;
    vVertexPosition = aVertexPosition;
}
`;

const fs = `
precision mediump float;

// get our varyings
varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

// our texture sampler (this is the lib default name, but it could be changed)
uniform sampler2D videoTexture;

uniform vec3  uActiveCorner;
uniform float uDisplayRatio;

void main() 
{
  // apply video texture (with optional coloured corner for mapping situation)
  gl_FragColor = texture2D(videoTexture, vTextureCoord);

  // optional mapping couloured corner (x = corner select, y = ratio)
  if (uActiveCorner.x != 0.0) 
  {
        float distX = distance(uActiveCorner.x, vVertexPosition.x);
        float distY = distance(uActiveCorner.y, vVertexPosition.y);
        vec2  arrow = vec2(0.12, 0.12 / uDisplayRatio);

        if ( distY + arrow.x * distX / arrow.y < arrow.x ) 
                    gl_FragColor += vec4(1.0,0.0,0.0,0.2);
  }
}
`;

// ELEMENTS
//
var   videoEl = null;
const planeEl = document.getElementById("video-plane");
const containerEl = document.getElementById("canvas");

const video = document.createElement("video");
video.crossOrigin = "";
controls(video)

// RESIZER (max width or height while keeping ratio)
//
function resizePlane(videoEl) 
{
    // if (videoEl == null) return;
    
    // set Plane ratio from Video ratio
    var videoRatio = videoEl.videoWidth/videoEl.videoHeight
// videoRatio = 16.0/9
    // planeEl.style.setProperty('aspect-ratio', videoRatio);
    videoPlane.uniforms.displayRatio.value = videoRatio

    // set Plane Heigh/Width constraint based on canvas size
    var planeRatio = planeEl.clientWidth/planeEl.clientHeight
    var containerRatio = containerEl.clientWidth/containerEl.clientHeight

    if (videoRatio > containerRatio) {
        planeEl.style.width = Math.round(containerEl.clientWidth)+'px';
        planeEl.style.height = Math.round(containerEl.clientWidth/videoRatio)+'px';
    }
    else {
        planeEl.style.height = Math.round(containerEl.clientHeight)+'px';
        planeEl.style.width = Math.round(containerEl.clientHeight*videoRatio)+'px';
    }

    // console.log('video ratio', Math.round(videoRatio*1000)/1000, planeEl.style.width, planeEl.style.height) 

    videoPlane.resize()
}

window.addEventListener('resize', resizePlane);


// CURTAIN
//
const curtains = new Curtains({
    container: containerEl
});


// PLANE
//
const videoPlane = new Plane(curtains, planeEl, {
  vertexShader: vs,
  fragmentShader: fs,
  widthSegments: 20,
  heightSegments: 20,
  uniforms: {
    posA: {
      name: "uPosA",
      type: "3fv",
      value: [-1.0, 1.0, 0.0]
    },
    posB: {
      name: "uPosB",
      type: "3fv",
      value: [1.0, 1.0, 0.0]
    },
    posC: {
      name: "uPosC",
      type: "3fv",
      value: [1.0, -1.0, 0.0]
    },
    posD: {
      name: "uPosD",
      type: "3fv",
      value: [-1.0, -1.0, 0.0]
    },
    activeCorner: {
      name: "uActiveCorner",
      type: "3fv",
      value: [0.0, 0.0, 0.0]
    },
    displayRatio: {
      name: "uDisplayRatio",
      type: "1f",
      value: 1.7778
    }
  }
});

// RENDER
var lastTime = 0
videoPlane.onRender(() => {
  if (videoPlane.textures.length) 
  {
    // console.log(videoEl.currentTime, videoEl.duration);
  }
});

// TEXTURE 
//
const textureLoader = new TextureLoader(curtains);

textureLoader.loadVideo(
  video,
  {
    // texture options (we're only setting its sampler name here)
    sampler: "videoTexture"
  },
  (texture) => 
  {
    // texture has been successfully created, you can safely use it
    videoPlane.addTexture(texture);

    // adapt videoPlane size with ratio
    resizePlane(videoPlane.textures[0].source)
    console.log( "ready!" );

    // texture.source is the video el, do what you want with it!
    texture.source.play();
  },
  (image, error) => {
    // there has been an error while loading the image
  }
);

// MEDIA
var mediafile = "/media/gravity-2.webm"

function playMedia(src) 
{
  video.src = src
  video.load()
}

setTimeout(()=>{
  playMedia(mediafile)
}, 100)



// MAPPING
//

// MOUSE select corner
containerEl.ondblclick= (e) => 
{  
    // select corner
    if (e.clientX < planeEl.clientWidth/2) {
      if (e.clientY < planeEl.clientHeight/2) setActiveCorner('A')
      else setActiveCorner('D')
    }
    else {
      if (e.clientY < planeEl.clientHeight/2) setActiveCorner('B')
      else setActiveCorner('C')
    }
  
};

// MOUSE unselect corner
containerEl.onclick = (e) => 
{
  // unselect corner
  setActiveCorner()
};

// MOUSE move corner
containerEl.onmousemove = (e) => 
{
    // No corner selected -> exit
    if (getActiveCorner() == null) return;

    // video margin mouse pad 
    var wPad = (containerEl.clientWidth - planeEl.clientWidth)/2
    var hPad = (containerEl.clientHeight - planeEl.clientHeight)/2

    // calculate vertex coordinates -1 => 1
    var x = ( (e.clientX-wPad) / planeEl.clientWidth) * 2 - 1;
    var y = ( (e.clientY-hPad) / planeEl.clientHeight) * -2 + 1;

    getUniformPos().value = [x, y, 0.0];
};


// KEYBOARD mapping
var speed = 1.0;

$(window).keyup((e) => {
    speed = 1.0
})

$(window).keypress((e) => {

    var key = String.fromCharCode(e.which).toLowerCase();

    //  Select Corner
    if(key == '7')      setActiveCorner('A')
    else if(key == '9') setActiveCorner('B')
    else if(key == '3') setActiveCorner('C')
    else if(key == '1') setActiveCorner('D')
    else if(key == '5') setActiveCorner()

    // Get corner position uniform
    var uPos = getUniformPos()
    
    // No corner selected -> exit
    if (uPos == null) return
    
    // Reset corner position
    if(key == '0') 
    {
        uPos.value = videoPlane.uniforms.activeCorner.value
        return
    }

    // Move increment (1px * speed)
    var vInc = 2.0*speed/planeEl.clientHeight
    var hInc = 2.0*speed/planeEl.clientWidth
    
    // Move corner
    if(key == '8')      uPos.value[1] += vInc;
    else if(key == '6') uPos.value[0] += hInc;
    else if(key == '2') uPos.value[1] -= vInc;
    else if(key == '4') uPos.value[0] -= hInc;
    else return
    
    // Accelerate
    speed = Math.min(5.0, speed+0.1)
})

function getUniformPos() 
{
    var corner = getActiveCorner()
    if (corner == null) return null
    return videoPlane.uniforms['pos'+corner]
}

function setActiveCorner(pos) {
    var oldCorner = getActiveCorner()

    if      (pos == 'A') videoPlane.uniforms.activeCorner.value = [-1.0, 1.0, 0.0]
    else if (pos == 'B') videoPlane.uniforms.activeCorner.value = [ 1.0, 1.0, 0.0]
    else if (pos == 'C') videoPlane.uniforms.activeCorner.value = [ 1.0,-1.0, 0.0]
    else if (pos == 'D') videoPlane.uniforms.activeCorner.value = [-1.0,-1.0, 0.0]
    else                 videoPlane.uniforms.activeCorner.value = [ 0.0, 0.0, 0.0]

    var corner = getActiveCorner()
    if (oldCorner != corner) {
        if (corner != null) console.log('mapping corner', corner)
        else console.log('mapping done.')
    }
}

function getActiveCorner() {
    var corner = videoPlane.uniforms.activeCorner.value
    if (corner[0] == -1.0 && corner[1] ==  1.0) return 'A'
    if (corner[0] ==  1.0 && corner[1] ==  1.0) return 'B'
    if (corner[0] ==  1.0 && corner[1] == -1.0) return 'C'
    if (corner[0] == -1.0 && corner[1] == -1.0) return 'D'
    
    return null
}


