const major = Number(process.versions.node.split(".")[0]);
if (major < 16) {
  console.error("❌ Node.js v16+ required. Found:", process.versions.node);
  process.exit(1);
}
//   "scripts": {
//     "start": "nodemon server.js",
//      "dev": "nodemon server.js"
//   },

const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();
const WebSocket = require("ws")
const http = require("http");
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
const { spawn, exec , execSync } = require("child_process");


const cors = require('cors');
const { Console } = require("console");
app.use(cors({
  //origin: ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.29.2:3001', '*'], // Add your frontend URLs
 origin: "*" ,//true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));




function detectSdCard(callback) {

  exec("lsblk -o NAME,TYPE,MOUNTPOINT", (error, stdout, stderr) => {
   if (error || !stdout) {
      console.error("detectSdCard lsblk error:", error);
      return callback(null);
    }
    const lines = stdout.split("\n");
    for (const line of lines) {
      // Look for mmc block device partition
      if (line.includes("mmc") && line.includes("/media")) {
        const parts = line.trim().split(/\s+/);
        const mountPoint = parts[parts.length - 1];

        return callback(mountPoint);
      }
    }

    callback(null); // SD not found
  });
}


function detectUsbCamera(callback) {

  exec("ls /dev/video*", (err, stdout) => {
    if (err || !stdout) return callback(null);

    exec("v4l2-ctl --list-devices", (err2, out) => {
      if (err2 || !out) return callback(null);

      const match = out.match(/\/dev\/video\d+/);
      callback(match ? match[0] : null);
    });
  });
}

function GET_DATE_TIME_FORMATED() {
  const now = new Date();

  const pad = n => String(n).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_` +
         `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

 
function GET_DATE_FORMATED() {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
let  sdMountPoint = null;
let videosDir = null;
detectSdCard(mount => {
  if (!mount) {
    console.error("❌ SD CARD NOT DETECTED");
  } else {
    console.log("✅ SD CARD DETECTED AT POINT:", mount);
    //const videosDir = path.join(__dirname, "videos", GET_DATE_FORMATED());
    videosDir = path.join(mount, "videos", GET_DATE_FORMATED());
    app.use("/videos", express.static(path.join(mount, "videos")));
    

    sdMountPoint = mount;
    if (!fs.existsSync(videosDir)){
    console.log("RECORDING FILE PATH NOT EXIST:", videosDir);
    fs.mkdirSync(videosDir, { recursive: true });
     }
}
});


app.get("/", (req, res) => {
     console.log("/index.html request recieve");
   res.sendFile(path.join(__dirname, "public", "index.html"));
});

// function getUniqueFilePath(dir, baseName, ext) {
//   let filePath = path.join(dir, `${baseName}${ext}`);
//   let counter = 1;
//   while (fs.existsSync(filePath)){
//     filePath = path.join(dir, `${baseName}_${counter}${ext}`);
//     counter++;
//   }
//   return filePath;
// }
function getUniqueFilePath(dir, baseName, ext){
  //  strip any directory from basename
  baseName = path.basename(baseName, path.extname(baseName));

  //  normalize extension
  ext = ext.startsWith(".") ? ext : `.${ext}`;

  let counter = 0;
  let filePath;

  do {
    const suffix = counter === 0 ? "" : `_${counter}`;
    filePath = path.join(dir, `${baseName}${suffix}${ext}`);
    counter++;
  } while (fs.existsSync(filePath));

  return filePath;
}


let ffmpegProcess = null;
//let CAMERA_CONFIGURATION_CAP = {};
let CAMERA_CONFIGURATION = {
   
   format: "h264", // mjpeg | yuyv | h264
   resolution: "1920x1080",
   fps: 30, //5,15,30,50,60
   DEVICE_NODE: "/dev/video0",
   width: 1280,
   height: 720, 
   EXTENSION: ".mp4"      // mkv | mp4
};


let CAMERA_CONFIGURATION_CAP = {
  formats: ["MJPEG", "YUYV", "H264"],
  resolutions: ["320x240","480x272","424x240","640x360","640x480","720x480","800x448","800x600","1024x576","1024x768","1280x720","1920x1080","2560x1440"],
  fps: [10,15,20,24,25,30,50,60]
};

// function CAMERA_CONFIGURATION_CAPABILITIES(videoDev, callback){
//   //v4l2-ctl -d /dev/video0 --list-formats-ext
//   exec(`v4l2-ctl -d /dev/video0 --list-formats-ext`, (err, stdout) => {
//  // exec(`v4l2-ctl -d ${videoDev} --list-formats-ext`, (err, stdout) => {
//     if (err) {
//       console.error("Failed to read camera formats:", err);
//       return callback(null);
//     }

//     const capabilities = {};
//     let currentFormat = null;
//     let currentResolution = null;

//     const lines = stdout.split("\n");

//     for (const line of lines) {
//       // Pixel format line → [1]: 'MJPG'
//       const formatMatch = line.match(/\[\d+\]:\s+'(\w+)'/);
//       if (formatMatch) {
//         currentFormat = formatMatch[1];
//         capabilities[currentFormat] = {};
//         continue;
//       }

//       // Resolution line → Size: Discrete 1280x720
//       const sizeMatch = line.match(/Size:\s+Discrete\s+(\d+x\d+)/);
//       if (sizeMatch && currentFormat) {
//         currentResolution = sizeMatch[1];
//         capabilities[currentFormat][currentResolution] = [];
//         continue;
//       }

//       // FPS line → Interval: Discrete 0.033s (30.000 fps)
//       const fpsMatch = line.match(/\(([\d.]+)\s+fps\)/);
//       if (fpsMatch && currentFormat && currentResolution) {
//         const fps = parseFloat(fpsMatch[1]);
//         capabilities[currentFormat][currentResolution].push(fps);
//       }
//     }

//     callback(capabilities);
//   });
// }



// detectUsbCamera(videoDev => {
//   if (!videoDev) {
//     console.error("No USB camera detected at startup");
//     return;
//   }

//   cameraDevice = videoDev;

//   CAMERA_CONFIGURATION_CAPABILITIES(videoDev, caps => {
//     if (!caps) {
//       console.error("Failed to load camera capabilities");
//       return;
//     }

//     //cameraCapabilities = caps;

//    // console.log("Camera capabilities loaded:",cameraCapabilities);
//    // console.dir(cameraCapabilities, { depth: null });
//   });
// });


app.get("/api/camera/config", (req, res) => {
console.log("GET CAMERA CONFIGURATION  REQUEST:");
  if (!CAMERA_CONFIGURATION_CAP) {
     console.error("GET CAMERA CONFIGURATION  REQUEST ERROR:" ,CAMERA_CONFIGURATION_CAP);
     return res.status(500).json({ error: "CONFIGURATION SETTING FAILED"}); }
 
  res.json({
    current: CAMERA_CONFIGURATION,
    capabilities: CAMERA_CONFIGURATION_CAP
  });
});

app.post("/api/camera/config", (req, res) => {
  let { format, resolution, fps } = req.body;
  console.log("POST CAMERA CONFIGURATION:", req.body);

  if (!format || !resolution || !fps) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // normalize
  format = format.toUpperCase();
  fps = Number(fps);

  if (!CAMERA_CONFIGURATION_CAP.formats.includes(format)) {
    return res.status(400).json({ error: "Invalid format" });
  }

  if (!CAMERA_CONFIGURATION_CAP.resolutions.includes(resolution)) {
    return res.status(400).json({ error: "Invalid resolution" });
  }

  if (!CAMERA_CONFIGURATION_CAP.fps.includes(fps)) {
    return res.status(400).json({ error: "Invalid FPS" });
  }

  // derive width/height
  const [width, height] = resolution.split("x").map(Number);

  // ✅ THIS IS THE IMPORTANT PART
  CAMERA_CONFIGURATION = {
    ...CAMERA_CONFIGURATION,   // keep device node, extension
    format,
    resolution,
    fps,
    width,
    height,
    //EXTENSION: format === "H264" ? ".mp4" : ".mkv"
  };

  console.log("UPDATED CAMERA CONFIG:", CAMERA_CONFIGURATION);

  res.json({
    message: "CONFIGURATION_SAVED",
    current: CAMERA_CONFIGURATION
  });
});


let ffmpegStopping = false;
let lastStopTs = 0;

let WESOCKET_SEND_DATA_CONNECTED_FLAG = true;
const MIN_STOP_INTERVAL_MS    = 1500;   // ⏱ no double stop spam
const DEVICE_RELEASE_DELAY_MS = 800;
const liveClients = new Set(); 
let LIVE_STREAM_ENABLED = true;
let ALLOWED_LIVE_FLAG = true;
let WESOCKET_CONNECTED_FLAG= false;
let mp4Header = null;           // ftyp + empty_moov
const MAX_BUFFER = 2 * 1024 * 1024; // 2 MB

let RECORDING_STATE = {
  status : "IDLE",
  active: false,
  paused: false,
  filename: null,
  FINAL_FINAL_NAME : null,
  folder_name: null,
  FINAL_FILE_PATH: null,
  REC_START_TIME: null,
  REC_STOP_TIME : null,
  REC_VIDEO_DURATION: null,
  pausedAt: null,
  totalPausedMs: 0,
  segments: [], 
  curr_segment: null
};
 
let FFMPEG_ERROR = {

  result: null,
  reason: null,
  SPAWN_FAILED: 1,
  DEVICE_BUSY: 2,
  INVALID_ARGUMENT: 3,
  PROCESS_EXITED: 4,
  UNKNOWN: 99

};

app.get("/api/recording/status", (req, res) => {
  res.json({
    status: RECORDING_STATE.status,
    active: RECORDING_STATE.active,
    paused: RECORDING_STATE.paused,
    filename: RECORDING_STATE.filename,
    REC_START_TIME: RECORDING_STATE.REC_START_TIME,
    pausedAt: RECORDING_STATE.pausedAt,
    totalPausedMs: RECORDING_STATE.totalPausedMs
  });
   console.log("HOME PAGE STATE REQUEST ", res.json );
});


function getNextSegmentPath(baseFilename) {
  const index = RECORDING_STATE.segments.length + 1;
  const name = `${baseFilename}_part${index}`;
  return getUniqueFilePath(videosDir, name, CAMERA_CONFIGURATION.EXTENSION);
}







async function findCameraPortPath(){
  try {
      const lsusbOutput = execSync(`lsusb`).toString();
    console.log("📋 AVAILABLE USB devices:\n", lsusbOutput);

    const lsusb_t_Output = execSync(`lsusb -t`).toString();
    console.log("📋 AVAILABLE USB PORT LINK devices:\n", lsusb_t_Output);

     const LAST_DEVICE_NODE_LINK = execSync(` ls -ltr /dev/video*`).toString();
    console.log("📋 AVAILABLE LAST_DEVICE_NODE_LINK:\n", LAST_DEVICE_NODE_LINK);
      
    const V4_LINUX_LINK_NODE = execSync(`v4l2-ctl --list-devices`).toString();
    console.log("📋 v4l2-ctl --list-devices :\n", V4_LINUX_LINK_NODE);

// khadas@camera:~/CAMERA_PROJECT$ udevadm info -a -n /dev/video1 | grep devpath
// Udevadm info starts with the device specified by the devpath and then
// ATTRS{devpath}=="1"
// ATTRS{devpath}=="0"

// Wait and try again
     await new Promise(r => setTimeout(r, 3000));
    // Method 1: Search by vendor/product ID
    const devices = execSync(`ls /sys/bus/usb/devices/`).toString().trim().split('\n');
    
    for (const device of devices) {
      // Skip root hubs
      if (device.startsWith('usb')) continue;
      
      try {
        console.log("SEARCHING USB devices:\n", device);
        const vendorPath = `/sys/bus/usb/devices/${device}/idVendor`;
        const productPath = `/sys/bus/usb/devices/${device}/idProduct`;
        
        if (fs.existsSync(vendorPath) && fs.existsSync(productPath)) {
          const vendor = fs.readFileSync(vendorPath, 'utf8').trim();
          const product = fs.readFileSync(productPath, 'utf8').trim();
          
          // HD Camera: 2e7e:0877
          if (vendor === '2e7e' && product === '0877') {
            console.log(`✅ Found camera at port path: ${device}`);
            return device;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    console.error("❌ Camera port path not found");
    return null;
    
  } catch (err){

    console.error("❌ Error finding port path:", err.message);
    return null;
  }
}


async function findCameraPortPath2() {
  try {
    const usbDevices = fs.readdirSync("/sys/bus/usb/devices");
     console.error("USB DEVICE LIST",usbDevices);
    for (let i = 0; i < usbDevices.length; i++) {
      const dev = usbDevices[i];
     // console.error("DEVICE CHECK",dev);
      if (!dev.includes("-")) continue; // skip root hubs
      // console.error("correct DEVICE CHECK",dev);
      
       const base = `/sys/bus/usb/devices/${dev}`;
      const vendorFile = path.join(base, "idVendor");
      const productFile = path.join(base, "idProduct");
      const productNameFile = path.join(base, "product");

      if (!fs.existsSync(vendorFile) || !fs.existsSync(productFile)) continue;

      const vendor = fs.readFileSync(vendorFile, "utf8").trim();
      const product = fs.readFileSync(productFile, "utf8").trim();
      const productName = fs.existsSync(productNameFile)? fs.readFileSync(productNameFile, "utf8").trim(): "Unknown";

      // 🎯 Target camera
      if (vendor === "2e7e" && product === "0877"){
       //console.error("DEVICE base CHECK",base);
        const entries = fs.readdirSync(base);

        for (const entry of entries) {
         // console.error("DEVICE entries CHECK",entries);
          const videoPath = path.join(base, entry, "video4linux");
         console.error("DEVICE videoPath CHECK",videoPath);
          if (fs.existsSync(videoPath)){
            const videoNode = fs.readdirSync(videoPath)[0];

            return {
              bus: dev.split("-")[0],
              portPath: dev,
              vendor,
              product,
              deviceName: productName,
              videoNode: `/dev/${videoNode}`
            };
          }
        }
      }
    }

    console.error("❌ Camera found but no video node exposed");
    return null;

  } catch (err) {
    console.error("❌ Camera detection failed:", err.message);
    return null;
  }
}





// async function resetCameraDevice(STATE) {
//   console.log("🔄 Resetting camera usb device...");
  
// //  try {

//   const PORT = await findCameraPortPath();
//    if(PORT == null){    
//      console.log("🔄 RETURNING PORT IS NULL.............");
//     return null;
//    }
     
//     // const cameraMatch = lsusbOutput.match(/Bus (\d+) Device (\d+): ID 2e7e:0877/);
//     // if (!cameraMatch) {
//     //   console.error("❌ HD Camera not found in USB devices");
//     //   console.log("🔌 Checking if camera is physically connected...");
//     //   // Wait and try again
//     //   await new Promise(r => setTimeout(r, 3000));
//     //   const retry = execSync(`lsusb`).toString();
//     //   const retryMatch = retry.match(/Bus (\d+) Device (\d+): ID 2e7e:0877/);
//     //   if (!retryMatch){
//     //     return false;
//     //   }
//     // }

//   //  const match = cameraMatch || lsusbOutput.match(/Bus (\d+) Device (\d+): ID 2e7e:0877/);
//   //   const bus = match[1].padStart(3, '0');
//   //   const device = match[2].padStart(3, '0');
//   //   const usbPath = `/dev/bus/usb/${bus}/${device}`;
//   //   console.log(`📍 Camera USB path: ${usbPath}`);


//        // Reset the USB device
//     // console.log("🔌 Resetting USB device...");
//     // execSync(`sudo /usr/local/bin/usbreset ${usbPath}`, { timeout: 5000 });
//     // console.log("✅ USB device reset command sent");

//   // STATE = "---"
//   let lsusbOutput = "";
//     const usbDevice = PORT;
//     if(STATE == "RE_UN_BIND_USB"){
//       // Unbind
//       console.log("✅ USB device unbinding.........");
     
//        lsusbOutput =  execSync(`echo "${usbDevice}" | sudo tee /sys/bus/usb/drivers/usb/unbind`, { timeout: 2000 });
//        console.log("✅ USB device unbind unbound",lsusbOutput);
    
//      await new Promise(r => setTimeout(r, 2000));

//     //   // Rebind
//          console.log("✅ USB device binding.........");
//         lsusbOutput =  execSync(`echo "${usbDevice}" | sudo tee /sys/bus/usb/drivers/usb/bind`, { timeout: 2000 });
//         console.log("✅ USB device bind rebound :" ,lsusbOutput);


//     //  console.log("✅ USB device re-unbinding.........");
//     //  execSync( `echo "${usbDevice}" | sudo tee /sys/bus/usb/drivers/usb/unbind 2>/dev/null || true`,{ timeout: 2000 });
//     //  await new Promise(r => setTimeout(r, 2000));
  
//     // console.log("✅ USB device re-binding.........");
//     // execSync(`echo "${usbDevice}" | sudo tee /sys/bus/usb/drivers/usb/bind 2>/dev/null || true`, { timeout: 2000 });
    
//     await new Promise(r => setTimeout(r, 4000)); 
    
//     }else if(STATE == "BIND_USB"){

//        console.log("✅ USB device binding.........");
//    lsusbOutput = execSync(`echo "${usbDevice}" | sudo tee /sys/bus/usb/drivers/usb/bind`, { timeout: 2000 });
//        console.log("✅ USB device rebound",lsusbOutput);

//     }else if(STATE == "RESET_USB"){ 

//     }else{"USB CAMERA RECOVERY STATE NOT FOUND"}

//       //return true;
    
//     // Method 2: Use usbreset tool if available
//   //  const lsusbOutput = execSync(`lsusb | grep -i camera || lsusb`).toString();
//   //   console.log("USB devices:", lsusbOutput);
    
//   //   // Method 3: Reload v4l2 module
//   //   cons  console.log("⚠️ Trying usbreset method...");
//   //  ole.log("⚠️ Trying module reload...");
//   //   execSync(`sudo modprobe -r uvcvideo`, { timeout: 2000 });
//   //   await new Promise(r => setTimeout(r, 1000));
//   //   execSync(`sudo modprobe uvcvideo`, { timeout: 2000 });
//   //   await new Promise(r => setTimeout(r, 3000));
    
//   //   console.log("✅ Camera module reloaded");
//   //   return true;
    
//    // Check result
   
//    for (let i = 0; i < 20; i++) {
//       if (fs.existsSync('/dev/video0')) {
//         console.log("✅ /dev/video0 found Camera ready");
//         return true;
//       }

//       await new Promise(r => setTimeout(r, 500));

//     }
    
//     console.error("❌ Camera not ready");
//     return false;


//   // } catch (err) {
//   //   console.error("❌ All reset methods failed:", err.message);
//   //   return false;
//   // }
// }

// async function resetCameraDevice(STATE) {
//   console.log("🔄 Resetting camera USB device...");
  
//   try {
//     const PORT = await findCameraPortPath();
    
//     if (PORT == null) {
//       console.error("❌ PORT IS NULL - Camera not found");
//       return false;
//     }
    
//     console.log(`📍 Camera port: ${PORT}`);
    
//     const usbDevice = PORT;
    
//     // Helper: Check if device is bound
//     const isBound = () => {
//       try {
//         return fs.existsSync(`/sys/bus/usb/devices/${usbDevice}/driver`);
//       } catch (e) {
//         return false;
//       }
//     };
    
//     // Helper: Check if device exists
//     const deviceExists = () => {
//       try {
//         return fs.existsSync(`/sys/bus/usb/devices/${usbDevice}`);
//       } catch (e) {
//         return false;
//       }
//     };
    
//     if (!deviceExists()) {
//       console.error(`❌ Device ${usbDevice} does not exist in sysfs`);
//       return false;
//     }
    
//     console.log(`✅ Device ${usbDevice} exists in sysfs`);
    
//     // Execute based on STATE
//     if (STATE == "RE_UN_BIND_USB") {
//       console.log("🔄 Mode: RE_UN_BIND_USB");
      
//       // Step 1: Unbind (only if currently bound)
//       if (isBound()) {
//         console.log("⚡ Unbinding USB device...");
//         try {
//           execSync(`echo "${usbDevice}" | sudo tee /sys/bus/usb/drivers/usb/unbind`, { 
//             timeout: 2000,
//             stdio: 'pipe' 
//           });
//           console.log("✅ USB device unbound");
//         } catch (err) {
//           console.error("❌ Unbind failed:", err.message);
//           return false;
//         }
//       } else {
//         console.log("ℹ️ Device already unbound, skipping unbind");
//       }
      
//       // Wait for device to settle
//       await new Promise(r => setTimeout(r, 2000));
      
//       // Verify device still exists
//       if (!deviceExists()) {
//         console.error("❌ Device disappeared after unbind");
//         return false;
//       }
      
//       // Step 2: Bind (only if not bound)
//       if (!isBound()) {
//         console.log("⚡ Binding USB device...");
//         try {
//           execSync(`echo "${usbDevice}" | sudo tee /sys/bus/usb/drivers/usb/bind`, { 
//             timeout: 2000,
//             stdio: 'pipe'
//           });
//           console.log("✅ USB device bound");
//         } catch (err) {
//           // Check if it's actually bound despite error
//           await new Promise(r => setTimeout(r, 500));
//           if (isBound()) {
//             console.log("✅ Device is bound (despite error message)");
//           } else {
//             console.error("❌ Bind failed:", err.message);
//             return false;
//           }
//         }
//       } else {
//         console.log("✅ Device already bound");
//       }
      
//       // Wait for device to initialize
//       await new Promise(r => setTimeout(r, 3000));
      
//     } else if (STATE == "BIND_USB") {
//       console.log("🔄 Mode: BIND_USB");
      
//       // Only bind if not already bound
//       if (isBound()) {
//         console.log("✅ Device already bound, nothing to do");
//       } else {
//         console.log("⚡ Binding USB device...");
//         try {
//           execSync(`echo "${usbDevice}" | sudo tee /sys/bus/usb/drivers/usb/bind`, { 
//             timeout: 2000,
//             stdio: 'pipe'
//           });
//           console.log("✅ USB device bound");
//         } catch (err) {
//           // Check if actually bound
//           await new Promise(r => setTimeout(r, 500));
//           if (isBound()) {
//             console.log("✅ Device is bound (despite error)");
//           } else {
//             console.error("❌ Bind failed:", err.message);
//             return false;
//           }
//         }
//       }
      
//       await new Promise(r => setTimeout(r, 3000));
      
//     } else if (STATE == "RESET_USB") {
//       console.log("🔄 Mode: RESET_USB (usbreset)");
      
//       // Get bus and device number for usbreset
//       const lsusbOutput = execSync('lsusb').toString();
//       const match = lsusbOutput.match(/Bus (\d+) Device (\d+): ID 2e7e:0877/);
      
//       if (!match) {
//         console.error("❌ Camera not found in lsusb");
//         return false;
//       }
      
//       const bus = match[1].padStart(3, '0');
//       const device = match[2].padStart(3, '0');
//       const usbPath = `/dev/bus/usb/${bus}/${device}`;
      
//       console.log(`📍 USB device path: ${usbPath}`);
      
//       if (!fs.existsSync(usbPath)) {
//         console.error(`❌ USB device file not found: ${usbPath}`);
//         return false;
//       }
      
//       if (!fs.existsSync('/usr/local/bin/usbreset')) {
//         console.log("📥 Installing usbreset...");
//         await installUsbreset();
//       }
      
//       console.log("🔌 Resetting USB device...");
//       execSync(`sudo /usr/local/bin/usbreset ${usbPath}`, { timeout: 5000 });
//       console.log("✅ USB reset complete");
      
//       await new Promise(r => setTimeout(r, 5000));
      
//     } else {
//       console.error("❌ Unknown STATE:", STATE);
//       return false;
//     }
    
//     // Check if /dev/video0 appeared
//     console.log("⏳ Waiting for /dev/video0...");
    
//     for (let i = 0; i < 20; i++) {
//       if (fs.existsSync('/dev/video0')) {
//         console.log("✅ /dev/video0 found - Camera ready!");
        
//         // Verify it's actually working
//         try {
//           execSync('v4l2-ctl -d /dev/video0 --all > /dev/null 2>&1', { timeout: 2000 });
//           console.log("✅ Camera responding to v4l2 commands");
//           return true;
//         } catch (e) {
//           console.warn("⚠️ /dev/video0 exists but not responding yet...");
//         }
//       }
      
//       await new Promise(r => setTimeout(r, 500));
//     }
    
//     console.error("❌ /dev/video0 did not appear");
//     return false;
    
//   } catch (err) {
//     console.error("❌ Reset failed:", err.message);
//     console.error(err.stack);
//     return false;
//   }
// }

async function resetCameraDevice(STATE) {

  console.log(`🔄 Camera Reset - Mode: ${STATE}`);
  
  try {
    // Step 1: Find camera in USB devices
    const PORT = await findCameraPortPath();
    if (!PORT) {
      console.error("❌ Camera not found in USB tree");
      return false;
    }console.log(`📍 Camera found at: ${PORT}`);
    
    // Step 2: Check device and driver state
    const devicePath = `/sys/bus/usb/devices/${PORT}`;
    if(!fs.existsSync(devicePath)) {
      console.error(`❌ Device path does not exist: ${devicePath}`);
      return false;
    }

    const driverPath = `${devicePath}/driver`;
    const isBound = fs.existsSync(driverPath);
    console.log(`📊 Driver state: ${isBound ? 'BOUND' : 'UNBOUND'}`);
    
    // Step 3: Check for video4linux interface
    const hasVideoInterface = () => {
      try {
        const interfaces = fs.readdirSync(devicePath);
        for (const iface of interfaces) {
          if (iface.startsWith(`${PORT}:`)) {
            const v4lPath = `${devicePath}/${iface}/video4linux`;
            if (fs.existsSync(v4lPath)) {
              const videoDevs = fs.readdirSync(v4lPath);
              if (videoDevs.length > 0) {
                console.log(`✅ Video interface found: ${videoDevs.join(', ')}`);
                return true;
              }
            }
          }
        }
        return false;
      
      } catch (e) {
        return false;
      }
  
    };
    
    const hasVideo = hasVideoInterface();
    console.log(`📊 Video interface: ${hasVideo ? 'PRESENT' : 'MISSING'}`);
    
//  // Strategy 2: Kernel module reload (nuclear option)
//     console.log("\n📍 Strategy 2: Kernel Module Reload");
//     const moduleReloadSuccess = await reloadUvcModule();
//     if (moduleReloadSuccess && fs.existsSync('/dev/video0')) {
//       console.log("✅ Recovery successful via module reload");
//       return true;
//     }
    

    // Step 4: Execute reset based on STATE
    if (STATE === "BIND_USB") {

      console.log("🔧 Strategy: Bind only");
      if (!isBound) {
        console.log("⚡ Binding driver...");
        const bindResult = await bindDevice(PORT);
        if (!bindResult) {
          console.error("❌ Bind failed");
          return false;
        }
      
      } else if (!hasVideo) {
        // Bound but no video interface - need to rebind
        console.warn("⚠️ Driver bound but no video interface - forcing rebind");
        await unbindDevice(PORT);
        await new Promise(r => setTimeout(r, 2000));
        const bindResult = await bindDevice(PORT);
        if (!bindResult) {
          console.error("❌ Rebind failed");
          return false;
        }
      } else {
        console.log("✅ Already bound with video interface");
      }
      
    } else if (STATE === "RE_UN_BIND_USB") {
      console.log("🔧 Strategy: Full unbind/bind cycle");
      
      // Always unbind first
      if (isBound) {
        console.log("⚡ Unbinding driver...");
        await unbindDevice(PORT);
      } else {
        console.log("ℹ️ Already unbound");
      }

      await new Promise(r => setTimeout(r, 500));
      if (!fs.existsSync(devicePath)) {
        console.error("❌ Device disappeared after unbind");
        return false;
      }
      
      // Bind
      console.log("⚡ Binding driver...");
      const bindResult = await bindDevice(PORT);
      if (!bindResult) {
        console.error("❌Bind failed.............");
        return false;
      }
      
    } else if (STATE === "RESET_USB") {
      console.log("🔧 Strategy: USB hardware reset");
      
      const resetResult = await usbHardReset();
      if (!resetResult) {
        console.error("❌ USB reset failed");
        return false;
      }
      
    } else {
      console.error(`❌ Unknown state: ${STATE}`);
      return false;
    }


    
    // Step 5: Wait for /dev/video0 to appear
    console.log("⏳ Waiting for /dev/video0...");
    
    for (let i = 0; i < 5; i++) {
      if (fs.existsSync('/dev/video0')) {
        console.log(`✅ /dev/video0 appeared (attempt ${i + 1})`);
        
        // Verify it's actually usable
        await new Promise(r => setTimeout(r, 1000));
        
        try {
          execSync('v4l2-ctl -d /dev/video0 --all > /dev/null 2>&1', { timeout: 3000 });
          console.log("✅ Camera is responding");
          return true;
        } catch (e) {
          console.warn(`⚠️ /dev/video0 exists but not responding yet (attempt ${i + 1})`);
        }
      }
      
      await new Promise(r => setTimeout(r, 1000));
    }


    
    // Step 6: Diagnostics if failed
    console.error("❌ /dev/video0 did not appear - running diagnostics...");
    await diagnosticCheck(PORT);
    return false;
    
  } catch (err) {
    console.error("❌ Camera reset failed:", err.message);
    console.error(err.stack);
    return false;
  }
}

// Reload UVC kernel module (risky but effective)
async function reloadUvcModule() {
  console.log("🔄 Reloading UVC kernel module");
  //console.warn("⚠️ This will affect ALL USB cameras");
  
  try {
    // Check if module is built-in
  //  try {
      const modinfo = execSync('modinfo uvcvideo 2>&1').toString();
      if (modinfo.includes('builtin') || modinfo.includes('in-tree')) {
        console.error("❌ uvcvideo is built into kernel, cannot reload");
        //return await reloadUvcViaRebind();
      }
    //} //catch (e) {
     // console.warn("⚠️ Could not check module info");
    //}
    
    // Unload module
    console.log("📤 Unloading uvcvideo module...");
    execSync('sudo modprobe -r uvcvideo', { timeout: 5000 });
    console.log("✅ Module unloaded");
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Reload module
    console.log("📥 Loading uvcvideo module...");
    execSync('sudo modprobe uvcvideo', { timeout: 5000 });
    console.log("✅ Module loaded");
    
    await new Promise(r => setTimeout(r, 5000));
    
    // Check for video devices
    for (let i = 0; i < 20; i++) {
      if (fs.existsSync('/dev/video0')) {
        console.log("✅ /dev/video0 appeared");
        return true;
      }
      await new Promise(r => setTimeout(r, 500));
    }
    
    return false;
    
  } catch (err) {
    console.error("❌ Module reload failed:", err.message);
    return false;
  }
}


// Alternative: Rebind all UVC devices
async function reloadUvcViaRebind() {
  
  console.log("🔄 Rebinding all UVC devices");
  
  try {
    // Find all UVC devices
    const uvcDevices = [];
    const devices = fs.readdirSync('/sys/bus/usb/devices');
    
    for (const device of devices) {
      if (device.includes(':')) continue;
      
      try {
        const driverPath = `/sys/bus/usb/devices/${device}/driver`;
        if (fs.existsSync(driverPath)) {
          const driver = fs.readlinkSync(driverPath);
          if (driver.includes('uvcvideo')) {
            uvcDevices.push(device);
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    console.log(`📋 Found ${uvcDevices.length} UVC devices:`, uvcDevices);
    
    // Unbind all
    for (const dev of uvcDevices) {
      console.log(`⚡ Unbinding ${dev}...`);
      try {
        execSync(`echo "${dev}" | sudo tee /sys/bus/usb/drivers/usb/unbind`, {
          timeout: 2000,
          stdio: 'pipe'
        });
      } catch (e) {
        console.warn(`⚠️ Could not unbind ${dev}`);
      }
    }
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Bind all
    for (const dev of uvcDevices) {
      console.log(`⚡ Binding ${dev}...`);
      try {
        execSync(`echo "${dev}" | sudo tee /sys/bus/usb/drivers/usb/bind`, {
          timeout: 2000,
          stdio: 'pipe'
        });
      } catch (e) {
        console.warn(`⚠️ Could not bind ${dev}`);
      }
    }
    
    await new Promise(r => setTimeout(r, 5000));
    
    return fs.existsSync('/dev/video0');
    
  } catch (err) {
    console.error("❌ Rebind failed:", err.message);
    return false;
  }
}


// Helper: Unbind device
async function unbindDevice(port){
  try {
    const driverPath = `/sys/bus/usb/devices/${port}/driver`;
    if (!fs.existsSync(driverPath)) {
      console.log("ℹ️ Device already unbind unbound return unbinding...");
      return true;
    }
    
    execSync(`echo "${port}" | sudo tee /sys/bus/usb/drivers/usb/unbind`, {
      timeout: 3000,
      stdio: 'pipe'
    });
    
    // Verify unbind
    await new Promise(r => setTimeout(r, 500));
    if (fs.existsSync(driverPath)) {
      console.error("❌ Device still bound after unbind command");
      return false;
    }
    
    console.log("✅ Device unbound successfully");
    return true;
    
  }catch(err){
    console.error("❌ Unbind error:", err.message);
    return false;
  }

}

// Helper: Bind device
async function bindDevice(port) {
  try {
  
    const driverPath = `/sys/bus/usb/devices/${port}/driver`;
    if (fs.existsSync(driverPath)) {
      console.log("ℹ️ Device already have  bind bound");
      return true;
    }
    
    execSync(`echo "${port}" | sudo tee /sys/bus/usb/drivers/usb/bind`, {
      timeout: 3000,
      stdio: 'pipe'
    });
    
    // Wait for driver to initialize
    await new Promise(r => setTimeout(r, 1000));
    // Verify bind
    if (!fs.existsSync(driverPath)) {
      console.error("❌ Device not bound after bind command");
      return false;
    }
    
    console.log("✅ Device bound successfully");
    
    // Wait for video interface to initialize
    await new Promise(r => setTimeout(r, 1000));
    
    return true;
    
  } catch (err) {
    const errMsg = err.message || String(err);
    
    // "No such device" often means already bound
    if (errMsg.includes('No such device')) {
      console.warn("Bind returned  No such device , checking actual state...");
      await new Promise(r => setTimeout(r, 1000));
      const driverPath = `/sys/bus/usb/devices/${port}/driver`;
      if (fs.existsSync(driverPath)) {
        console.log("✅ Device is actually bind bound");
        return true;
      }
    }
    
    console.error("❌ Binding............ error:", errMsg);
    return false;
  }
}

// Helper: USB hardware reset
async function usbHardReset() {

  console.log("🔌 USB hardware reset.................");
 
  try {

    const lsusbOutput = execSync('lsusb').toString();
    const match = lsusbOutput.match(/Bus (\d+) Device (\d+): ID 2e7e:0877/);
    if (!match) {
      console.error("❌ Camera not found in lsusb");
      return false;
    }
    
    const bus = match[1].padStart(3, '0');
    const device = match[2].padStart(3, '0');
    const usbPath = `/dev/bus/usb/${bus}/${device}`;
    
    console.log(`📍 USB device: ${usbPath}`);
    if (!fs.existsSync(usbPath)) {
      console.error(`❌ USB device file not found: ${usbPath}`);
      return false;
    }
    
    // Check for usbreset tool
    if (!fs.existsSync('/usr/local/bin/usbreset')) {
      console.log("📥 Installing usbreset...");
      await installUsbreset();
    }
    
    console.log("🔌 Performing USB hardware reset...");
    execSync(`sudo /usr/local/bin/usbreset ${usbPath}`, { timeout: 5000 });
    console.log("✅ USB reset complete");
    // Wait longer for hardware reset
    await new Promise(r => setTimeout(r, 5000));
    return true;
    
  } catch (err) {
    console.error("❌ USB reset error:", err.message);
    return false;
  }
}

// Helper: Diagnostic check
async function diagnosticCheck(port) {


  console.log("\n🔍 DIAGNOSTIC CHECK:");
  console.log("═".repeat(50));
  
  try {
    // Check device exists
    const devicePath = `/sys/bus/usb/devices/${port}`;
    console.log(`📁 Device path exists: ${fs.existsSync(devicePath)}`);
    if (!fs.existsSync(devicePath)) {
      console.log("❌ Device disappeared from sysfs");
      return;
    }
    
    // Check driver
    const driverPath = `${devicePath}/driver`;
    const isBound = fs.existsSync(driverPath);
    console.log(`🔗 Driver bound: ${isBound}`);
    
    if (isBound) {
      try {
        const driverLink = fs.readlinkSync(driverPath);
        console.log(`📌 Driver: ${path.basename(driverLink)}`);
      } catch (e) {
        console.log("⚠️ Could not read driver symlink");
      }
    }
    
    // Check interfaces
    console.log("\n📋 USB Interfaces:");
    const entries = fs.readdirSync(devicePath);
    const interfaces = entries.filter(e => e.startsWith(`${port}:`));
    
    if (interfaces.length === 0) {
      console.log("❌ No interfaces found");
    } else {
      interfaces.forEach(iface => {
        console.log(`   - ${iface}`);
        
        // Check for video4linux
        const v4lPath = `${devicePath}/${iface}/video4linux`;
        if (fs.existsSync(v4lPath)) {
          const videoDevs = fs.readdirSync(v4lPath);
          console.log(`     Video devices: ${videoDevs.join(', ')}`);
        }
      });
    }
    
    // Check /dev/video*
    console.log("\n📹 Video Devices in /dev:");
    try {
      const videoDevs = execSync('ls -l /dev/video* 2>/dev/null || echo "None"').toString();
      console.log(videoDevs);
    } catch (e) {
      console.log("   None found");
    }
    
    // Check dmesg for errors
    console.log("\n📜 Recent kernel messages (last 20 lines):");
    try {
      const dmesg = execSync('dmesg | grep -i "video\\|uvc\\|camera" | tail -20').toString();
      console.log(dmesg || "   No relevant messages");
    } catch (e) {
      console.log("   Could not read dmesg");
    }
    
    // Check lsusb
    console.log("\n🔌 USB Device Info:");
    try {
      const lsusb = execSync('lsusb -v -d 2e7e:0877 2>/dev/null | head -30').toString();
      console.log(lsusb || "   Not found");
    } catch (e) {
      console.log("   Could not read lsusb");
    }
    
  } catch (err) {
    console.error("❌ Diagnostic check failed:", err.message);
  }
  
 // console.log("═".repeat(50) + "\n");
}

// Install usbreset tool
async function installUsbreset() {

console.log(" installUsbreset...............");
  try {
    const code = `
#include <stdio.h>
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <sys/ioctl.h>
#include <linux/usbdevice_fs.h>

int main(int argc, char **argv) {
    const char *filename;
    int fd, rc;

    if (argc != 2) {
        fprintf(stderr, "Usage: usbreset device-filename\\n");
        return 1;
    }
    filename = argv[1];

    fd = open(filename, O_WRONLY);
    if (fd < 0) {
        perror("Error opening output file");
        return 1;
    }

    printf("Resetting USB device %s\\n", filename);
    rc = ioctl(fd, USBDEVFS_RESET, 0);
    if (rc < 0) {
        perror("Error in ioctl");
        return 1;
    }
    printf("Reset successful\\n");

    close(fd);
    return 0;
}
`;

    fs.writeFileSync('/tmp/usbreset.c', code);
    execSync('gcc -o /tmp/usbreset /tmp/usbreset.c', { timeout: 5000 });
    execSync('sudo mv /tmp/usbreset /usr/local/bin/usbreset', { timeout: 2000 });
    execSync('sudo chmod +x /usr/local/bin/usbreset', { timeout: 2000 });
    
    console.log("✅ usbreset installed");
    return true;
    
  } catch (err) {
    console.error("❌ usbreset install failed:", err.message);
    return false;
  }
}


//resetCameraDevice("RE_UN_BIND_USB");

 async function checkCameraHealth( print ) {
  try{
    const output = execSync(`v4l2-ctl -d ${CAMERA_CONFIGURATION.DEVICE_NODE} --all`, { timeout: 3000 }).toString();
   if(print){
    console.log("checkCameraHealth" ,output); }
    return output.length > 0;
    
  } catch {
    return false;
  }
}
async function checkCameraHealth2(){
//ffmpegProcess &&
  if ( !await checkCameraHealth(false)) {
    console.error("🚨 Camera health check failed!");
    await killFFmpeg("Camera unhealthy");
   // await resetCameraDevice();
  }else{
    console.error("🚨 Camera health check ");
  }

}

// Run periodic health check
//setInterval(async () => {checkCameraHealth2() }, 10000); // Every 30 seconds

async function waitForCameraReady(maxWaitMs = 5000) {

  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    try {
      // Check if device exists
      if (!fs.existsSync(CAMERA_CONFIGURATION.DEVICE_NODE)){
        console.log("⏳ Waiting for device to appear...");
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
      
      // Check if device is readable
      const output = execSync( `v4l2-ctl -d ${CAMERA_CONFIGURATION.DEVICE_NODE} --list-formats-ext 2>&1`,
        { timeout: 3000 }
      ).toString();
      
      if (output.includes("Input/output error") || output.includes("No such device")) {
        console.log("⏳ Device not ready, waiting...");
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
      
      console.log("✅ Camera device ready");
      return true;
      

    } catch (err) {
      console.log("⏳ Camera check failed, retrying...");
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.error("❌ Camera did not become ready");
  return false;
}


function isCameraDeviceError(msg){
  
  return(
    msg.includes("Device or resource busy") ||
    msg.includes("No such device") ||
    msg.includes("Invalid argument") ||
    msg.includes("Input/output error") ||
    msg.includes("Could not open video device")||
    msg.includes("Not a video capture device") ||
    msg.includes("Could not write header") ||
    msg.includes("Resource temporarily unavailable") ||
    msg.includes("No such file or directory") ||
     msg.includes(" No space left on device")
  
  );

}


async function killFFmpeg(reason = "UNKNOWN") {
  
  if (!ffmpegProcess){
       console.log(`⛔ KILL IGNORED (NO FFMPEG): ${reason}`);
       return;
     }

  if (ffmpegStopping) {
      console.log(`⏳ KILL IGNORED (ALREADY STOPPING): ${reason}`);
      return;
  }

  console.log(`🧹 KILLING FFMPEG: ${reason}`);
  ffmpegStopping = true;

  try {
     // 🔑 REMOVE ALL LISTENERS FIRST
     ffmpegProcess.stdout.removeAllListeners();
     ffmpegProcess.stderr.removeAllListeners();
     ffmpegProcess.removeAllListeners();
    
    // Unpipe stdout to prevent buffering
     ffmpegProcess.stdout.unpipe();

     // Clean up listeners FIRST
     
    // if (ffmpegProcess.stdout) {
    //   ffmpegProcess.stdout.pause();
    //   ffmpegProcess.stdout.removeAllListeners();
    // }
    
    // if (ffmpegProcess.stderr) {
    //   ffmpegProcess.stderr.pause();
    //   ffmpegProcess.stderr.removeAllListeners();
    // }
    
    // ffmpegProcess.removeAllListeners();

    console.log("📝 Sending SIGINT to FFmpeg (graceful shutdown)  PID VALUE ",ffmpegProcess.pid);
    
    // Send SIGTERM first (cleaner than SIGINT)
    ffmpegProcess.kill("SIGTERM");
    
    // Wait max 3 seconds for graceful shutdown
    await Promise.race([
      new Promise(resolve => ffmpegProcess.once("close", resolve)),
      new Promise(resolve => setTimeout(resolve, 1500))
    ]);

     ffmpegProcess.kill("SIGINT");

    if (ffmpegProcess && !ffmpegProcess.killed) {
      console.warn("⚠️ Force SIGKILL ..... killing FFmpeg");
      ffmpegProcess.kill("SIGKILL");
    }


  } catch (e){
    console.warn("⚠️ Kill error:", e.message);
  }

  // Wait for device to be fully released
  await new Promise(r => setTimeout(r, 500)); // Increase delay
  ffmpegProcess = null;
  ffmpegStopping = false;
  mp4Header = null;
  console.log("✅ FFMPEG FULLY KILLED");
}
// scriptchild.kill('SIGTERM'); // Default - graceful shutdown (15)
// child.kill('SIGKILL'); // Force kill - immediate termination (9)
// child.kill('SIGINT');  // Interrupt - like Ctrl+C (2)
// child.kill('SIGHUP');  // Hangup - terminal closed (1)
// child.kill('SIGQUIT'); // Quit with core dump (3)
async function stopFFmpeg(reason = "UNKNOWN"){

  const now = Date.now();
  // ❌ no process
  if (!ffmpegProcess) {
    console.log(`⛔ STOP IGNORED (NO FFMPEG) : ${reason}`);
    return;
  }

  // ❌ already stopping

  if (ffmpegStopping) {
    console.log(`⏳ STOP IGNORED ffmpegStopping is true  (ALREADY STOPPING) : ${reason}`);
    return;
  }

  // ❌ stop called too soon
  if (now - lastStopTs < MIN_STOP_INTERVAL_MS) {
    console.log(`⏱ STOP IGNORED TIME (TOO FAST) : ${reason}`);
    return;
  }

  // 🔒 lock
  ffmpegStopping = true;
  lastStopTs = now;
  console.log("📝 Sending SIGINT to FFmpeg (graceful shutdown)  PID VALUE ",ffmpegProcess.pid);
  try{
    ffmpegProcess.kill("SIGTERM");
  } catch (e) {
    console.warn("⚠️ FFmpeg already dead");
  }
   ffmpegProcess.kill("SIGINT");
  await new Promise(resolve => {ffmpegProcess.once("close", code => { console.log(`🧹 stopFFmpeg FFMPEG CLOSED: ${code}`);resolve(); });});
  await new Promise(r => setTimeout(r, DEVICE_RELEASE_DELAY_MS));
  
  if (ffmpegProcess && !ffmpegProcess.killed) {
      console.warn("⚠️ Force SIGKILL ..... killing FFmpeg");
      ffmpegProcess.kill("SIGKILL");
    }

  console.log("✅ FFMPEG FULLY STOPPED");
  ffmpegProcess = null;
  ffmpegStopping = false;
  mp4Header = null;

}


function getReadyStateName(state) {
  switch (state) {
    case WebSocket.CONNECTING: return "CONNECTING";
    case WebSocket.OPEN: return "OPEN";
    case WebSocket.CLOSING: return "CLOSING";
    case WebSocket.CLOSED: return "CLOSED";
    default: return "UNKNOWN";
  }
}

let CAMERA_USB_PORT_ERROR_SOLVE_TIME_STAAMP=0;
async function CAMERA_USB_PORT_ERROR_SOLVE(state) {

// When camera fails



  const now = Date.now();
  let recovered = false;

   // ❌ stop called too soon
  if (now -  CAMERA_USB_PORT_ERROR_SOLVE_TIME_STAAMP < 15000) {
    console.log("⏱ CAMERA_USB_PORT_ERROR_SOLVE IGNORED TIME (TOO FAST) ");
    return;
  }
  CAMERA_USB_PORT_ERROR_SOLVE_TIME_STAAMP = now;
  
  // Try 1: Simple bind
  recovered = await resetCameraDevice(state);
  if (!recovered){
    // Try 2: Full unbind/bind cycle
    console.log("⚠️ FAILED RE-ATTEMPTED Trying USB hardware reset...");
    recovered = await resetCameraDevice("RESET_USB");
    //console.log("⚠️FAILED RE-ATTEMPTED Trying full unbind/bind cycle...");
    //recovered = await resetCameraDevice("RE_UN_BIND_USB");
  }
  
  // if (!recovered){   // Try 3: Hardware reset
  //   console.log("⚠️ FAILED RE-ATTEMPTED Trying USB hardware reset...");
  //   recovered = await resetCameraDevice("RESET_USB");
  // }
  
  if (!recovered) {
    console.error("❌ All recovery attempts failed");
    // Manual intervention needed
  }

}

  // const usb_device =  findCameraPortPath2();
  // if (usb_device || usb_device.videoNode){
  //   console.log(" CAMERA CONFIG:", CAMERA_CONFIGURATION);
  //    console.log("✅ Camera detected:", usb_device);
  // CAMERA_CONFIGURATION.DEVICE_NODE = usb_device.videoNode;
  //  console.log("UPDATED CAMERA CONFIG:", CAMERA_CONFIGURATION);

  // }


 let deadClients = [];
function RUN_FFMPEG_ARGUMENT_COMMAND({ outputPath = null, enableLive = false }){

  if (ffmpegProcess  || ffmpegStopping ) {
      FFMPEG_ERROR.result = false;
    FFMPEG_ERROR.reason = "FFMPEG_ALREADY_RUNNING";
    return { success: FFMPEG_ERROR.result, errorId: FFMPEG_ERROR.INVALID_ARGUMENT, reason:FFMPEG_ERROR.reason   };
  }
   
 FFMPEG_ERROR.result = false;
FFMPEG_ERROR.reason = "------";

  let args = [
    "-loglevel", "error",
    //"-fflag", "nobuffer",
    //"-rtbufsize", "100M",  // ← Add buffer
    "-f", "v4l2",
    "-input_format", "h264",
    "-video_size", CAMERA_CONFIGURATION.resolution,
    "-framerate", String(CAMERA_CONFIGURATION.fps),
    "-thread_queue_size", "512",  // ← Add thread queue
    "-i", CAMERA_CONFIGURATION.DEVICE_NODE,

    "-map", "0:v",
     "-c:v", "copy",
      "-avoid_negative_ts", "make_zero",  // ← Fix timestamp issues
    // 🔑 SAFE MP4 OUTPUT
    // "-c:v", "libx264",
    // "-preset", "veryfast",
    // "-tune", "zerolatency",
    // "-pix_fmt", "yuv420p",
    // "-reset_timestamps", "1"
  ];

  // 🎥 OUTPUT MODE
  if (enableLive && outputPath){
      console.log("✅ FFMPEG  enableLive && outputPath");
    args.push(
      "-f", "tee",
      `[f=mp4:movflags=+faststart]${outputPath}|` + `[f=mp4:movflags=frag_keyframe+empty_moov+default_base_moof:frag_duration=100000]pipe:1`
    );
  }else if (enableLive){
   console.log("✅ FFMPEG  enableLive ONLY ");
    args.push(
     "-flush_packets","1",
    "-f", "mp4",//"h264"
    "-movflags", "frag_keyframe+empty_moov+default_base_moof",
    "-frag_duration", "100000",   // 100ms fragments
    "pipe:1"
    );
  }else if (outputPath){
    console.log("✅ FFMPEG  outputPath ONLY");
    args.push(
      "-f", "mp4",
      "-movflags", "+faststart",
      outputPath
    );
  }
  
  else {

    FFMPEG_ERROR.result = false;
    FFMPEG_ERROR.reason = "NO_OUTPUT_DEFINED";
    return { success: FFMPEG_ERROR.result, errorId: FFMPEG_ERROR.INVALID_ARGUMENT, reason:FFMPEG_ERROR.reason   };
  }

  // 🚀 SPAWN
  try {
    ffmpegProcess = spawn("ffmpeg", args);
  } catch (err) {
      FFMPEG_ERROR.result = false;
      FFMPEG_ERROR.reason = "FFMPEG_PROCESS_FAILED_DEFINED";
      return { success: FFMPEG_ERROR.result, errorId: FFMPEG_ERROR.INVALID_ARGUMENT, reason:FFMPEG_ERROR.reason   };
  }
   
  let result = false;

  // 📡 LIVE STREAM
  if (enableLive && WESOCKET_CONNECTED_FLAG){
     
    mp4Header = null;

      ffmpegProcess.stdout.on("data", chunk => {
      
      //  console.log(" Size:", chunk.length, "bytes"); 
       //  console.log(" chunk", chunk); 
      if (!mp4Header && WESOCKET_SEND_DATA_CONNECTED_FLAG ){
         mp4Header = chunk;
        console.log("📦 MP4 header captured (size):", mp4Header.length);
        console.log("📦 MP4 header captured",mp4Header);
      }

 let index = 0;

  liveClients.forEach(ws => {

    index++;
    const info = {
      clientNo: index,
      readyState: getReadyStateName(ws.readyState) || "unknown",
      bufferedAmount: ws.bufferedAmount,
      ip: ws._socket?.remoteAddress || "unknown",
      port: ws._socket?.remotePort || "unknown"
    };
     if( WESOCKET_CONNECTED_FLAG && WESOCKET_SEND_DATA_CONNECTED_FLAG){
      
    if (ws.readyState === WebSocket.OPEN && ws.bufferedAmount < MAX_BUFFER){

           ws.send(chunk);
        //  console.log("🧩 Client Info:", info);
      // console.log(`✅ Data sent to client #${index} (${chunk.length} bytes)`); 
    }else{

      console.warn(`⚠️ Data NOT sent to client #${index}  DELETE CLIENT `);
      console.log("🧩 Client Info:", info);
         deadClients.push(ws);
         liveClients.delete(ws);
            console.log("AVAILAVLE CLIENT ",liveClients.size,deadClients.length,WESOCKET_CONNECTED_FLAG);
       }

  }else{ 
             console.warn(`⚠️ ffmpegProcess Data NOT sent to client #${index}`);
              console.log("🧩 Client Info:", info); 
              // deadClients.push(ws);
              //liveClients.delete(ws);
            console.log("AVAILAVLE CLIENT ",liveClients.size,deadClients.length,WESOCKET_CONNECTED_FLAG);
          } 
  });
   //&& deadClients >= 1
  if(WESOCKET_CONNECTED_FLAG && liveClients.size == 0 && deadClients.length >= 1 ){
         console.log("NO CLIENT AVAILABLE IN WEBSOCKET CLEARING WEBSOCKET ");
         deadClients = [];
          for (const ws of liveClients){
         console.log("wss CLOSING WS CLIENT IN RESET ...",liveClients.length);
       if (ws.readyState === ws.OPEN) {
          ws.close(1000, "STOP EVENT RESET"); // SERVER ERROR
       }
      }

      }    
});

  }

  ffmpegProcess.stderr.on("data", data => {
    const msg = data.toString();
    console.error("FFMPEG stderr OUTPUT :", data.toString());

      if (isCameraDeviceError(msg)){
         console.error("🚨 CAMERA DEVICE ERROR DETECTED");   
         
        stopFFmpeg("🚨 KILL CAMERA DEVICE ERROR");

          if (msg.includes("Input/output error") ){
          console.error("🚨 Input/output error resetCameraDevice RE_UN_BIND_USB");
          CAMERA_USB_PORT_ERROR_SOLVE("RE_UN_BIND_USB"); 
        }else if(msg.includes("No such device") || msg.includes("Cannot open video device /dev/video0") ){
          console.error("🚨 No such device error resetCameraDevice BIND_USB");
          //CAMERA_USB_PORT_ERROR_SOLVE("BIND_USB"); 
          CAMERA_USB_PORT_ERROR_SOLVE("RE_UN_BIND_USB"); 
        } 

         FFMPEG_ERROR.result = false;
         FFMPEG_ERROR.reason = data.toString();
    }
        
  });

  ffmpegProcess.stdout.on('end', () => {
  console.log('ffmpegProcess stdout No more output data stream ended');
  });

 ffmpegProcess.stderr.on('end', () => {
  console.log('ffmpegProcess stderr No more error data stream ended');
 });

 // 7. stderr error
ffmpegProcess.stderr.on('error', (err) => {
  console.error('ffmpegProcess stderr error:', err.code);
});

// 8. stdin error
ffmpegProcess.stdin.on('error', (err) => {
  console.error('ffmpegProcess stdin error:', err.code);
});


  // ✅ CONFIRM START
     ffmpegProcess.once("spawn", () => {
     console.log("✅ FFMPEG STARTED CORRECTLY");
     FFMPEG_ERROR.result = true;
     FFMPEG_ERROR.reason = "RECORDING_START";
  });

  // 🛑 EXIT
  // ffmpegProcess.on("exit", code => {
  //   console.warn("⚠️ FFMPEG EXITED:", code);
  // });

  ffmpegProcess.on('exit', (code, signal) => {
  console.log("🧹 FFMPEG EXITED:", code);      // 0 = success, non-zero = error
  console.log('🧹 FFMPEG Signal:', signal);     // SIGTERM, SIGKILL, etc.
});

// Examples:
// code: 0, signal: null         → Normal exit
// code: 1, signal: null         → Error exit

ffmpegProcess.on('error', (error) => {
  console.error('Error:', error);
  if (error.code === 'ENOENT') {
    console.error('ffmpegProcess Command not found!');
  }else if(error.code === 'EACCES') {
    console.error('ffmpegProcess Permission denied!');
  }else if (error.code === 'EPERM') {
    console.error('ffmpegProcess POperation not permitted');
  }else {
    console.error('ffmpegProcess Stream error:', error.code);
  }
});

// Common errors:
// ENOENT → Command not found
// EACCES → No permission to execute
// EPERM  → Operation not permitted

ffmpegProcess.on('close', (code, signal) => {
  console.log('🧹 FFMPEG All streams closed');
   console.warn("🧹 FFMPEG CLOSED:", code);
  console.log('🧹 FFMPEG Signal:', signal);
 // ffmpegProcess = null;
  //ffmpegStopping = false; 
  //mp4Header = null;
});

  // 🧹 CLOSE
  // ffmpegProcess.on("close", code => {
  //   console.warn("🧹 FFMPEG CLOSED:", code);
  //  // if(code == 255){
  //    ffmpegProcess = null;
  //    ffmpegStopping = false; 
  //    //mp4Header = null;
  // // }
  // });

    return { success: FFMPEG_ERROR.result, errorId: FFMPEG_ERROR.INVALID_ARGUMENT, reason:FFMPEG_ERROR.reason  };
 
}

function notifyLiveClientsclear(){
  liveClients.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "CLEAR_STREAM" }));
    }
  });
}


function notifyLiveClientsReset(){
  liveClients.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "RESET_STREAM" }));
    }
  });
}

function detectSdCardAsync() {
  return new Promise(resolve => {
    detectSdCard(mount => resolve(mount));
  });
}

function detectUsbCameraAsync() {
  return new Promise(resolve => {
    detectUsbCamera(dev => resolve(dev));
  });
}


app.post("/start", async (req, res) => {

  console.log("/start request receive");

  try {

    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ error: "INVALID_REQUEST_BODY" });
    }

    if (RECORDING_STATE.active) {
       console.log("/start request RECORDING_ALREADY_RUNNING",RECORDING_STATE.active);
      return res.status(400).json({ error: "RECORDING_ALREADY_RUNNING" });
    }

    const { filename } = req.body;

    // 🔍 Hardware checks (NOW REAL async)
    const sdMount = await detectSdCardAsync();
    if (!sdMount) {
      return res.status(400).json({ error: "SD_CARD_NOT_DETECTED" });
    }

    const videoDev = await findCameraPortPath2();
   if (!videoDev || !videoDev.videoNode){
     console.log(" CAMERA_USB_ERROR_RESET:", videoDev);
     return res.status(400).json({ error: "CAMERA_USB_ERROR_RESET" });
   }

  console.log("BEFORE CAMERA_CONFIGURATION:", CAMERA_CONFIGURATION);
  console.log("✅ Camera detected:", videoDev);
  CAMERA_CONFIGURATION.DEVICE_NODE = videoDev.videoNode;
  console.log(" FINAL CAMERA_CONFIGURATION:", CAMERA_CONFIGURATION);


    // const videoDev = await detectUsbCameraAsync();
    // if (!videoDev) {
    //   return res.status(400).json({ error: "HD_CAMERA_NOT_DETECTED" });
    // }

    // 🔑 CHECK DEVICE READINESS
    // const isReady = await waitForCameraReady();
    // if (!isReady) {
    //   // Try to reset and check again
    //  // await resetCameraDevice();

    //   const isReadyAfterReset = await waitForCameraReady();
    //   if (!isReadyAfterReset) {
    //     return res.status(500).json({ error: "CAMERA_NOT_READY" });
    //   }
    // }


    // 🧠 Filename logic
    const FILE_NAME_TEMP = typeof filename === "string" && filename.trim() ? filename.trim() : `video_${GET_DATE_TIME_FORMATED()}`;
    // 🔁 Restart FFmpeg if live-only is running

    // if (ffmpegProcess  && ffmpegStopping == false){
    //  await stopFFmpeg("🧹 Restarting FFmpeg for recording");
    // }

    
       RECORDING_STATE.active = true;
       mp4Header = null;

      WESOCKET_SEND_DATA_CONNECTED_FLAG = false;
     
     
     if(ffmpegProcess && liveClients.size >= 1  && WESOCKET_CONNECTED_FLAG){
      console.log("🔄 Transitioning from live-only to live + recording  // Notify clients to expect reconnection");
      notifyLiveClientsclear();

      // liveClients.forEach(ws => {
      //   if (ws.readyState === WebSocket.OPEN) {
      //     ws.send(JSON.stringify({ type: "STREAM_RESTART", reason: "CLEAR_SREAM_NEW_REC_START" }));
      //   }
     // });
    }
  
      if (ffmpegProcess && !ffmpegStopping){
      await killFFmpeg("🧹 CLEANUP ON NEW RECORDING START");
      await new Promise(r => setTimeout(r, 500));
    }else{
      await new Promise(r => setTimeout(r, 1000));}



 if (ffmpegProcess == null && ffmpegStopping == false ){
      
    // 📁 Paths
    RECORDING_STATE.segments = [];
    mp4Header = null;
    WESOCKET_SEND_DATA_CONNECTED_FLAG = true;



    const outputPath = getUniqueFilePath(videosDir,FILE_NAME_TEMP,CAMERA_CONFIGURATION.EXTENSION );
    const segmentPath = getNextSegmentPath(FILE_NAME_TEMP);
    console.log("FIRST segment path:", segmentPath);
    // ▶ Start FFmpeg
    RUN_FFMPEG_ARGUMENT_COMMAND({ enableLive: LIVE_STREAM_ENABLED,outputPath: segmentPath});
    setTimeout(() => { console.log("RUN_FFMPEG_ARGUMENT_COMMAND OUTPUT",FFMPEG_ERROR);
     console.error("START REQUEST RESPOND SEND");
     if (!FFMPEG_ERROR.result){

      RECORDING_STATE.active = false;
      console.error(" RUN_FFMPEG_ARGUMENT_COMMAND FAILED");
      return res.status(500).json({
        success: FFMPEG_ERROR.result,
        error: "CAMERA_FAILED",
        reason: FFMPEG_ERROR.reason
      });
   
   
    }else{

    // ✅ Update state AFTER FFmpeg success
    RECORDING_STATE.curr_segment = segmentPath;
    RECORDING_STATE.segments.push(segmentPath);
    RECORDING_STATE.status = "RECORDING";
    RECORDING_STATE.filename = FILE_NAME_TEMP; 
    RECORDING_STATE.FINAL_FINAL_NAME = path.basename(outputPath);
    RECORDING_STATE.folder_name =  GET_DATE_FORMATED();
    RECORDING_STATE.FINAL_FILE_PATH =  outputPath;//.replace(/\.mkv$/i, ".mp4");;
    RECORDING_STATE.active = true;
    RECORDING_STATE.REC_START_TIME = Date.now();
    RECORDING_STATE.paused = false;
    RECORDING_STATE.pausedAt = null;
    RECORDING_STATE.totalPausedMs = 0;

      //     // Notify clients that stream is ready again
      // if (LIVE_STREAM_ENABLED && WESOCKET_CONNECTED_FLAG){
      //   setTimeout(() => {
      //     liveClients.forEach(ws => {
      //       if (ws.readyState === WebSocket.OPEN) {
      //         ws.send(JSON.stringify({ type: "STREAM_READY" }));
      //          if (mp4Header) {
      //            ws.send(mp4Header);
      //          }
      //       }
      //     });
      //   }, 100);
      // }
    
     return res.json({
      success: true,
      filename:   RECORDING_STATE.FINAL_FINAL_NAME,
      foldername : RECORDING_STATE.folder_name,
      url:       path.join( "videos",RECORDING_STATE.folder_name, RECORDING_STATE.FINAL_FINAL_NAME), //RECORDING_STATE.FINAL_FILE_PATH,
      state: RECORDING_STATE.status,
      RECORDING_STATE :RECORDING_STATE,
      CAM_CONFIG : null
    });
  }
    }, 2000); 
    
   
  }else{    

    console.log("/start request CAMERA_ALREADY_RUNNING 2ffmpegStopping: ",ffmpegStopping);
    return res.status(500).json({ error: "CAMERA_ALREADY_RUNNING" });

  }
  // console.error("START REQUEST RESPOND SEND");
  //   return res.json({
  //     success: true,
  //     filename: RECORDING_STATE.filename,
  //     foldername : RECORDING_STATE.folder_name,
  //     url:       RECORDING_STATE.FINAL_FILE_PATH,
  //     state: RECORDING_STATE.status,
  //     RECORDING_STATE :RECORDING_STATE,
  //     CAM_CONFIG : null
  //   });

  } catch (err) {
    console.error("START_FAILED:", err);
    return res.status(500).json({ error: "START_FAILED" });
  }
});


app.post("/pause", async (req, res) => {
  console.log("⏸ PAUSE request received");

  if (!RECORDING_STATE.active || RECORDING_STATE.paused) {
     console.log("PAUSE invalid state no recording or already pause rec state: ",RECORDING_STATE.active );
    return res.status(400).json({ error: "INVALID_STATE" });
  }

  try {

    RECORDING_STATE.paused = true;
    RECORDING_STATE.pausedAt = Date.now(); // ✅ freeze timer
    RECORDING_STATE.status = "PAUSED";

      if (ffmpegProcess && ffmpegStopping == false ) {
          killFFmpeg("pause request recieve stop FFmpeg...");
          console.log("⏸ RECORDING PAUSED at", RECORDING_STATE.pausedAt);

      return res.json({
      success: true,
      filename:   RECORDING_STATE.FINAL_FINAL_NAME,
      foldername : RECORDING_STATE.folder_name,
      url:       path.join( "videos",RECORDING_STATE.folder_name, RECORDING_STATE.FINAL_FINAL_NAME), //RECORDING_STATE.FINAL_FILE_PATH,
      state: RECORDING_STATE.status,
      RECORDING_STATE :RECORDING_STATE,
      CAM_CONFIG : null
    });

        }else{ 
           console.error("PAUSE ffmpegProcess EEROR :");
           res.status(500).json({ error: "PAUSE_FAILED" });
          }

  } catch (err) {
    console.error("PAUSE_FAILED:", err);
    res.status(500).json({ error: "PAUSE_FAILED" });
  }
});




app.post("/resume", (req, res) => {

    console.log("▶ RESUMED request RECIEVE");
    if (!RECORDING_STATE.active || !RECORDING_STATE.paused){
      console.log("▶RESUMED INVALID_STATE REC NOT ACTIVE",RECORDING_STATE.active);
    return res.status(400).json({ error: "INVALID_STATE" });
      }

  try{
  

    const baseName = RECORDING_STATE.filename; 
    console.log("RESUME baseName NAME ",baseName);
    const segmentPath = getNextSegmentPath(baseName);
    console.error("RESUME NEW SEGMENT NAME ",segmentPath);
    const pausedDuration = Date.now() - RECORDING_STATE.pausedAt;
  
   RECORDING_STATE.curr_segment = segmentPath;
   RECORDING_STATE.segments.push(segmentPath);
   RECORDING_STATE.status = "RECORDING";
   RECORDING_STATE.filename = baseName;
   RECORDING_STATE.totalPausedMs += pausedDuration;
   RECORDING_STATE.paused = false;
   RECORDING_STATE.pausedAt = null; // ✅ VERY IMPORTANT
   RECORDING_STATE.active = true;

      if( liveClients.size >= 1  && WESOCKET_CONNECTED_FLAG){
      console.log("🔄 Transitioning from live-only to live + recording  // Notify clients to expect reconnection");
      notifyLiveClientsclear();
    }

    // const result = RUN_FFMPEG_ARGUMENT_COMMAND({ enableLive: LIVE_STREAM_ENABLED,outputPath: segmentPath });
    // if (!result.success){
    //   console.error("❌ RESUME_START_FAILED", result);
    //   return res.status(500).json({error: "RESUME_START_FAILED",reason: result.reason});
    // }
       // ▶ Start FFmpeg
    RUN_FFMPEG_ARGUMENT_COMMAND({ enableLive: LIVE_STREAM_ENABLED,outputPath: segmentPath});
    setTimeout(() => { console.log("PAUSE REQUEST RUN_FFMPEG_ARGUMENT_COMMAND OUTPUT",FFMPEG_ERROR);
     console.error("START REQUEST RESPOND SEND");
     if (!FFMPEG_ERROR.result){
      console.error(" RUN_FFMPEG_ARGUMENT_COMMAND FAILED");
      return res.status(500).json({
        success: FFMPEG_ERROR.result,
        error: "CAMERA_FAILED",
        reason: FFMPEG_ERROR.reason
      });
    }else{

        return res.json({
      success: true,
      filename:   RECORDING_STATE.FINAL_FINAL_NAME,
      foldername : RECORDING_STATE.folder_name,
      url:       path.join( "videos",RECORDING_STATE.folder_name, RECORDING_STATE.FINAL_FINAL_NAME), //RECORDING_STATE.FINAL_FILE_PATH,
      state: RECORDING_STATE.status,
      RECORDING_STATE :RECORDING_STATE,
      CAM_CONFIG : null
    });
  }
    }, 1000); 

    console.log("▶ RECORDING RESUMED");

  }catch (err){
    console.error("RESUME FAILED:", err);
    res.status(500).json({ error: "RESUME_FAILED" });
  }

});

let segmentListFile = null;
async function mergeSegmentsWithRetry(segments, finalMp4, maxRetries = 3) {
 
 
  for (let attempt = 1; attempt <= maxRetries; attempt++) {

    console.log(`\n🔄 Merge attempt ${attempt}/${maxRetries}`);
    
    try {
      // Validate segments exist
      const missingFiles = [];
      const emptyFiles = [];
      
      for (const file of segments) {
        if (!fs.existsSync(file)) {
          missingFiles.push(file);
        } else {
          const stats = fs.statSync(file);
          if (stats.size === 0) {
            emptyFiles.push(file);
          }
        }
      }
      
      if (missingFiles.length > 0) {
        throw new Error(`Missing segments: ${missingFiles.join(', ')}`);
      }
      
      if (emptyFiles.length > 0) {
        console.warn(`⚠️ Empty segments found: ${emptyFiles.join(', ')}`);
      }
      
      // Create segment list file
      const segmentListFile = path.join(videosDir, `rec_video_segments_${Date.now()}.txt`);
      fs.writeFileSync(segmentListFile, segments.map(f => `file '${f}'`).join("\n"));
      console.log("📄 Segment list created:", segmentListFile);
      
      // Merge segments
      const result = await new Promise((resolve, reject) => {
        
        const merge = spawn("ffmpeg", [
          "-y",
          "-f", "concat",
          "-safe", "0",
          "-i", segmentListFile,
          "-c", "copy",
          "-movflags", "+faststart",
          finalMp4
        ]);
        
        let stderrOutput = "";
        
        merge.stderr.on("data", data => {
          const msg = data.toString();
          stderrOutput += msg;
         // console.log("FFMPEG_MERGE:", msg.trim());
        });
        
        merge.on("error", err => {
          reject({
            type: "SPAWN_ERROR",
            message: err.message,
            stderr: stderrOutput
          });
        });
        
        merge.on("close", code => {
          // Clean up segment list file
          try {
            if (fs.existsSync(segmentListFile)) {
              fs.unlinkSync(segmentListFile);
            }
          } catch (e) {
            console.warn("⚠️ Failed to delete segment list:", e.message);
          }
          
          if (code === 0) {
            // Check if output file exists and is valid
            if (!fs.existsSync(finalMp4)) {
              reject({
                type: "OUTPUT_NOT_CREATED",
                message: "Merge succeeded but output file not found",
                stderr: stderrOutput
              });
              return;
            }
            
            const stats = fs.statSync(finalMp4);
            if (stats.size === 0) {
              reject({
                type: "EMPTY_OUTPUT",
                message: "Output file is empty",
                stderr: stderrOutput
              });
              return;
            }
            
            console.log(`✅ Merge successful! Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
            resolve({ success: true, size: stats.size });
            
          } else {
            // Analyze stderr for specific errors
            let errorType = "UNKNOWN_ERROR";
            let errorMessage = `FFmpeg exited with code ${code}`;
            
            if (stderrOutput.includes("Invalid data found")) {
              errorType = "INVALID_DATA";
              errorMessage = "Invalid or corrupted data in segment files";
            } else if (stderrOutput.includes("No such file")) {
              errorType = "FILE_NOT_FOUND";
              errorMessage = "Segment file not found during merge";
            } else if (stderrOutput.includes("Permission denied")) {
              errorType = "PERMISSION_DENIED";
              errorMessage = "Permission denied accessing files";
            } else if (stderrOutput.includes("moov atom not found")) {
              errorType = "MOOV_ATOM_MISSING";
              errorMessage = "Segment file missing moov atom (incomplete)";
            } else if (stderrOutput.includes("No space left")) {
              errorType = "NO_SPACE";
              errorMessage = "No space left on device";
            } else if (stderrOutput.includes("I/O error")) {
              errorType = "IO_ERROR";
              errorMessage = "I/O error reading/writing files";
            } else if (stderrOutput.includes("Timestamps are unset")) {
              errorType = "TIMESTAMP_ERROR";
              errorMessage = "Timestamp issues in segments";
            }
            
            reject({
              type: errorType,
              message: errorMessage,
              code: code,
              stderr: stderrOutput
            });
          }
        });
      });
      
      return result; // Success!
      
    } catch (error) {
      console.error(`❌ Merge attempt ${attempt} failed:`);
      console.error(`   Type: ${error.type || "UNKNOWN"}`);
      console.error(`   Message: ${error.message}`);
      
      if (error.stderr) {
        console.error(`   FFmpeg output (last 500 chars):`);
        console.error(`   ${error.stderr.slice(-500)}`);
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry
      console.log(`⏳ Waiting 2 seconds before retry...`);
      await new Promise(r => setTimeout(r, 2000));
      
      // Clean up failed output if it exists
      if (fs.existsSync(finalMp4)) {
        try {
          fs.unlinkSync(finalMp4);
          console.log("🗑️ Deleted failed output file");
        } catch (e) {
          console.warn("⚠️ Could not delete failed output:", e.message);
        }
      }
    }
  }
}

app.post("/stop", async (req, res) => {
  
  console.log("⏹ STOP request received");
  
  if (!RECORDING_STATE.active) {
    console.log("NO_ACTIVE_RECORDING");
    return res.status(400).json({ error: "NO_ACTIVE_RECORDING" });
  }

  try {
    // Stop FFmpeg
    if (ffmpegProcess && ffmpegStopping == false) {
        console.log("🧹 Stopping FFmpeg...");
        killFFmpeg("Stop request received");
     }
    
    RECORDING_STATE.REC_STOP_TIME = Date.now();
    RECORDING_STATE.REC_VIDEO_DURATION = RECORDING_STATE.REC_STOP_TIME - RECORDING_STATE.REC_START_TIME;
    
    // Prepare final output path
    let finalMp4 = RECORDING_STATE.FINAL_FILE_PATH;
    if (!finalMp4.endsWith(".mp4")) {
      finalMp4 += ".mp4";
    }
    console.log("🎬 Final MP4:", finalMp4);

    const segments = RECORDING_STATE.segments;
    console.log("📋 Total segments:", segments.length);
    
    if (!segments || segments.length === 0) {
      throw new Error("NO_SEGMENTS_FOUND");
    }

    // Check segment files
    console.log("\n🔍 Checking segment files:");
    for (const file of segments) {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        console.log(`✅ ${path.basename(file)} - ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
      } else {
        console.log(`❌ ${path.basename(file)} - NOT FOUND`);
      }
    }

    // Merge with retry
    console.log("\n🎬 Starting merge process...");
    const mergeResult = await mergeSegmentsWithRetry(segments, finalMp4, 3);
    console.log("✅ Merge completed successfully!");

    // Clean up segment files
    console.log("\n🗑️ Cleaning up segment files...");
    let deletedCount = 0;

    for (const file of segments){
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          deletedCount++;
          console.log(`🗑️ Deleted: ${path.basename(file)}`);
        }
      } catch (e) {
        console.warn(`⚠️ Could not delete ${path.basename(file)}:`, e.message);
      }
    }

    console.log(`✅ Deleted ${deletedCount}/${segments.length} segment files`);


        // Reset recording state
       RECORDING_STATE.curr_segment = null;
       RECORDING_STATE.status = "IDLE";
       RECORDING_STATE.active = false;
       RECORDING_STATE.paused = false;
       
       RECORDING_STATE.pausedAt = null;
       RECORDING_STATE.totalPausedMs = 0;
       RECORDING_STATE.timer_msec = null;
       RECORDING_STATE.timer_state = "OFF";
       RECORDING_STATE.audio_mute_flag = false;
       RECORDING_STATE.segments = [];
      // RECORDING_STATE.FINAL_FILE_PATH 
    
    console.log("🏁 RECORDING COMPLETED");

    res.json({
         success: true,
      filename:   RECORDING_STATE.FINAL_FINAL_NAME,
      foldername : RECORDING_STATE.folder_name,
      url:       path.join( "videos",RECORDING_STATE.folder_name, RECORDING_STATE.FINAL_FINAL_NAME), //RECORDING_STATE.FINAL_FILE_PATH,
      state: RECORDING_STATE.status,
      RECORDING_STATE :RECORDING_STATE,
      CAM_CONFIG : null
        });

        RECORDING_STATE.filename = null;
        RECORDING_STATE.folder_name =  null;
        RECORDING_STATE.REC_START_TIME = null;
        RECORDING_STATE.REC_STOP_TIME = null;
        RECORDING_STATE.REC_VIDEO_DURATION  = null;
        RECORDING_STATE.FINAL_FINAL_NAME = null;
  
    // Restart live stream if needed
    if (WESOCKET_CONNECTED_FLAG && LIVE_STREAM_ENABLED && liveClients.size >= 1) {
        console.log("🎥 Restarting live stream...");
        ALLOWED_LIVE_FLAG = true;
        // notifyLiveClientsReset();
    
        for (const ws of liveClients) {
       if (ws.readyState === ws.OPEN) {
          ws.close(1000, "STOP EVENT"); // SERVER ERROR
       }
      }
    
        // ws.close(1000, "Done");

  //   setTimeout(() => {
  //   if (ws.readyState !== ws.CLOSED) {
  //   console.warn("⚠️ Forcing WS termination");
  //   ws.terminate(); // HARD close (TCP RST)
  //  }
  //  }, 3000);
      
  }

  } catch (err) {

    console.error("\n❌ STOP FAILED");
    console.error("Error type:", err.type || "UNKNOWN");
    console.error("Error message:", err.message);
    
    // Clean up segment files on error
    console.log("\n🗑️ Cleaning up after error...");
    for (const file of RECORDING_STATE.segments){
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          console.log(`🗑️ Deleted: ${path.basename(file)}`);
        }
      } catch (e) {
        console.warn(`⚠️ Could not delete ${path.basename(file)}:`, e.message);
      }
    }

    // Reset state
     RECORDING_STATE.FINAL_FINAL_NAME = null;
    RECORDING_STATE.curr_segment = null;
    RECORDING_STATE.status = "IDLE";
    RECORDING_STATE.active = false;
    RECORDING_STATE.paused = false;
    RECORDING_STATE.pausedAt = null;
    RECORDING_STATE.totalPausedMs = 0;
    RECORDING_STATE.segments = [];
    RECORDING_STATE.filename = null;
    RECORDING_STATE.folder_name = null;
    RECORDING_STATE.REC_START_TIME = null;
    RECORDING_STATE.REC_STOP_TIME = null;
    RECORDING_STATE.REC_VIDEO_DURATION = null;
    RECORDING_STATE.timer_msec = null;
    RECORDING_STATE.timer_state = "OFF";
    RECORDING_STATE.audio_mute_flag = false;

    // Restart live stream if needed
    if (WESOCKET_CONNECTED_FLAG && LIVE_STREAM_ENABLED && liveClients.size >= 1) {
      console.log("🎥 Restarting live stream after error...");
      ALLOWED_LIVE_FLAG = true;
      mp4Header = null;
      for (const ws of liveClients) {
           console.log("wss CLOSING WS CLIENT IN STOP ERROR ...",liveClients.length);
       if (ws.readyState === ws.OPEN) {
          ws.close(1000, "STOP ERROR EVENT"); // SERVER ERROR
       }
      }
     // notifyLiveClientsReset();
    }

    res.status(500).json({
      error: "STOP_FAILED",
      type: err.type || "UNKNOWN",
      message: err.message,
      details: err.stderr ? "Check server logs for FFmpeg output" : undefined
    });
  }
});



app.post("/reset", async (req, res) => {

      console.log("\n🗑️ reset REQUEST RECIEVE...");
   
 try {

  for (const ws of liveClients){
      console.log("wss CLOSING WS CLIENT IN RESET ...",liveClients.length);
       if (ws.readyState === ws.OPEN) {
          ws.close(1000, "STOP EVENT RESET"); // SERVER ERROR
       }
      }

   if (ffmpegProcess  && ffmpegStopping == false){
         stopFFmpeg("⛔PAUSE STOP RECORDING");
        }

    for (const file of RECORDING_STATE.segments){
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          console.log(`🗑️ Deleted: ${path.basename(file)}`);
        }
      } catch (e) {
        console.warn(`⚠️ Could not delete ${path.basename(file)}:`, e.message);
      }
    }
   
    if( segmentListFile && fs.existsSync(segmentListFile)){
       console.log("🗑 Deleted segmentListFile:", segmentListFile);
      fs.unlinkSync(segmentListFile); }


     // Reset state
      RECORDING_STATE.FINAL_FINAL_NAME = null;
    RECORDING_STATE.curr_segment = null;
    RECORDING_STATE.status = "IDLE";
    RECORDING_STATE.active = false;
    RECORDING_STATE.paused = false;
    RECORDING_STATE.pausedAt = null;
    RECORDING_STATE.totalPausedMs = 0;
    RECORDING_STATE.segments = [];
    RECORDING_STATE.filename = null;
    RECORDING_STATE.folder_name = null;
    RECORDING_STATE.REC_START_TIME = null;
    RECORDING_STATE.REC_STOP_TIME = null;
    RECORDING_STATE.REC_VIDEO_DURATION = null;
    RECORDING_STATE.timer_msec = null;
    RECORDING_STATE.timer_state = "OFF";
    RECORDING_STATE.audio_mute_flag = false;

    if (WESOCKET_CONNECTED_FLAG && LIVE_STREAM_ENABLED && liveClients.size >= 1) {
        console.log("RE STARTED LIVE_STREAM_ENABLED");
        ALLOWED_LIVE_FLAG = true;
         notifyLiveClientsReset();
      }
       
 res.json({
        success: true,
         filename:   ( RECORDING_STATE.filename + CAMERA_CONFIGURATION.EXTENSION),
       foldername : RECORDING_STATE.folder_name,
      //  url:       path.join( "videos",RECORDING_STATE.folder_name,(RECORDING_STATE.filename + CAMERA_CONFIGURATION.EXTENSION)), //RECORDING_STATE.FINAL_FILE_PATH,
        state:     RECORDING_STATE.status,
        RECORDING_STATE : RECORDING_STATE
        });

      } catch (err) {  
              console.log("\n🗑️ reset REQUEST RECIEVE AND FAILED...");
        res.status(500).json({

      error: "RESET_FAILED",
      type: err.type || "UNKNOWN",
      message: err.message,
      details: err.stderr ? "Check server logs for FFmpeg output" : undefined
    });    }   
  
});

let ffmpegClosingPromise = null;

function waitForFFmpegClose() {

  if (!ffmpegProcess) return Promise.resolve();
  if (!ffmpegClosingPromise) {
    ffmpegClosingPromise = new Promise(resolve => { ffmpegProcess.once("close", () => { console.log("✅ FFMPEG FULLY CLOSED");
       // ffmpegProcess = null;
        ffmpegClosingPromise = null;
        resolve();
      });
    });
  }
  return ffmpegClosingPromise;
}
wss.on("connection", async (ws, req) => {

  console.log("WS CLIENT CONNECTED REQUEST");

  liveClients.add(ws);
  const clientId = Date.now() + Math.random().toString(36).substr(2, 9);
  const clientIp = req.socket.remoteAddress;
  const clientIport  = req.socket.remotePort;
  const clientIFamily  = req.socket.remoteFamily;
  
  console.log(`\n🔌 WS CLIENT CONNECTED`);
  console.log(`   ID: ${clientId}`);
  console.log(`   IP: ${clientIp}`);
  console.log(`   port: ${clientIport}`);
  console.log(`   family: ${clientIFamily}`);

  WESOCKET_CONNECTED_FLAG = true;
  console.log("wss CONNECT REQ LIVE CLIENT COUNT: ", liveClients.size,RECORDING_STATE.active);

 //🔑 KEY FIX: Don't start new FFmpeg if recording is active
  ws.onmessage = event => { 

    if (typeof event.data === "string"){
        const msg = JSON.parse(event.data);
        console.log("WSS RECIEVE EVENT MESSAGE",msg);
        if (msg.type === "STREAM_HEADER"){
            console.log("🔁 VIDEO HEADER REQ ",msg.message);
             if (mp4Header){
              // console.log("📦 Sending MP4 header to new client",mp4Header);
              //  ws.send(mp4Header);
                }
            return;
        }

    }

  }

 if (RECORDING_STATE.active) {
    console.log("📹 Recording active - client joining existing stream");
    // Send header to new client if available
    await new Promise(r => setTimeout(r, 3000));
    if (mp4Header){
      console.log("📦 Sending MP4 header to new client",mp4Header);
      ws.send(mp4Header);
    }

    // Notify client that stream is ready
    ws.send(JSON.stringify({ type: "STREAM_READY",message: RECORDING_STATE.status }));
     return; // Don't start new FFmpeg
  
  }

 if(ffmpegStopping && ffmpegProcess ){
    console.log("📦 WAIT ffmpegStopping IS TRUE BEFORE STARTING NEW LIVE ",);
     await new Promise(r => setTimeout(r, 3000));
  }


if (ffmpegProcess){
    console.log("📺 Live stream already running - adding client");
      ws.send(JSON.stringify({ type: "STREAM_READY", message: "ALREADY LIVE SESSION STARTED SENDDING MP4 HEADER"}));
      await new Promise(r => setTimeout(r, 3000));
    if (mp4Header) {
      console.log("📦 Sending MP4 header to new client",mp4Header);
     ws.send(mp4Header);
    }
   return;
  }

if ( !ALLOWED_LIVE_FLAG && !ffmpegProcess && RECORDING_STATE.active &&  liveClients.size > 1 ){
  ALLOWED_LIVE_FLAG = true;
}


if ( ALLOWED_LIVE_FLAG && !ffmpegProcess ){
  
  ALLOWED_LIVE_FLAG = false;
  // const cameraExists = await ensureCameraExists();
    
  //   if (!cameraExists) {
  //     console.error("❌ Camera not available");
  //     ws.send(JSON.stringify({ 
  //       type: "ERROR", 
  //       message: "Camera not detected. Please reconnect camera." 
  //     }));
  //     return;
  //   }

   // Check if camera is ready before starting
    // const ready = await waitForCameraReady(2000);
    // if (!ready) {
    //   console.error("❌ Camera not ready for live stream");
    //   ws.send(JSON.stringify({ 
    //     type: "ERROR", 
    //     message: "CAMERA_NOT_READY" 
    //   }));
    //   return;
    // }
       const videoDev = await findCameraPortPath2();
       if (!videoDev || !videoDev.videoNode){
       console.log(" CAMERA_USB_ERROR_RESET:", videoDev);
       ws.send(JSON.stringify({ type: "ERROR", message: "USB_CAMERA_ERROR" }));
       return;
      }

  console.log("LIVE BEFORE CAMERA_CONFIGURATION:", CAMERA_CONFIGURATION);
  console.log("✅ LIVE Camera detected:", videoDev);
  CAMERA_CONFIGURATION.DEVICE_NODE = videoDev.videoNode;
  console.log("LIVE FINAL CAMERA_CONFIGURATION:", CAMERA_CONFIGURATION);
      
  await new Promise(r => setTimeout(r, 500));
    
    const result = RUN_FFMPEG_ARGUMENT_COMMAND({
      enableLive: true,
      outputPath: null
    });
    
    setTimeout(() => {
      if (!FFMPEG_ERROR.result){
        console.error("❌ WSS Failed to start live stream");
        ws.send(JSON.stringify({ type: "ERROR", message: "Failed to start live stream" }));
      } else{
        console.log("✅ WSS LIVE STREAM STARTED");
        ws.send(JSON.stringify({ type: "STREAM_READY", message: "NEW LIVE SESSION STARTED"}));
      }

    }, 1000);
  }else{ console.log("✅ WSS LIVE STREAM ALREADY REGISTER WAIT TO CLEAN UP");    } 
  
  ws.on("close", (code, reason) => {
  
    console.log(`\n🔌 WS CLIENT DISCONNECTED`);
    console.log(`   ID: ${clientId}`);
    console.log(`   IP: ${clientIp}`);
   console.log(`   port: ${clientIport}`);
   console.log(`   family: ${clientIFamily}`);

    console.log(`   Code: ${code}`);
    console.log(`   Reason: ${reason || "none"}`);
   
    liveClients.delete(ws);
   console.log("wss CLOSE REQ  LIVE CLIENT COUNT:", liveClients.size, RECORDING_STATE.active);
   

     if (liveClients.size === 0) {
      ALLOWED_LIVE_FLAG = true;
      if (RECORDING_STATE.active){
        console.log("📹 Recording active - keeping FFmpeg running");
        WESOCKET_CONNECTED_FLAG = false;
        mp4Header = null; // Clear header for next connection
      } else if (ffmpegProcess){
        WESOCKET_CONNECTED_FLAG = false;
        stopFFmpeg("🛑 NO LIVE CLIENTS → STOPPING LIVE FFMPEG");
      }
    }
  });

 ws.on("error", err => {
    console.error("WebSocket error:", err);
    liveClients.delete(ws);
    ws.terminate();
  });

});



// wss.on("connection", async ws => {
//   console.log("WS CLIENT CONNECTED REQUEST");

//   liveClients.add(ws);
//   WESOCKET_CONNECTED_FLAG = true;
//   console.log("LIVE CLIENT COUNT:", liveClients.size);

 

//   // Check if FFmpeg is already running (live-only mode)
//   if (ffmpegProcess) {
//     console.log("📺 Live stream already running - adding client");
    
//     if (mp4Header) {
//       console.log("📦 Sending MP4 header to new client");
//       ws.send(mp4Header);
//     }
    
//     return; // Client joins existing stream
//   }

//   // Start live-only stream for first client
//   if (liveClients.size === 1 && !ffmpegProcess) {
//     console.log("🎥 Starting live-only stream for first client");
    
//     await new Promise(r => setTimeout(r, 1000));
    
//     const result = RUN_FFMPEG_ARGUMENT_COMMAND({
//       enableLive: true,
//       outputPath: null
//     });
    
//     setTimeout(() => {
//       if (!FFMPEG_ERROR.result) {
//         console.error("❌ WSS live stream failed to start");
//         ws.send(JSON.stringify({ 
//           type: "ERROR", 
//           message: "Failed to start live stream" 
//         }));
//       } else {
//         console.log("✅ WSS LIVE STREAM STARTED");
//         ws.send(JSON.stringify({ type: "STREAM_READY" }));
//       }
//     }, 2000);
//   }

//   ws.on("close", async () => {
//     console.log("WS CLIENT DISCONNECTED");
//     liveClients.delete(ws);
//     console.log("LIVE CLIENT COUNT:", liveClients.size);

//     // 🔑 KEY FIX: Don't stop FFmpeg if recording is active
//     if (liveClients.size === 0) {
//       if (RECORDING_STATE.active) {
//         console.log("📹 Recording active - keeping FFmpeg running");
//         WESOCKET_CONNECTED_FLAG = false;
//         mp4Header = null; // Clear header for next connection
//       } else if (ffmpegProcess) {
//         console.log("🛑 No clients and no recording - stopping FFmpeg");
//         WESOCKET_CONNECTED_FLAG = false;
//         mp4Header = null;
//         await killFFmpeg("🛑 NO LIVE CLIENTS → STOPPING LIVE FFMPEG");
//       }
//     }
//   });

//   ws.on("error", err => {
//     console.error("WebSocket error:", err);
//     liveClients.delete(ws);
//   });
// });




// function startIdleLiveStream(){

//   if (ffmpegProcess && !RECORDING_STATE.active && WESOCKET_CONNECTED_FLAG  && LIVE_STREAM_ENABLED ){
//          console.log("KILL ffmpegProcess STREAM STOPPED");
//          ffmpegProcess.kill("SIGINT");
//          ffmpegProcess = null;
//       }


// console.log("🎥 startIdleLiveStream STARTING IDLE LIVE STREAM");

//   ffmpegProcess = spawn("ffmpeg", [
//   "-loglevel", "error",
//   "-f", "v4l2",
//   "-input_format", "h264",
//   "-video_size", "1920x1080",//CAMERA_CONFIGURATION.resolution, //     
//    "-framerate", "20",      //"-framerate",CAMERA_CONFIGURATION.fps,
//   "-i", "/dev/video0",
//   "-c:v", "copy",
//   // "-c:v libx264",
//   //"-preset", "veryfast",
//   //"-tune", "zerolatency",
//  // "-pix_fmt", "yuv420p",
//   //"-profile:v", "baseline",
//  // "-level", "4.2",
//  // "-b:v", "5M",
//  // "-maxrate", "5M",
//  // "-bufsize", "10M",
//  // "-g", "30", 
//   // fMP4 FOR MSE
//   "-f", "mp4",
//   "-movflags", "frag_keyframe+empty_moov+default_base_moof",
//   "-frag_duration", "100000",   // 100ms fragments
//   "pipe:1"
// ]);


// ffmpegProcess.stdout.on("data", chunk => {
//  console.log("FFMPEG STREAM data ",chunk);
//  if(WESOCKET_CONNECTED_FLAG  && LIVE_STREAM_ENABLED  ){
//   wss.clients.forEach(client => {
//         if (client.readyState === WebSocket.OPEN) {
//           client.send(chunk);
//          }
//         }); }

//      });


//   ffmpegProcess.on("close", () => {
//     console.log("🛑 IDLE LIVE STOPPED");
//    // ffmpegProcess = null;
//   });
// }


// wss.on("connection", ws => {
//   WESOCKET_CONNECTED_FLAG = true;
//   console.log("WS CLIENT CONNECTED REQUEST");
//   if(WESOCKET_CONNECTED_FLAG && LIVE_STREAM_ENABLED){
//     console.log("BOTH LIVE STREMING STARTED ");
//    startIdleLiveStream(); 
//    }else{

//   //   detectUsbCamera(videoDev =>{
//   // if(!videoDev){
//   //   console.log("HD CAMERA NOT DETECTED:");
//   //    return res.status(400).json({ error:"HD CAMERA NOT DETECTED"});
//   //   }
//   // });

//   if(!live_ffmpeg){

//    console.log("IDLE LIVE STREMING STARTED ");

//     live_ffmpeg =  spawn("ffmpeg", [
//   "-loglevel", "error",
//   "-f", "v4l2",
//   "-input_format", "h264",
//   "-video_size", "1920x1080",//CAMERA_CONFIGURATION.resolution, //     
//    "-framerate", "20",      //"-framerate",CAMERA_CONFIGURATION.fps,
//   "-i", "/dev/video0",
//   "-c:v", "copy",
//   // "-c:v libx264",
//   //"-preset", "veryfast",
//   //"-tune", "zerolatency",
//  // "-pix_fmt", "yuv420p",
//   //"-profile:v", "baseline",
//  // "-level", "4.2",
//  // "-b:v", "5M",
//  // "-maxrate", "5M",
//  // "-bufsize", "10M",
//  // "-g", "30", 
//   // fMP4 FOR MSE
//   "-f", "mp4",
//   "-movflags", "frag_keyframe+empty_moov+default_base_moof",
//   "-frag_duration", "100000",   // 100ms fragments
//   "pipe:1"
// ]);

//   }else{live_ffmpeg.kill("SIGINT"); }

//  live_ffmpeg.stdout.on("data", chunk => {
//   // console.log("FFMPEG STREAM data ",chunk);
//      wss.clients.forEach(client => {
//     if(client.readyState === WebSocket.OPEN) {
//           client.send(chunk);
//          }
//         });
//      });


//      live_ffmpeg.on("close", () => {
//      if( live_ffmpeg){
//       console.log("NULL FFMPEG STREAM STOPPED");
//     //    //live_ffmpeg.kill("SIGINT");
//     //  // live_ffmpeg = null; 
//       }
//      });

//   }


//  ws.on("close", () => {
//    console.log("WS CLIENT DISCONNECTED REQUEST ");
//    WESOCKET_CONNECTED_FLAG = false;

//     if(wss.clients.size === 0 && live_ffmpeg){
//       console.log("KILL FFMPEG STREAM STOPPED");
//       live_ffmpeg.kill("SIGINT");
//       live_ffmpeg = null;
//      }

//       if (ffmpegProcess && !RECORDING_STATE.active && WESOCKET_CONNECTED_FLAG  && LIVE_STREAM_ENABLED ){
//          console.log("KILL ffmpegProcess STREAM STOPPED");
//          ffmpegProcess.kill("SIGINT");
//          ffmpegProcess = null;
//       }
//   });

// });




// function isSafeName(name) {
//   return typeof name === "string" &&
//          name.length > 0 &&
//          !name.includes("..") &&
//          !name.includes("/") &&
//          !name.includes("\\");
// }

function isSafeName(name) {
  return /^[a-zA-Z0-9._-]+$/.test(name);
}
function isSafeName(name) {
  return /^[a-zA-Z0-9._-]+$/.test(name);
}


function sendError(res, status, code, message, details = {}) {
  return res.status(status).json({
    success: false,
    error: { code, message, details }
  });
}


app.get("/api/recordings/:folder", (req, res) => {

  try {
    // 1️⃣ Detect SD card
    detectSdCard(sdMount => {
      if (!sdMount) {
        console.error("❌ SD CARD NOT DETECTED");
        return res.status(400).json({ error: "SD_CARD_NOT_DETECTED" });
      }

      // 2️⃣ Validate folder name (security)
      const folderName = req.params.folder;
      if (!folderName || folderName.includes("..")) {
        return res.status(400).json({ error: "INVALID_FOLDER_NAME" });
      }

      // 3️⃣ Build folder path
      const folderPath = path.join(sdMountPoint, "videos", folderName);

      if (!fs.existsSync(folderPath)) {
        return res.status(404).json({ error: "FOLDER_NOT_FOUND" });
      }

      if (!fs.statSync(folderPath).isDirectory()) {
        return res.status(400).json({ error: "NOT_A_DIRECTORY" });
      }

      // 4️⃣ Read files safely
      let files;
      try {
        files = fs.readdirSync(folderPath);
      } catch (err) {
        console.error("❌ READDIR FAILED:", err.message);
        return res.status(500).json({ error: "READ_DIRECTORY_FAILED" });
      }

      let totalSizeBytes = 0;

      const videos = files
         .filter(f => f.toLowerCase().endsWith(".mp4") && !(f.toLowerCase().includes("_part")))
        .map(file => {
          const fullPath = path.join(folderPath, file);

          try {
            const stats = fs.statSync(fullPath);
            totalSizeBytes += stats.size;

            // 5️⃣ Duration using ffprobe
            let duration = "N/A";
            let durationSec = null;

            try {
              const seconds = execSync(
                `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${fullPath}"`
              ).toString().trim();

              if (seconds && !isNaN(seconds)) {
                durationSec = Number(seconds);
                duration = new Date(durationSec * 1000)
                  .toISOString()
                  .substr(11, 8);
              }
            } catch {
              console.warn("⚠️ ffprobe failed:", fullPath);
            }

            return {
              name: file,
              type: path.extname(file).slice(1).toUpperCase(),
              sizeBytes: stats.size,
              sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
              created: stats.birthtime
                .toISOString()
                .replace("T", " ")
                .slice(0, 19),
              duration,
              durationSec,
              url: `/videos/${folderName}/${file}`
            };

          } catch (err) {
            console.error("❌ FILE STAT FAILED:", fullPath, err.message);
            return null;
          }
        })
        .filter(Boolean) // remove failed entries
        .sort((a, b) => b.created.localeCompare(a.created));

      // 6️⃣ Final response
      res.json({
        folder: folderName,
        fileCount: videos.length,
        totalSizeBytes,
        totalSizeMB: (totalSizeBytes / (1024 * 1024)).toFixed(2),
        videos
      });
    });

  } catch (err) {
    console.error("💥 UNHANDLED ERROR:", err);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

app.get("/api/recordings", (req, res) => {

  detectSdCard(sdMount => {
    try {

      // 1️⃣ SD card check
      if (!sdMount) {
        console.error("❌ SD CARD NOT DETECTED");
        return res.status(400).json({ error: "SD_CARD_NOT_DETECTED" });
      }

      const baseDir = path.join(sdMount, "videos");

      // 2️⃣ Base folder check
      if (!fs.existsSync(baseDir)) {
        console.error("❌ VIDEOS FOLDER NOT FOUND:", baseDir);
        return res.status(404).json({ error: "VIDEOS_FOLDER_NOT_FOUND" });
      }

      // 3️⃣ Read folders safely
      const dirents = fs.readdirSync(baseDir, { withFileTypes: true });

      const folders = dirents
        .filter(d => d.isDirectory())              // only folders
        .map(d => {
          const folderPath = path.join(baseDir, d.name);

          let files;
          try {
            files = fs.readdirSync(folderPath)
              .filter(f => f.toLowerCase().endsWith(".mp4") && !(f.toLowerCase().includes("_part")));
          } catch (err) {
            console.error("⚠️ Folder read failed:", folderPath, err.message);
            return null; // skip this folder
          }

          if (files.length === 0) return null; // skip empty folders

          let totalSizeBytes = 0;
          let lastModifiedMs = 0;

          files.forEach(file => {
            try {
              const fullPath = path.join(folderPath, file);
              const stats = fs.statSync(fullPath);

              totalSizeBytes += stats.size;
              lastModifiedMs = Math.max(lastModifiedMs, stats.mtimeMs);
            } catch (err) {
              console.error("⚠️ File stat failed:", file, err.message);
            }
          });

          return {
            name: d.name,
            path: d.name,
            fileCount: files.length,
            totalSizeBytes, // raw value
            totalSizeMB: (totalSizeBytes / (1024 * 1024)).toFixed(2),
            modifiedMs: lastModifiedMs,
            modified: lastModifiedMs
              ? new Date(lastModifiedMs).toISOString().replace("T", " ").slice(0, 19)
              : "-"
          };
        })
        .filter(Boolean) // remove nulls
        .sort((a, b) => b.modifiedMs - a.modifiedMs); // newest first

      console.log("✅ RECORDINGS INDEX BUILT:", folders.length, "folders");

      return res.json({
        success: true,
        sdMount,
        folderCount: folders.length,
        folders
      });

    } catch (err) {
      console.error("💥 API FAILURE:", err);
      return res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: err.message
      });
    }
  });

});



app.get("/api/download/folder/:folder", (req, res) => {

  if (RECORDING_STATE.active) {
    return res.status(409).json({
      error: "RECORDING_IN_PROGRESS",
      message: "Stop recording before downloading"
    });
  }

  detectSdCard(sdMount => {

    const folder = req.params.folder;
    const folderPath = path.join(sdMountPoint, "videos", folder);

    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ error: "FOLDER_NOT_FOUND" });
    }

    const files = fs.readdirSync(folderPath)
      .filter(f => f.toLowerCase().endsWith(".mp4"))
      .filter(f => {
        const stat = fs.statSync(path.join(folderPath, f));
        return stat.size > 0; // stable file
      });

    if (files.length === 0) {
      return res.status(400).json({ error: "NO_FINALIZED_FILES" });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${folder}.zip"`);

    const archive = require("archiver")("zip", { zlib: { level: 9 } });

    archive.pipe(res);

    for (const file of files) {
      archive.file(path.join(folderPath, file), { name: file });
    }

    archive.finalize();
  });
});


app.get("/api/download/file/:folder/:filename", (req, res) => {

  // 1️⃣ Do not allow download during recording
  if (RECORDING_STATE.active) {
    return res.status(409).json({
      error: "RECORDING_IN_PROGRESS",
      message: "Stop recording before downloading files"
    });
  }

  detectSdCard(sdMount => {
    if (!sdMount) {
      return sendError(res, 400, "SD_CARD_NOT_DETECTED", "SD card not mounted");
    }

    const { folder, filename } = req.params;

    // 2️⃣ Security: prevent path traversal
    if (!isSafeName(folder) || !isSafeName(filename)) {
      return sendError(res, 400, "INVALID_PATH", "Invalid folder or filename");
    }

    // 3️⃣ Allow only video files
    const allowedExt = [".mp4"];
    const ext = path.extname(filename).toLowerCase();
    if (!allowedExt.includes(ext)) {
      return sendError(res, 400, "INVALID_FILE_TYPE", "Only MP4 files allowed");
    }

    const filePath = path.join(sdMountPoint, "videos", folder, filename);

    // 4️⃣ File existence
    if (!fs.existsSync(filePath)) {
      return sendError(res, 404, "FILE_NOT_FOUND", "Requested file not found");
    }

    const stat = fs.statSync(filePath);

    // 5️⃣ Must be a regular file
    if (!stat.isFile()) {
      return sendError(res, 400, "NOT_A_FILE", "Target is not a file");
    }

    // 6️⃣ Avoid sending empty / corrupted files
    if (stat.size === 0) {
      return sendError(res, 400, "EMPTY_FILE", "File is empty or invalid");
    }

    // 7️⃣ Headers (browser + download safe)
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    res.setHeader("Accept-Ranges", "bytes");

    // 8️⃣ Stream file safely
    const stream = fs.createReadStream(filePath);

    stream.on("error", err => {
      console.error("FILE STREAM ERROR:", err);
      if (!res.headersSent) {
        sendError(res, 500, "STREAM_ERROR", "Failed to stream file");
      }
    });

    // 9️⃣ Handle client disconnect
    res.on("close", () => {
      if (!res.writableEnded) {
        console.warn("Client aborted download:", filename);
        stream.destroy();
      }
    });

    stream.pipe(res);
  });
});


const LOCK_FILE = "/tmp/khadas_camera_server.lock";

function acquireLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const oldPid = Number(fs.readFileSync(LOCK_FILE, "utf8"));

      // Check if process is still alive
      try {
        process.kill(oldPid, 0);
        console.error(`❌ Server already running (PID ${oldPid})`);
        process.exit(1);
      } catch {
        // PID is stale → overwrite lock
        console.log("⚠️ Stale lock found, cleaning up");
      }
    }

    fs.writeFileSync(LOCK_FILE, process.pid.toString());
  } catch (err) {
    console.error("LOCK ERROR:", err);
    process.exit(1);
  }
}

function releaseLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
  } catch {}
}

//acquireLock();


const DESIRED_HOSTNAME = "camera";

function ensureHostname() {
  try {
    const current = execSync("hostname").toString().trim();

    if (current === DESIRED_HOSTNAME) {
      console.log(`✅ Hostname already set: ${current}`);
      return;
    }

    // Check root
    if (process.getuid && process.getuid() !== 0) {
      console.error("❌ Hostname mismatch!");
      console.error(`   Current : ${current}`);
      console.error(`   Required: ${DESIRED_HOSTNAME}`);
      console.error("👉 Run server with: sudo node server.js");
      process.exit(1);
    }

    console.log(`🔧 Changing hostname → ${DESIRED_HOSTNAME}`);

    execSync(`hostnamectl set-hostname ${DESIRED_HOSTNAME}`);

    // Rewrite /etc/hosts safely
    const hosts = `
127.0.0.1   localhost
127.0.1.1   ${DESIRED_HOSTNAME}

::1         localhost ip6-localhost ip6-loopback
fe00::0     ip6-localnet
ff00::0     ip6-mcastprefix
ff02::1     ip6-allnodes
ff02::2     ip6-allrouters
`.trim() + "\n";

    fs.writeFileSync("/etc/hosts", hosts);

    execSync("systemctl restart avahi-daemon");

    console.log(`✅ Hostname changed to ${DESIRED_HOSTNAME}.local`);
    console.log("🔁 Reboot recommended for full consistency");

  } catch (err) {
    console.error("❌ Failed to configure hostname:", err.message);
    process.exit(1);
  }
}


const bonjour = require("bonjour")();
let mdnsService = null;
const MDNS_CONFIG = {
  enabled: true,
  serviceName: "Khadas Camera Server",
  hostname: DESIRED_HOSTNAME,          // → camera.local
  type: "http",
  port: PORT,
  protocol: "tcp",
  txt: {
    device: "khadas",
    service: "camera",
    version: "1.0",
    ws: "enabled",
    stream: "h264",
  },
  interface: null,             // null = all interfaces
  ttl: 120                     // seconds
};



function startMDNS() {
  if (!MDNS_CONFIG.enabled) {
    console.log("ℹ️ mDNS disabled by config");
    return;
  }

  try {


    mdnsService = bonjour.publish({
      name: MDNS_CONFIG.serviceName,
      host: MDNS_CONFIG.hostname,
      type: MDNS_CONFIG.type,
      protocol: MDNS_CONFIG.protocol,
      port: MDNS_CONFIG.port,
      txt: MDNS_CONFIG.txt,
      ttl: MDNS_CONFIG.ttl
    });

    mdnsService.on("up", () => {
      console.log(`📡 mDNS UP → http://${MDNS_CONFIG.hostname}.local:${MDNS_CONFIG.port}`);
    });

    mdnsService.on("error", err => {
      console.error("❌ mDNS SERVICE ERROR:", err.message);
    });

  } catch (err) {
    console.error("❌ mDNS INIT FAILED:", err.message);
  }
}

function monitorMDNS() {
  setInterval(() => {
    if (!mdnsService) {
      console.error("❌ mDNS DOWN — RESTARTING MDNS ......");
      try {
        startMDNS();
      } catch (e) {
        console.error("❌  RESTARTING MDNS FAILED:", e.message);
      }
    }
  }, 10000); // every 10s
}

function stopMDNS() {
  try {
    if (mdnsService) {
      mdnsService.stop(() => {
        console.log("📴 mDNS service stopped");
      });
      mdnsService = null;
    }

    if (bonjour) {
      bonjour.destroy();
     // bonjour = null;
    }
  } catch (err) {
    console.error("⚠️ mDNS cleanup error:", err.message);
  }
}


//process is a global object in Node.js.
// Property	MeaningNORE
// process.pid	Process ID (PID)
// process.argv	Command-line arguments
// process.cwd()	Current working directory
// process.exit()	Stop the program
// process.on()	Listen for signals (SIGINT, SIGTERM)
// process.env	Environment variables 
// Case	Exit code
// process.exit(0)	0
// process.exit(1)	1
// SIGINT	130
// SIGTERM	143
// SIGKILL	137
// Exit Code	Meaning
// 0	Success
// 1	Error
// >1	Specific error
// >128	Killed by signal


if (process.env.NODE_ENV !== "production"){
  console.log("🧪 TEST MODE ON ");
} else{
  console.log("🚀 PRODUCTION MODE");
//console.log("ENVIROMENT VARIABLE PORT",process.env.PORT);     
//console.log("ENVIROMENT VARIABLE PRODUCT DETAIL",Mprocess.env.NODE_ENV); 
}



function gracefulShutdown(signal) {

  console.log(`\n🛑 SERVER SHUTDOWN (SIGINT) received: ${signal}`);

  if (ffmpegProcess) {
   console.log("🧹 Stopping ffmpeg process...");
    ffmpegProcess.kill("SIGINT");
    ffmpegProcess = null;
  }
      stopMDNS();
     server.close(() => {
    console.log("🚪 HTTP server closed");  });
   // releaseLock();
    process.exit(0);


}

function cleanupPort(port) {  //fuser finds which process is using a port and can kill it.
  try {
    execSync(`sudo fuser -k ${port}/tcp`);
    console.log(`🧹 Cleared port ${port}`);
  } catch {
    console.log(`ℹ️ Port ${port} already free`);
  }
}

process.on("SIGINT", gracefulShutdown); //Terminal / Ctrl+C
process.on("SIGTERM", gracefulShutdown); // systemd / OS systemctl stop, reboot

process.on("uncaughtException", err => {
  console.error("💥 UNCAUGHT EXCEPTION:", err);
  //cleanupPort(PORT);
  gracefulShutdown("uncaughtException");
});


process.on("unhandledRejection", err => {
  console.error("💥 UNHANDLED PROMISE:", err);
});

server.on("error", err => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ PORT ${PORT} ALREADY IN USE`);
    console.error("👉 Stop existing server or change PORT");
    process.exit(1);
  } else {
    console.error("❌ SERVER ERROR:", err);
    process.exit(1);
  }
});

ensureHostname();
cleanupPort(PORT);


server.listen(PORT, () => {

  console.log(`Camera server running on http://0.0.0.0:${PORT}`);
  startMDNS();
  monitorMDNS();
});

