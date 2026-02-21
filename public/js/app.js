
let state = "IDLE";
let seconds = 0;
let timerInterval = null;

const statusEl = document.getElementById("status");
const timerEl = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const stopBtn = document.getElementById("stopBtn");
const filenameInput = document.getElementById("filename");


function updateUI() {
  console.log("UI UPDATE → state:", state);
  startBtn.disabled  = state !== "IDLE";
  pauseBtn.disabled  = state !== "RECORDING";
  resumeBtn.disabled = state !== "PAUSED";
  stopBtn.disabled   = state === "IDLE";

  statusEl.textContent = state;
  statusEl.className = `badge ${state.toLowerCase()}`;
}

function renderTimer() {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  timerEl.textContent = `${h}:${m}:${s}`;
}

function REC_START_TIMEr() {

  if (timerInterval) return;
   timerInterval = setInterval(() => {
    seconds++;
    renderTimer();
  }, 1000);

}

function stopTimer() {

  clearInterval(timerInterval);
  timerInterval = null;
  seconds = 0;
  renderTimer();
}

function pauseTimer(){

  clearInterval(timerInterval);
  timerInterval = null;
}

function computeElapsedSeconds(data) {

  if (!data.REC_START_TIME) return 0;

  const now = Date.now();

  // If paused, freeze time at pausedAt

  const effectiveNow = data.paused ? data.pausedAt || now: now;

  const elapsedMs = effectiveNow - data.REC_START_TIME - (data.totalPausedMs || 0);
  return Math.max(0, Math.floor(elapsedMs / 1000));
}

async function restoreRecordingState() {

 console.log("restoreRecordingState CALLING ");

  try {
    const res = await fetch("/api/recording/status");
    const data = await res.json();
    
    
    if (!data.active){
      state = "IDLE";
      updateUI();
       //startWSStream();
      return;
    }

    state = data.paused ? "PAUSED" : "RECORDING";
    filenameInput.value = data.filename || "";
    filenameInput.disabled = true;

    seconds = computeElapsedSeconds(data);
    if (!data.paused) REC_START_TIMEr();
    updateUI();
  } catch (err) {
    console.error("STATE RESTORE FAILED", err);
  }
}


 


const video = document.getElementById("liveFeed");
let pc = null;
let reconnectTimer = null;

function live_feed_meta_data(){


  let video_stream_data ={
  waiting_data: video.seeking,
  PAUSED_STATE: video.paused,
  ENDED_STATE: video.ended , 
  currentTime: video.currentTime,
  duration:video.duration,
  readyState: video.readyState
};

console.log("STREAM_DATA",video_stream_data);
   
};
//WHIP → publish
//WHEP → playback
const STREAM_URL = `http://${location.hostname}:8889/live_camera/whep`;

async function startWebRTC() {

  cleanup();

//ICE = NAT traversal system.
//Local LAN → empty list is fine.

  pc = new RTCPeerConnection({
     bundlePolicy: "max-bundle",
     rtcpMuxPolicy: "require",
     encodedInsertableStreams: false,
    iceServers: []
  });

  pc.ontrack = (ev) => {
    video.srcObject = ev.streams[0];
  };

video.autoplay = true;
video.muted = true;    // required by Chrome 
video.playsInline = true; //Disable fullscreen hijack  
video.disablePictureInPicture = true;
//video.controls = false;  // Hides native play/pause UI Prevents user from scrubbing timeline



      document.addEventListener("volume_button_click", () => {
      video.muted = false;  //Can I unmute later
      });

     video.addEventListener("playing", () => {
     console.log("▶️[EVENT] Video playing");
      });

     video.addEventListener("pause", () => {
     console.log("⏸️[EVENT] Video paused"); 
      });

     video.addEventListener("waiting", () => {
     console.log("⏳[EVENT] Buffering ");
     });

     liveFeed.addEventListener("error", (e) => {
     console.error("🎥[EVENT] Video error", liveFeed.error);
     });

     live_feed_meta_data();


// WebRTC states:

// State	Meaning
// connecting	handshake
// connected	streaming
// disconnected	packet loss
// failed	dead
// closed	stopped

  pc.onconnectionstatechange = () => {
     console.log("WETRC_STATE:", pc.connectionState);
     if(pc.connectionState === "failed" ||pc.connectionState === "disconnected" || pc.connectionState === "closed") {
      scheduleReconnect();
    }
  };

  try {

    const offer = await pc.createOffer({
      offerToReceiveVideo: true
    });

    await pc.setLocalDescription(offer);

    const res = await fetch(STREAM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: offer.sdp
    });

    if (!res.ok)
      throw new Error("MediaMTX rejected connection");

    const answer = await res.text();
    await pc.setRemoteDescription({
      type: "answer",
      sdp: answer
    });

    console.log("✅ WebRTC Connected");

  } catch (err) {
    console.error("WebRTC start failed:", err);
    scheduleReconnect();
  }
}

setInterval(async () => {

 if(!pc) return;
 const stats = await pc.getStats();
 stats.forEach(r => {
   if(r.type === "inbound-rtp" && r.kind === "video") {
     console.log({
       bitrate: r.bytesReceived,
       framesDecoded: r.framesDecoded,
       framesDropped: r.framesDropped,
       jitter: r.jitter
     });

   }
 });

},3000);

function scheduleReconnect() {

  if (reconnectTimer) return;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    startWebRTC();
  }, 2000);
}

function cleanup() {

  if (pc) {
    pc.ontrack = null;
    pc.onconnectionstatechange = null;
    pc.close();
    pc = null;
  }

  video.srcObject = null;
}

document.addEventListener("visibilitychange", () => {
 console.log("🙈 TAB HIDDEN → visibilitychange");

  if (document.hidden) {
    console.log("Tab hidden → pause decode");
    video.pause();
  } else {
    console.log("Tab visible → resume");
    if (video.paused) {
    video.play().catch(()=>{}); }
  }
});

let PTZ = {
  
    panSpeed: 10,
    tiltSpeed: 10,
    OPTICALzoomSpeed: 2,
    OPTICALZoom: 100,
    DIGITALzoomSpeed: 2,
    DIGITALZoom: 100,
    FOCUSSpeed: 2,
    FOCUSZoom: 100,
    
    BRIGHTNESS_CONTROL : 7,
    SATURATION_CONTROL : 7,
    CONTRAST_CONTROL :  7,
    SHARPNESS_CONTROL :  6,
    HUE_CONTROL :  7,
};

const panSpeed = document.getElementById("panSpeed");
const tiltSpeed = document.getElementById("tiltSpeed");

panSpeedVal.textContent =  PTZ.panSpeed;
tiltSpeedVal.textContent = PTZ.tiltSpeed;

panSpeed.oninput = () => {
    PTZ.panSpeed = panSpeed.value;
    panSpeedVal.textContent = panSpeed.value;
};

tiltSpeed.oninput = () => {
    PTZ.tiltSpeed = tiltSpeed.value;
    tiltSpeedVal.textContent = tiltSpeed.value;
};


// [UP button,
//  LEFT button,
//  RIGHT button,
//  DOWN button,
//  UPLEFT,
//  UPRIGHT...]

let ptzMoving = false;
document.querySelectorAll("[data-dir]").forEach(btn => {

    const dir = btn.dataset.dir.toUpperCase();
    
    const startMove = () => {
        if(ptzMoving) return;
           ptzMoving = true;
           fetch(`/api/ptz/move?dir=${dir}&ps=${PTZ.panSpeed}&ts=${PTZ.tiltSpeed}`);
           //.then(r=>r.json())
    };

    const stopMove = () =>{
          ptzMoving = false;
          fetch(`/api/ptz/stop`);
         //.then(r=>r.json())
    };

    /* mouse */
    btn.addEventListener("mousedown", startMove);
    if(dir !== "HOME"){
    btn.addEventListener("mouseup",   stopMove);
    btn.addEventListener("mouseleave",stopMove);}

    /* touch */
    btn.addEventListener("touchstart", e=>{e.preventDefault();
        startMove();
    });

    btn.addEventListener("touchend", stopMove);

});
  
const presetInput = document.getElementById("presetNumber");
const presetSetBtn = document.getElementById("presetSetBtn");
const presetStatus = document.getElementById("presetStatus");

/* validate preset range */
function getPresetID(){
    let id = parseInt(presetInput.value);

    if(isNaN(id) || id < 1 || id > 254){
        alert("Preset must be between 1 - 254");
        return null;
    }

    return id;
}

/* ================= SET PRESET ================= */
presetSetBtn.onclick = async () => {

    const id = getPresetID();
    if(!id) return;
    presetStatus.innerText = "Setting...";
    try{
        
        const res = await fetch(`/api/ptz/preset/set/${id}`);
        const data = await res.json();
        presetStatus.innerText = data.success ? `Preset ${id} Saved ✅`: `Set Failed ❌`;

    }catch(err){
        presetStatus.innerText = "Server Error";
    }
};

document.querySelectorAll("[data-preset]").forEach(btn => {
    btn.onclick = () => {
        const id = btn.dataset.preset;
        fetch(`/api/ptz/preset/call/${id}`)
        .then(r=>r.json())
        .then(()=>console.log("Preset",id,"called"));
    };

});

// document.getElementById("homeBtn").onclick =
// ()=>fetch("/api/ptz/home");

// document.getElementById("resetBtn").onclick =
// ()=>fetch("/api/ptz/reset");

////optical zoom

const opticalzoomInBtn  = document.getElementById("opticalzoomIn");
const opticalzoomOutBtn = document.getElementById("opticalzoomOut");
const opticalzoomSpeed = document.getElementById("opticalZoomspeed");


opticalZoomspeedVal.textContent = PTZ.OPTICALzoomSpeed;

opticalzoomSpeed.oninput = () => {
    PTZ.OPTICALzoomSpeed = opticalzoomSpeed.value;
    opticalZoomspeedVal.textContent = opticalzoomSpeed.value;
};


function zoomStart(action){
    fetch(`/api/ptz/zoom?action=${action}&zs=${PTZ.OPTICALzoomSpeed}`);
}

function zoomStop(){
    fetch(`/api/ptz/zoom?action=ZOOMSTOP`);
}

/* Mouse */
opticalzoomInBtn.onmousedown  = () => zoomStart("ZOOMIN");
opticalzoomOutBtn.onmousedown = ()=>  zoomStart("ZOOMOUT");
opticalzoomInBtn.onmouseup = opticalzoomOutBtn.onmouseup = zoomStop;

/* Touch */
opticalzoomInBtn.ontouchstart  = ()=>zoomStart("ZOOMIN");
opticalzoomOutBtn.ontouchstart = ()=>zoomStart("ZOOMOUT");
opticalzoomInBtn.ontouchend = opticalzoomOutBtn.ontouchend = zoomStop;




const FOCUSInBtn  = document.getElementById("FOCUSIn");
const FOCUSOutBtn = document.getElementById("FOCUSOut");
const FOCUSspeed = document.getElementById("FOCUSspeed");

FOCUSspeedVal.textContent = PTZ.FOCUSSpeed;
FOCUSspeed.oninput = () => {
    PTZ.FOCUSSpeed = FOCUSspeed.value;
    FOCUSspeedVal.textContent = FOCUSspeed.value;
};

const focusAuto = document.getElementById("FOCUSAuto");
/* initial state */
FOCUSInBtn.disabled  = true;
FOCUSOutBtn.disabled = true;
FOCUSspeed.disabled = true;

focusAuto.addEventListener("change", () => {

    const mode = focusAuto.checked ? "MANUAL" :"AUTO" ;
    console.log("Focus Mode:", mode);

    /* enable manual buttons only in MANUAL mode */
    const isAuto = mode === "AUTO";

    FOCUSInBtn.disabled  = isAuto;
    FOCUSOutBtn.disabled = isAuto;
    FOCUSspeed.disabled =  isAuto;

    fetch(`/api/ptz/focus_mode?mode=${mode}`)
    .catch(err => console.error("Focus mode error", err));
});

// focusIn.onmousedown = () =>
//     fetch("/api/ptz/focus?action=FOCUSIN");

// focusOut.onmousedown = () =>
//     fetch("/api/ptz/focus?action=FOCUSOUT");

// focusIn.onmouseup =
// focusOut.onmouseup = () =>
//     fetch("/api/ptz/focus?action=FOCUSSTOP");

function FOCUSStart(action){
    fetch(`/api/ptz/focus?action=${action}&fs=${PTZ.FOCUSSpeed}`);
}

function FOCUSStop(){
    fetch(`/api/ptz/focus?action=FOCUSSTOP`);
}

/* Mouse */
FOCUSInBtn.onmousedown  = () => FOCUSStart("FOCUSIN");
FOCUSOutBtn.onmousedown = ()=>  FOCUSStart("FOCUSOUT");
FOCUSInBtn.onmouseup = FOCUSOutBtn.onmouseup = FOCUSStop;

/* Touch */
FOCUSInBtn.ontouchstart  = ()=>FOCUSStart("FOCUSIN");
FOCUSOutBtn.ontouchstart = ()=>FOCUSStart("FOCUSOUT");
FOCUSInBtn.ontouchend = FOCUSOutBtn.ontouchend = FOCUSStop; 


document.addEventListener("DOMContentLoaded", () => {

const digitalSlider = document.getElementById("digitalZoom");

if (!video) return;

let digitalZoom = 1;
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

/* ================= APPLY ZOOM ================= */

function applyZoom() {
    video.style.transform = `scale(${digitalZoom})`;
}

/* ================= SLIDER CONTROL ================= */

if (digitalSlider) {
    digitalSlider.value = digitalZoom;
    digitalSlider.addEventListener("input", () => {
        digitalZoom = parseFloat(digitalSlider.value);
        applyZoom();
    });
}

/* ================= MOUSE WHEEL ZOOM ================= */

video.addEventListener("wheel", e => {

    e.preventDefault();
    digitalZoom += e.deltaY < 0 ? 0.1 : -0.1;
    digitalZoom = Math.max(MIN_ZOOM,Math.min(MAX_ZOOM, digitalZoom));
    applyZoom();
    if (digitalSlider)
        digitalSlider.value = digitalZoom;
});

/* ================= CURSOR FOCUS ZOOM ================= */

// video.addEventListener("mousemove", e => {

//     if (digitalZoom === 1) return;
//     const rect = video.getBoundingClientRect();
//     const x = (e.clientX - rect.left) / rect.width;
//     const y = (e.clientY - rect.top) / rect.height;
//     video.style.transformOrigin =`${x * 100}% ${y * 100}%`;
// });

/* ================= BUTTON API ================= */

// window.zoomIn = () => {
//     digitalZoom = Math.min(MAX_ZOOM, digitalZoom + 0.2);
//     applyZoom();
//     if (digitalSlider) digitalSlider.value = digitalZoom;
// };

// window.zoomOut = () => {
//     digitalZoom = Math.max(MIN_ZOOM, digitalZoom - 0.2);
//     applyZoom();
//     if (digitalSlider) digitalSlider.value = digitalZoom;
// };

});



//// internal server system view settings

// function setImage({brightness=1,contrast=1,saturate=1,sharpness=1}){

//   video.style.filter =
//   `
//   brightness(${brightness})
//   contrast(${contrast})
//   saturate(${saturate})
//   `;

// }


function setImage(mode,value){
  fetch(`/api/ptz/image_setting?mode=${mode}&level=${value}`);
}

brightness.textContent = PTZ.BRIGHTNESS_CONTROL;
contrast.textContent = PTZ.CONTRAST_CONTROL;
saturation.textContent = PTZ.SATURATION_CONTROL;
/* sliders */

brightness.oninput = ()=>{
  setImage("BRIGHT",brightness.value); 
  brightnessVal.textContent = brightness.value;
}
contrast.oninput   = ()=>{
  setImage("CONTRAST",contrast.value);
  contrastVal.textContent = contrast.value;
}
saturation.oninput = ()=>{
  setImage("SATURATION",saturation.value);
  saturationVal.textContent = saturation.value;
}

sharpness.oninput   = ()=>{
  setImage("SHARPNESS",sharpness.value);
  sharpnessVal.textContent = sharpness.value;
}
hue.oninput = ()=>{
  setImage("HUE",hue.value);
  hueVal.textContent = hue.value;
}

// IMG_FLIP.onclick = () => {
//   setImage("FLIP",1);
// }
// IMG_MIRROR.onclick = () => {
//   setImage("MIRROR",1);
// }

IMG_DEFAULT.onclick = () => {
  setImage("DEFAULT",1);
  brightness.value =  PTZ.BRIGHTNESS_CONTROL;   
  contrast.value = PTZ.CONTRAST_CONTROL;
  saturation.value = PTZ.SATURATION_CONTROL;
  sharpness.value = PTZ.SHARPNESS_CONTROL;
  hue.value = PTZ.HUE_CONTROL;
  brightnessVal.textContent =     PTZ.BRIGHTNESS_CONTROL;
  contrastVal.textContent = PTZ.CONTRAST_CONTROL;
  saturationVal.textContent = PTZ.SATURATION_CONTROL;
  sharpnessVal.textContent = PTZ.SHARPNESS_CONTROL;
  hueVal.textContent = PTZ.HUE_CONTROL;
}



startBtn.onclick = async () => {
//const filename = filenameInput.value;

  console.log("startBtn BUTTON CLICKED");

const filename = filenameInput.value.trim();
  try {
  
    const res = await fetch("/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename })
    });

    const data = await res.json();
    if (!res.ok) {
      statusEl.textContent = data.error || "START_FAILED";
      statusEl.className = "badge idle";
      return;
    }else{
      if(data.success == true){
      statusEl.textContent = data.state || "RECORDING";
       statusEl.className = "badge idle";
      }else{
      statusEl.textContent = data.state || "START_FAILED";
       statusEl.className = "badge idle";
      return;
      }
     
    }
    //stopWSStream();  // 🔥 stop live view during recording
    filenameInput.value = data.filename || filename;
    filenameInput.disabled = true;
    seconds = 0;
    state = "RECORDING";
    REC_START_TIMEr();
    updateUI();  

     
  } catch (err) {
    console.error(err);
    statusEl.textContent = "SERVER ERROR";
  }
};

pauseBtn.onclick = async () => {
  console.log("PAUSE BUTTON CLICKED");

  try {
    const res = await fetch("/pause", { method: "POST" });
    const data = await res.json();

    console.log("PAUSE RESPONSE:", data);

    if (!res.ok) {
      alert(data.error || "PAUSE FAILED");
      return;
    }

    state = "PAUSED";
    pauseTimer();
    updateUI();

  } catch (err) {
    console.error("PAUSE REQUEST ERROR:", err);
  }
};

resumeBtn.onclick = async () => {
   console.log("resumeBtn BUTTON CLICKED");
  try {
    const res = await fetch("/resume", { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    state = "RECORDING";
    REC_START_TIMEr();
    updateUI();

  } catch (err) {
    console.error("Resume failed", err);
  }
};


stopBtn.onclick = async () => {

   console.log("stopBtn BUTTON CLICKED");
  try {
    await fetch("/stop", { method: "POST" });

    pauseTimer();
    stopTimer();

    state = "IDLE";
    filenameInput.disabled = false;
    updateUI();
  // setTimeout(startWSStream, 2000); // restart clean
    

  }catch (err){
    console.error("Stop failed", err);

  }
};

restoreRecordingState();
//startWSStream();
startWebRTC();