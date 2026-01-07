
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




const liveFeed = document.getElementById("liveFeed");

let ws = null;
let mediaSource = null;
let sourceBuffer = null;
let queue = [];
let isFirstChunk = true;
let headerReceived = false; // 🔑 RESET FLAG
let first_moov_headerReceived = false; 
let bufferCleanupInterval;
let isMediaSourceReady = false; // 🔑 NEW: Track ready state
function onUpdateEnd(){

  if (sourceBuffer && !sourceBuffer.updating && queue.length > 0) {
    try {
       const chunk = queue.shift();
      console.log(`📦 onUpdateEnd event Appending queued chunk (${chunk.length} bytes, ${queue.length} remaining)`);
       sourceBuffer.appendBuffer(chunk);
      }catch (e) {
      console.error("❌ appendBuffer failed: ", e);
      queue = []; // Clear queue on error
    }
  }
}



// function resetMSE() {

//   console.log("🔄 RESETTING MEDIA SOURCE REQUEST");
 stopBufferCleanup(); // 🔑 Stop cleanup

//   try {

//      sourceBuffer.removeEventListener("updateend", onUpdateEnd);

//     if (sourceBuffer) {
//       if (sourceBuffer.updating) {
//         sourceBuffer.abort();
//       }

     
//       // Remove from MediaSource if still attached
//       if (mediaSource && mediaSource.readyState === "open" && mediaSource.sourceBuffers.length > 0) {
//         try {
//           mediaSource.removeSourceBuffer(sourceBuffer);
//         } catch (e) {
//           console.warn("Could not remove sourceBuffer:", e);
//         }
//       }
//     }
//   } catch (e) {
//     console.warn("Error during sourceBuffer cleanup:", e);
//   }


//   try {
//     if (mediaSource && mediaSource.readyState === "open") {
//       mediaSource.endOfStream();
//     }
//   } catch (e) {
//     console.warn("Error ending stream:", e);
//   }

// }

function resetMSE() {

  console.log("🔄 RESETTING MEDIA SOURCE");
    isMediaSourceReady = false; 
    stopBufferCleanup(); // 🔑 Stop cleanup
    headerReceived = false; // 🔑 RESET FLAG
    first_moov_headerReceived = false; 
   // 🔑 MARK AS NOT READY

  // Clean up SourceBuffer
  if (sourceBuffer) {
    try {
      sourceBuffer.removeEventListener("updateend", onUpdateEnd);
      
      // Only abort if it's updating
      if (sourceBuffer.updating) {
        sourceBuffer.abort();
      }
      
      // Remove from MediaSource only if still attached
      if (mediaSource && mediaSource.readyState === "open" &&  mediaSource.sourceBuffers.length > 0) {
          mediaSource.removeSourceBuffer(sourceBuffer);
      }
    } catch (e) {
      console.warn("⚠️ Error cleaning sourceBuffer:", e);
    }

    sourceBuffer = null;
  }

  // Clean up MediaSource - DON'T call endOfStream()
  if (mediaSource) {
    
     try {
      mediaSource.removeEventListener("sourceopen", null);
      mediaSource.removeEventListener("sourceclose", null);
      mediaSource.removeEventListener("sourceended", null);
   
    } catch (e) {
       console.warn("⚠️ Error removing source event", e);
      
    } 

     try {
    mediaSource = null;
    } catch (e) {
      console.warn("⚠️ Error cleaning mediaSource:", e);
    }
  }
}



// 🔑 NEW: Clean old buffers periodically
function stopBufferCleanup() {
  if (bufferCleanupInterval) {
    clearInterval(bufferCleanupInterval);
    bufferCleanupInterval = null;
    console.log("🛑 Buffer cleanup stopped");
  }
}
function forceCleanup() {

  if (!sourceBuffer || sourceBuffer.updating) return;

  try {
    const buffered = sourceBuffer.buffered;
    if (!buffered.length) return;

    const current = liveFeed.currentTime;
    const KEEP = 5; // seconds to keep behind

    const removeEnd = current - KEEP;
    if (removeEnd > buffered.start(0)) {
      sourceBuffer.remove(buffered.start(0), removeEnd);
      console.log("🧹 Forced buffer cleanup to", removeEnd.toFixed(2));
    }
  } catch (e) {
    console.warn("Cleanup failed:", e.message);
  }
}

function startBufferCleanup() {

  stopBufferCleanup(); // Clear any existing interval
  
  bufferCleanupInterval = setInterval(() => {
    // 🔑 Check if everything is valid before cleanup
    if (!sourceBuffer || !isMediaSourceReady || sourceBuffer.updating) {
      return;
    }

    try {
      // 🔑 Check if SourceBuffer is still attached
      if (!mediaSource || mediaSource.readyState !== "open") {
        return;
      }

      const buffered = sourceBuffer.buffered;
      
      if (buffered.length > 0) {
        const currentTime = liveFeed.currentTime;
        const start = buffered.start(0);
        const end = buffered.end(buffered.length - 1);
        const bufferSize = end - start;
        
        const KEEP_DURATION = 15; // Keep last 30 seconds
        
        if (bufferSize > KEEP_DURATION && currentTime > KEEP_DURATION) {
          const removeEnd = currentTime - KEEP_DURATION;
          
          if (removeEnd > start) {
            console.log(`🧹 Cleaning buffer: ${start.toFixed(1)}s to ${removeEnd.toFixed(1)}s`);
            sourceBuffer.remove(start, removeEnd);
          }
        }
      }
    } catch (e) {
      // Silently ignore errors during cleanup
      console.warn("⚠️ Buffer cleanup skipped:", e.message);
    }
  }, 10000); // Every 15 seconds
}

async function RESTART_MSE() {
    
    liveFeed.load();

    console.log("🎬 Initializing MediaSource...");
     mediaSource = new MediaSource();

     liveFeed.src = URL.createObjectURL(mediaSource);
   
     //  liveFeed.load();
       liveFeed.autoplay = true;
      liveFeed.muted = true;       // required by Chrome 
      liveFeed.playsInline = true; //Disable fullscreen hijack  
      liveFeed.controls = false;  // Hides native play/pause UI Prevents user from scrubbing timeline


       document.addEventListener("volume_button_click", () => {
       liveFeed.muted = false;  //Can I unmute later
     });

     liveFeed.addEventListener("playing", () => {
     console.log("▶️ Video playing event ");
   });

     liveFeed.addEventListener("pause", () => {
     console.log("⏸️ Video paused event"); 
    });

   liveFeed.addEventListener("waiting", () => {
  console.log("⏳ Buffering event");
  });

  liveFeed.addEventListener("error", (e) => {
  console.error("🎥 Video error event", liveFeed.error);
});

     mediaSource.addEventListener("sourceopen", () => {
    
      console.log("✅ new  MediaSource opened");

  if (!mediaSource || mediaSource.readyState !== "open") {
      console.warn("⚠️ MediaSource closed before SourceBuffer creation");
      return;
    }
 
  try {

  sourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.64002A "');
  sourceBuffer.mode = "segments";
  console.log("✅ SourceBuffer created");
    
    //codecs="avc1.42E01E  // // H.264 baseline profile (works everywhere)
      // Higher quality, less compatible:
//'video/mp4; codecs="avc1.640028"' // H.264 High Profile

// Even higher quality:
//'video/mp4; codecs="avc1.64002A"' // H.264 High Profile, Level 4.2
    
      
      sourceBuffer.addEventListener("updateend", onUpdateEnd);
      console.log("✅ SourceBuffer created successfully");
      
      isMediaSourceReady = true;
      console.log("✅ MediaSource READY FOR DATA");
     
      startBufferCleanup();  isMediaSourceReady = true;

        sourceBuffer.addEventListener("error", (e) =>{
        console.error("❌ SOURCE BUFFER ERROR EVENT START :", e);
        resetMSE(); // 🔑 CRITICAL
        queue = [];
        setTimeout(() => RESTART_MSE(), 10);
       ws.send(JSON.stringify({ type: "STREAM_HEADER", message: "SEND HEADER"})); 
      });

       
       // 🔑 Process queued chunks with a small delay
      if (queue.length > 0) {
        console.log(`📦 Processing PREVIOUS RESTART  ${queue.length} queued chunks...`);
        setTimeout(() => {
          if (isMediaSourceReady && sourceBuffer && !sourceBuffer.updating && queue.length > 0) {
            try {
              const chunk = queue.shift();
              console.log(`📦 Process queued chunks with a small delay Appending first queued chunk (${chunk.length} bytes)`);
              sourceBuffer.appendBuffer(chunk);
            } catch (e) {
              console.error("❌ Failed to append first queued chunk:", e);
            }
          }
        }, 10); // Small delay to ensure everything is stable
      }

   } catch (err) {
      console.error("❌ Failed to create SourceBuffer:", err);
      if (err.name === 'NotSupportedError') {   
        console.log("⚠️ Trying alternative codec...");
        try {
          sourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E"');
           sourceBuffer.mode = "segments";
          console.log("✅ SourceBuffer created with alternative codec");
         
  
          sourceBuffer.addEventListener('updateend', onUpdateEnd);
          sourceBuffer.addEventListener('error', (e) => console.error("❌ SourceBuffer error:", e));
          isMediaSourceReady = true;
          console.log("✅ MediaSource READY FOR DATA");
         //ws.send(JSON.stringify({ type: "STREAM_HEADER", message: "SEND HEADER"})); 
         startBufferCleanup();  isMediaSourceReady = true;

        } catch (err2) {
          console.error("❌ Alternative codec also failed:", err2);
        }
      }else{   //stopWSStream(); 
         }
    }



  });

 mediaSource.addEventListener("QuotaExceededError", () => {
 console.log("📺 QuotaExceededError event trigger ended");
  });

 mediaSource.addEventListener("sourceended", () => {
 console.log("📺 MediaSource event trigger  ended");
  });

  mediaSource.addEventListener("sourceclose", () => {
 console.log("🔒 MediaSource  event trigger  closed");
  });


}


// Video data validation
function isValidMP4Data(data) {

  // MP4 files start with specific "box" types
  // Common MP4 boxes: ftyp, moof, mdat, moov
  
  const validBoxTypes = [
    0x66, 0x74, 0x79, 0x70, // 'ftyp' - file type box (initialization)
    0x6D, 0x6F, 0x6F, 0x66, // 'moof' - movie fragment box
    0x6D, 0x64, 0x61, 0x74, // 'mdat' - media data box
    0x6D, 0x6F, 0x6F, 0x76, // 'moov' - movie box (metadata)
    0x73, 0x69, 0x64, 0x78, // 'sidx' - segment index box
    0x73, 0x74, 0x79, 0x70  // 'styp' - segment type box
  ];
  
  if (data.length < 8) {
    console.warn("⚠️ Data too small to be valid MP4");
    return false;
  }
  
  // MP4 box format: [4 bytes size][4 bytes type]
  // Check bytes 4-7 for box type
  const boxType = data.slice(4, 8);
  
  // Check if box type matches any valid MP4 box
  const isValid = (
    (boxType[0] === 0x66 && boxType[1] === 0x74 && boxType[2] === 0x79 && boxType[3] === 0x70) || // ftyp
    (boxType[0] === 0x6D && boxType[1] === 0x6F && boxType[2] === 0x6F && boxType[3] === 0x66) || // moof
    (boxType[0] === 0x6D && boxType[1] === 0x64 && boxType[2] === 0x61 && boxType[3] === 0x74) || // mdat
    (boxType[0] === 0x6D && boxType[1] === 0x6F && boxType[2] === 0x6F && boxType[3] === 0x76) || // moov
    (boxType[0] === 0x73 && boxType[1] === 0x69 && boxType[2] === 0x64 && boxType[3] === 0x78) || // sidx
    (boxType[0] === 0x73 && boxType[1] === 0x74 && boxType[2] === 0x79 && boxType[3] === 0x70)    // styp
  );
  
  if (!isValid) {
    console.warn("⚠️ Invalid MP4 box type:", String.fromCharCode(boxType[0], boxType[1], boxType[2], boxType[3]));

  }else{  
    console.warn("valid MP4 box type:", String.fromCharCode(boxType[0], boxType[1], boxType[2], boxType[3]));

  }
  
  return isValid;
}


function stopWSStream() {

    isMediaSourceReady = false; // 🔑 Mark as not ready
     if (ws){
    ws.close();
    ws = null;
  }

   stopBufferCleanup(); // 🔑 Stop cleanup
   resetMSE();
  queue = [];
 mediaSource = null;
  sourceBuffer = null;
   liveFeed.load(); // Reset video element
   liveFeed.src = "";
 
  
}
let allowAppend = true;

function canAppend() {

  if (!sourceBuffer || !sourceBuffer.buffered.length) return true;

  const buffered = sourceBuffer.buffered;
  const start = buffered.start(0);
  const end = buffered.end(buffered.length - 1);

  const MAX_BUFFER = 15; // seconds (live safe)

  return (end - start) < MAX_BUFFER;
}

  // if (!allowAppend){
  //     console.warn("🚫 allowAppendappend",allowAppend);
  //      return; } 

  //  if (!canAppend()) {
  //    console.warn("🚫 Buffer full → skipping append",sourceBuffer.buffered.length);
  //   return;
  //    }

//console.warn("🔁 chunk RECEIVED",chunk);


// if (!allowAppend){
//        console.warn("🚫 allowAppendappend",allowAppend);
//         return; } 
        

function getBoxType(chunk) {
  if (chunk.length < 8) return null;
  return String.fromCharCode(
    chunk[4],
    chunk[5],
    chunk[6],
    chunk[7]
  );
}

// readyState values:

// Value	Meaning
// 0	HAVE_NOTHING
// 1	HAVE_METADATA
// 2	HAVE_CURRENT_DATA
// 3	HAVE_FUTURE_DATA
// 4	HAVE_ENOUGH_DATA

let waitingForFirstMdat = false;
function STORE_CHUNK(chunk) {

    

  const boxType = getBoxType(chunk);

  console.log({
  waiting_data: liveFeed.seeking,
  //play: liveFeed.play,
  paused: liveFeed.paused,
  ennded: liveFeed.ended , 
  currentTime: liveFeed.currentTime,
 
});
console.log({
 duration:liveFeed.duration,
  buffered: sourceBuffer?.buffered?.length,
  readyState: liveFeed.readyState
});
  console.log("📦 MP4 boxType RECEIVED, size:", boxType);

      if (!headerReceived ){

          if (boxType === "ftyp" ){
          console.log("📦 MP4 HEADER boxType RECEIVED, size:", boxType);
          console.log("📦 MP4 HEADER RECEIVED, size:", chunk.length);
          headerReceived = true;
          }
          
       }else if (!first_moov_headerReceived  && headerReceived ) {
      
        if (boxType === "moof") {
        console.log("🧼 Clean fragment boundary found (moof)",boxType);
        first_moov_headerReceived = true;
       // waitingForFirstMdat = true;        
         } 

     
      // }else if (waitingForFirstMdat) {

      //        if (boxType === "mdat") {
      //        console.log("✅ First playable fragment arrived (mdat)");
      //        waitingForFirstMdat = false; }
    
     } else {
       
      if (!first_moov_headerReceived && !headerReceived  && waitingForFirstMdat ) {
       console.log("🧼  Drop everything until moov header and  fragment boundary found (moof)",boxType);
       return;  }
      }
   

      if (chunk && !sourceBuffer.updating && queue.length === 0 &&  sourceBuffer){
        
       try {
      //  console.log(`📦 Appending chunk directly (${chunk.length} bytes)`);
        sourceBuffer.appendBuffer(chunk);
      } catch (e) {
       if (e.name === "QuotaExceededError") {
        console.warn("🧹 Quota hit → forcing cleanup");
        forceCleanup();
      } else {
        console.error("appendBuffer error:", e);
      }
      }

      }else if(chunk && isMediaSourceReady){
        queue.push(chunk);
       //  console.log(`📦 Queued chunk (queue length: ${chunk.length})`);
      }else{ 
        console.log(` ⚠️ chunk or media buffer error chuck length: ${chunk.length})`); 
       }


    }

let streamBuffer = new Uint8Array(0);
function readMp4Box(buffer){

  if(buffer.length < 8){
    //console.error("readMp4Box buffer length:",buffer.length);
    return null;
  }
  
  const size =(buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3];
  if(size < 8 || buffer.length < size){
    //console.error(`readMp4Box buffer length : ${buffer.length} || size: ${size}`); 
    return null;
  }
  const type = String.fromCharCode(buffer[4], buffer[5], buffer[6], buffer[7]);
  return { size, type };
}


function startWSStream() {

 if (ws && ws.readyState === WebSocket.OPEN) {
    console.log("⚠️ WebSocket already open");
    return;
  }
    resetMSE(); // 🔑 CRITICAL
   RESTART_MSE();

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`; // Adjust your WS endpoint

   //   ws = new WebSocket(wsUrl);
    ws = new WebSocket(`ws://${location.host}`);
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      console.log("WS CONNECTED");
    };

    ws.onmessage = event => {

  
   if (typeof event.data === "string"){

        const msg = JSON.parse(event.data);
       // console.log("RECIEVE EVENT MESSAGE",msg);
        
        if (msg.type === "CLEAR_STREAM"){
            console.log("🔁 CLEAR_STREAM RECEIVED",msg.message);
            resetMSE(); // 🔑 CRITICAL
            setTimeout(() => RESTART_MSE(), 1000);
            return;
        }

        if (msg.type === "RESET_STREAM" || msg.type ===  "STREAM_RESTART"){
          console.log("🔁 RESET_STREAM || STREAM_RESTART RECEIVED :::",msg.message);
          stopWSStream();          // close socket cleanly
          setTimeout(startWSStream, 1000); // restart clean
           return;
         }

          if (msg.type === "STREAM_READY") {
             console.log("🔁 STREAM_READY RECEIVED:::",msg.message);
            // return;
           
           }

           if (msg.type === "ERROR") {
              console.log("🔁 ERROR RESET_STREAM RECEIVED ::",msg.message);
          //  stopWSStream();          // close socket cleanly
        //  setTimeout(startWSStream, 3000); // restart clean
         }

         return;
      }
      
    const chunk = new Uint8Array(event.data);
    
    if (chunk.length === 0) {
      console.warn("⚠️ Received empty chunk, ignoring");
      return;
    }
    
    if (chunk.length < 8) {
      console.warn("⚠️ Chunk too small to be valid MP4 data");
      return;
    }

  
         if (!isMediaSourceReady ){
           console.warn("⚠️ MediaSource not ready yet, queuing chunk:", chunk.length);
           queue.push(chunk);
           return;
          } 

       if (mediaSource.readyState !== "open") {
         console.warn("⚠️ MediaSource not open, queuing chunk",chunk.length);
         queue.push(chunk);  
         return;
      }

       if (!mediaSource && mediaSource.readyState !== "open"){
           console.warn("⚠️ MediaSource is null dropping chunk",chunk.length);
           resetMSE(); // 🔑 CRITICAL
          setTimeout(() => RESTART_MSE(), 100);
         return;
      }

     if (!sourceBuffer) {
      console.warn("⚠️ SourceBuffer not created, queuing chunk:", chunk.length);
      queue.push(chunk);
      return;
    }
      
          STORE_CHUNK(chunk);
    
// // 1️⃣ accumulate bytes (NEW)
// const merged = new Uint8Array(streamBuffer.length + chunk.length);
// merged.set(streamBuffer);
// merged.set(chunk, streamBuffer.length);
// streamBuffer = merged;

// // 2️⃣ extract REAL MP4 boxes
// while (true) {

//   const box = readMp4Box(streamBuffer);
//   if (!box) {
//    // console.log("⚠️ box error dropping chunk",box); 
//      break;}

//   // 🔪 THIS is the correct slice usage
//   const payload = streamBuffer.slice(0, box.size);
//   streamBuffer = streamBuffer.slice(box.size);

//   // 3️⃣ use YOUR existing pipeline
//  // console.log("chunk",box); 
//   //STORE_CHUNK(payload);
// }

      
  //    CHUNCK_RESULT = isValidMP4Data(chunk);

  //    const isHeader = chunk.length >= 4 && 
  //                    chunk[4] === 0x66 && // 'f'
  //                    chunk[5] === 0x74 && // 't'
  //                    chunk[6] === 0x79 && // 'y'
  //                    chunk[7] === 0x70;   // 'p'
   

  //     if (isHeader && !headerReceived && isValidMP4Data(chunk)){
  //        console.log("📦 MP4 HEADER RECEIVED, size:", chunk.length);
  //         headerReceived = true;
  //        STORE_CHUNK(chunk);
         
  //        return;
        
  //      }else{ 
  // //&& first_moov_headerReceived == false
  //            if(!headerReceived  ){
  //              console.log("📦 HEADER RECEIVED NOT RECIEVE YEY return , size:", chunk.length ,headerReceived,first_moov_headerReceived);
  //             return;
  //          }
  //       }

  //      if (headerReceived && CHUNCK_RESULT && !first_moov_headerReceived ) {
  //        console.log("📦 MP4 first_moov_ RECEIVED, size:", chunk.length);
  //        STORE_CHUNK(chunk);
  //         first_moov_headerReceived = true;
  //         return;
  //      }else{
  //        if(first_moov_headerReceived  ){
  //       console.log("📦H MOOV RECIEVE CHUNK  size:", chunk.length);
  //       STORE_CHUNK(chunk);
  //     }else{  console.log("📦WAITING TO RECIEVE FIRST VAILD MOOF", chunk.length); }

  //       }

        // STORE_CHUNK(chunk);
    };

    ws.onerror = err => {
      console.error("⚠️⚠️⚠️⚠️⚠️⚠️vWS ERROR", err);
    };

    ws.onclose = (event) => {
        console.log(`🔌🙈🙈🙈 WS CLOSED (code: ${event.code}, reason: ${event.reason})`);
         stopWSStream();
    };

  };


  function PAUSE_PLAY(){

  console.log("🙈 TAB enent → PAUSE_PLAY");
  

  
     allowAppend = false;
     stopBufferCleanup();  // 1️⃣ Stop buffer cleanup
     
     liveFeed.pause();  // 2️⃣ Pause video



   try {

      if (sourceBuffer && sourceBuffer.buffered.length > 0) {
        const end = sourceBuffer.buffered.end(sourceBuffer.buffered.length - 1);
        liveFeed.currentTime = end - 0.1; // 🔥 LIVE edge
        }

    } catch {}

    allowAppend = true;
     if (liveFeed.paused) {
      liveFeed.play();//.catch(() => {});
  }
   startBufferCleanup(); // 5️⃣ Restart buffer cleanup
  
};

document.addEventListener("visibilitychange", () => {
  console.log("🙈 TAB HIDDEN → visibilitychange");
  
  if (document.hidden) {
    console.log("🙈 TAB HIDDEN → pausing live stream");
     allowAppend = false;
     stopBufferCleanup();  // 1️⃣ Stop buffer cleanup
     liveFeed.pause();  // 2️⃣ Pause video

  } else {
 
    console.log("👀 TAB VISIBLE → resync live");

    // 3️⃣ Jump to LIVE edge
   try {

      if (sourceBuffer && sourceBuffer.buffered.length > 0) {
        const end = sourceBuffer.buffered.end(sourceBuffer.buffered.length - 1);
        liveFeed.currentTime = end - 0.1; // 🔥 LIVE edge
        }

    } catch {}

    allowAppend = true;
     if (liveFeed.paused) {
      liveFeed.play();//.catch(() => {});
  }
   startBufferCleanup(); // 5️⃣ Restart buffer cleanup
  }
});

// function clearOldBuffer() {

//   if (!sourceBuffer || sourceBuffer.updating) return;
  
//   try {
//     const video = document.getElementById('video');
//     const currentTime = video.currentTime;
    
//     // Keep last 30 seconds
//     if (currentTime > 30) {
//       const removeEnd = currentTime - 30;
//       sourceBuffer.remove(0, removeEnd);
//       console.log(`🗑️ Removed buffer from 0 to ${removeEnd.toFixed(2)}s`);
//     }
//   } catch (err) {
//     console.error("❌ Failed to clear buffer:", err);
//   }
// }


// ws.onopen = () => {
//   console.log('✅ Connected to camera stream');
// };

// ws.onmessage = async (event) => {
//   // Handle text messages (control messages)
//   if (typeof event.data === 'string') {
//     try {
//       const msg = JSON.parse(event.data);
//       console.log('📨 Control message:', msg);
      
//       if (msg.type === 'STREAM_READY') {
//         console.log('✅ Stream ready, client ID:', msg.clientId);
//       } else if (msg.type === 'ERROR') {
//         console.error('❌ Stream error:', msg.message);
//       } else if (msg.type === 'RESET_STREAM') {
//         console.warn('🔄 Stream reset requested');
//         resetStream();
//       }
//     } catch (e) {
//       console.error("❌ Failed to parse control message:", e);
//     }
//     return;
//   }
  
//   // Handle binary data (video chunks)
//   try {
//     // Convert Blob to ArrayBuffer
//     let arrayBuffer;
//     if (event.data instanceof Blob) {
//       arrayBuffer = await event.data.arrayBuffer();
//     } else if (event.data instanceof ArrayBuffer) {
//       arrayBuffer = event.data;
//     } else {
//       console.error("❌ Unknown data type:", typeof event.data);
//       return;
//     }
    
//     const chunk = new Uint8Array(arrayBuffer);
    
//     // Validate chunk size
//     if (chunk.length === 0) {
//       console.warn("⚠️ Received empty chunk, ignoring");
//       return;
//     }
    
//     if (chunk.length < 8) {
//       console.warn("⚠️ Chunk too small to be valid MP4 data");
//       return;
//     }
    
//     // Validate it's MP4 video data
//     if (!isValidMP4Data(chunk)) {
//       console.error("❌ Received invalid MP4 data, ignoring");
//       console.log("First 16 bytes:", Array.from(chunk.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '));
//       return;
//     }
    
//     // First chunk - initialize MediaSource
//     if (isFirstChunk) {
//       console.log("📦 First chunk received:", chunk.length, "bytes");
//       console.log("Box type:", String.fromCharCode(chunk[4], chunk[5], chunk[6], chunk[7]));
      
//       if (!mediaSource) {
//         initializeMediaSource(chunk);
//       }
      
//       isFirstChunk = false;
//       return;
//     }
    
//     // Subsequent chunks
//     if (!sourceBuffer) {
//       console.warn("⚠️ SourceBuffer not ready, queueing chunk");
//       queue.push(chunk);
//       return;
//     }
    
//     // Add chunk to SourceBuffer or queue
//     if (!sourceBuffer.updating && queue.length === 0) {
//       // SourceBuffer is free and queue is empty - append directly
//       try {
//         sourceBuffer.appendBuffer(chunk);
//         // console.log(`✅ Appended chunk: ${chunk.length} bytes`);
//       } catch (err) {
//         console.error("❌ Failed to append chunk:", err);
        
//         if (err.name === 'QuotaExceededError') {
//           console.warn("⚠️ Buffer full, clearing old data...");
//           clearOldBuffer();
//           queue.push(chunk);
//         }
//       }
//     } else {
//       // SourceBuffer is busy or queue has items - add to queue
//       queue.push(chunk);
//       // console.log(`📦 Queued chunk (queue length: ${queue.length})`);
//     }
    
//   } catch (err) {
//     console.error("❌ Error processing video data:", err);
//   }
// };




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
   setTimeout(startWSStream, 2000); // restart clean
    

  }catch (err){
    console.error("Stop failed", err);

  }
};

restoreRecordingState();
startWSStream();
