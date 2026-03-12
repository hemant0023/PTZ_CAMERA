// # Install Node.js (if not installed)
// sudo apt update
// sudo apt install -y nodejs npm ffmpeg

// # Install project dependencies
// npm install

// # Install Node.js packages
// npm install express ws cors archiver bonjour

// # Install system tools
// sudo apt update
// sudo apt install ffmpeg v4l-utils lsusb

// # Install NetworkManager (if not installed)
// sudo apt-get install network-manager

// # Install wireless tools
// sudo apt-get install wireless-tools

// # Verify tools work
// nmcli device wifi list
// iwlist wlan0 scan

const fs        = require("fs");
const path      = require("path");
const express   = require("express");
const app       = express();
const WebSocket = require("ws")
const http      = require("http");
const server    = http.createServer(app);
const wss       = new WebSocket.Server({ server });
const PORT      = 3000;
const network = require("./networkManager");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { spawn, exec , execSync } = require("child_process");
const axios = require('axios');

const util = require('util');
const execPromise = util.promisify(exec);

const cors = require('cors');
const { Console } = require("console");
const e = require("express");
const { rejects } = require("assert");

app.use(cors({
 origin: "*" ,//true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get("/", (req, res) => {
     console.log("/index.html request recieve");
   //res.sendFile(path.join(__dirname, "public", "index.html"));
   res.sendFile(path.join(__dirname, "public", "login.html"));

});
app.use(express.static("public"));
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});


function runCommand(cmd) {

    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
               console.log("cmd_runCommand error",error.message);
                reject(stderr || error.message);
               
            } else {
              console.log("cmd_runCommand executed",stdout);
                resolve(stdout.trim());
                  
            }
        });
    });
}



// app.post("/SET_SUBNETS_NETWORK", async (req, res) => {
//     try {
//         const { ip } = req.body;

//         await network.addIP("eth0", ip);
     

//         res.json({ status: "success" });
//     } catch (err) {
//         res.status(400).json({ status: "error", message: err });
//     }
// });



// app.post("/SET_GATEWAY_NETWORK", async (req, res) => {
//     try {
//         const { gateway } = req.body;

      
//         await network.addGateway(gateway);

//         res.json({ status: "success" });
//     } catch (err) {
//         res.status(400).json({ status: "error", message: err });
//     }
// });


// app.post("/DELETE_SUBNETS_NETWORK", async (req, res) => {
//     try {
//         await network.deleteGateway();
//         res.json({ status: "gateway deleted" });
//     } catch (err) {
//         res.status(400).json({ error: err });
//     }
// });

 //    rfkill list 
      //   rfkill unblock all or  sudo rfkill unblock wifi
      //    sudo nmcli device set wlan0 managed yes
      //nmcli radio //Check WiFi radio status   nmcli radio wifi on/nmcli radio wifi off
        // sudo nmcli radio wifi off
       // ip link show wlan0 
        // sudo ip link set wlan0 down
        // sudo ip link set wlan0 up
        // sudo nmcli radio wifi on
        // sudo systemctl restart NetworkManager
        // nmcli device  or nmcli device status  or nmcli dev wifi list --rescan yes (type of network list  DEVICE         TYPE      STATE      CONNECTION )
      // Try nmcli first (NetworkManager)   
      //run  nmcli dev wifi list or nmcli device wifi list  //Check all network devices
       //  nmcli -t -f SSID,SIGNAL,SECURITY dev wifi list --rescan yes
     //  nmcli dev wifi connect "MyWifi" password "mypassword"  /Connect to WiFi
     //nmcli connection up "OfficeWifi" //Reconnect to a Saved Network
    //nmcli dev wifi connect "CafeWifi"  Connect to open network:

     // nmcli connection show // Show saved WiFi networks
     //nmcli device disconnect wlan0 //Disconnect current connection:
     //   nmcli connection delete "HomeWifi" Forget a network
    //nmcli connection show --active Check which network is active:
// Option	Meaning
// -t	terse output (script friendly)
// -f	fields to show
// SSID,SIGNAL,SECURITY	only show these columns 
//ALL FIELD IN-USE  BSSID              SSID                     MODE   CHAN  RATE        SIGNAL  BARS  SECURITY 
//rfkill unblock all
//nmcli radio wifi on
//ip addr show wlan0  //Check IP Address
//Set Static IP with nmcli
// nmcli connection modify "OfficeWifi" ipv4.method manual \  
// ipv4.addresses 192.168.1.50/24 \
// ipv4.gateway 192.168.1.1 \
// ipv4.dns 8.8.8.8
// nmcli connection up "OfficeWifi"

// sudo nmcli radio wifi off
// sudo ip link set wlan0 down
// sudo ip link set wlan0 up
// sudo nmcli radio wifi on
// sudo systemctl restart NetworkManager

// But if multiple interfaces exist, safer command is:
// sudo ip route del default dev eth0
// sudo ip route del default dev wlan0 
//When switching networks: Always restart interface.
//sudo ip link set eth0 down  
//sudo ip link set eth0 up
//or 
//sudo nmcli networking off
//sudo nmcli networking on


// await setDynamicIP("eth0");   // Ethernet DHCP
// await setDynamicIP("wlan0");  // WiFi DHC
// await setStaticIP("eth0","192.168.1.50/24","192.168.1.1");
// await setStaticIP("wlan0","192.168.1.60/24","192.168.1.1");
// await deleteIP("eth0","192.168.1.50/24");
// await deleteIP("wlan0","192.168.1.60/24");

const os = require('os');
const { AsyncResource } = require("async_hooks");
// async function getCurrentIPAddress() {

//   const interfaces = os.networkInterfaces();
//   const order = ["eth0", "wlan0"];

//   for (const name of order) {
//     const iface = interfaces[name];
//     if (!iface) continue;

//     const ipv4 = iface.find(ddr => addr.family === "IPv4" && !addr.internal );

//     if (ipv4) {
//       console.log(`ACTIVE NETWORK INTERFACE: ${name}`);
//       return ipv4.address;
//     }

//   }

//   console.log("NO ACTIVE NETWORK");

//   return "0.0.0.0";
// }

async function getCurrentIPAddress(){

 const nets = os.networkInterfaces();

 const ethernet = nets.eth0?.find(a=>a.family==="IPv4" && !a.internal)?.address || null;
 const wifi = nets.wlan0?.find(a=>a.family==="IPv4" && !a.internal)?.address || null;

 return {
   ethernet,
   wifi,
   active: ethernet ? "ETHERNET" : wifi ? "WIFI" : "NONE"
 };

}

function getActiveInterface(){

    const nets = os.networkInterfaces();
    if(nets.eth0) return "eth0";
    if(nets.wlan0) return "wlan0";

    return null;
}

// Get MAC address
function getMACAddress(iface){

  // const os = require('os');
  const interfaces = os.networkInterfaces();
  if(interfaces[iface]) {
    return interfaces[iface][0].mac;
  }
  return 'Unknown';
}
// When switching from static IP to DHCP, you must:
// Remove static IP
// Remove default gateway
// Request DHCP IP
async function setDynamicIP(iface){

  try{
    // Remove static IP if exists
   // const currentIP = await getCurrentIPAddress();
   //await network.deleteIP(iface, currentIP + '/24');
    // Remove gateway
   // await network.deleteGateway();
    
    await runCommand(`sudo ip addr flush dev ${iface}`);
    await runCommand(`sudo dhclient ${iface}`);
    // Restart network service to get DHCP
    await execPromise('sudo systemctl restart NetworkManager');
    console.log('✅ Switched to DHCP');
    return true;

  } catch (error) {
    console.error('❌ DHCP switch failed:', error);
    return false;
  }
}


// Example: Set static IP
async function setStaticIP(iface , STATIC_IP_ADDRESS, gateway) {

  //try {

    await runCommand(`sudo dhclient -r ${iface}`).catch(()=>{});
   // await runCommand(`sudo ip addr flush dev ${iface}`);

    // Add IP
  await  network.addIP(iface ,`${STATIC_IP_ADDRESS}/24`);
   // await network.addIP('eth0', ip + '/24');
   let  matrix_value = 100;
  
   if(iface === "eth0" ){
      matrix_value = 100;
   }else if(iface === "wlan0"){
     matrix_value =  200;
   }

    // Set gateway
    if(gateway){ 
    //await runCommand("sudo ip route del default").catch(()=>{});
    await network.addGateway(iface,gateway,matrix_value);
  }

    network.addIP("eth0",`${CAMERA_CONFIGURATION.camera_network.GATE_WAY}/24`); 
    // Test connection
    await network.testPing();
    
    console.log('✅ Network configured successfully');
    return true;
  // } catch (error) {

  //   console.error('❌ Network configuration failed:', error);
  //   return false;
  // }
}

//     // Test connectivity
//     try {
//       await network.testPing();
//       results.applied.push('Internet connectivity verified');
//     } catch (error) {
//       results.errors.push('Ping test failed (no internet?)');
//     }
    
//     if (results.errors.length > 0) {
//       results.success = false;
//     }
    

async function enableWifi() {

// sudo nmcli radio wifi off
// sudo ip link set wlan0 down
// sudo ip link set wlan0 up
// sudo nmcli radio wifi on
// sudo systemctl restart NetworkManager

try {
    await execPromise("sudo nmcli radio wifi off");
  } catch {}

try {
    await execPromise("sudo ip link set wlan0 down");
  } catch {}


  try {
    await execPromise("sudo rfkill unblock wifi");
  } catch {}

  try {
    await execPromise("sudo nmcli radio wifi on");
  } catch {}

  try {
    await execPromise("sudo ip link set wlan0 up");
  } catch {}

}

async function wifiStatus() {

  const { stdout } = await execPromise(
    "nmcli -t -f ACTIVE,SSID dev wifi"
  );

  const active = stdout.split("\n").find(line => line.startsWith("yes"));
  if (!active) {
    return { connected:false };
  }

  return {
    connected:true,
    ssid: active.split(":")[1]
  };

}



async function connectWifi(ssid, password) {

  await enableWifi();

  const status = await wifiStatus();

  if (status.connected && status.ssid === ssid) {

    console.log('WiFi Already connected');

    const ip = getCurrentIPAddress();

    if (ip.wifi) {
      console.log("WiFi IP already assigned:", ip.wifi);
      return { success:true, ip: ip.wifi };
    }

    console.log("WiFi connected but waiting for IP...");
  }

  try {

    await execPromise(`sudo nmcli dev wifi connect "${ssid}" password "${password}" ifname wlan0`);
    console.log('WiFi connected');

    // // wait for DHCP IP
    // await new Promise(r => setTimeout(r,3000));

    // const ip = getCurrentIPAddress();

    // if (!ip.wifi) {
    //   throw new Error("WIFI_CONNECTED_NO_IP");
    // }

    // console.log("WiFi IP assigned:", ip.wifi);
   //return { success:true, ip: ip.wifi };
    return { success:true};

  } catch(err) {

    const msg = err.toString();

    if (msg.includes("No network with SSID")) {
      throw new Error("NETWORK_NOT_FOUND");
    }

    if (msg.includes("Secrets were required")) {
      throw new Error("INVALID_PASSWORD");
    }

    if (msg.includes("Timeout")) {
      throw new Error("CONNECTION_TIMEOUT");
    }

    if (msg.includes("WIFI_CONNECTED_NO_IP")) {
      throw new Error("NO_IP_ASSIGNED");
    }

    throw new Error("WIFI_CONNECTION_FAILED");
  }
}


async function disconnectWifi(){
  try {
    await execPromise("nmcli device disconnect wlan0");
    return { success:true };
  } catch {
    return { success:false };
  }

}

async function forgetWifi(ssid){
  try {
    await execPromise(`nmcli connection delete "${ssid}"`);
    return { success:true };
  } catch {
    return { success:false };
  }

}


app.get('/api/network/wifi/scan', async (req, res) => {
  try {
    console.log('📡 Scanning WiFi networks...');
    
    // Linux: Use nmcli or iwlist
    let networks = [];
    
    try {
    
        await enableWifi();
        const { stdout } = await execPromise('nmcli -t -f SSID,SIGNAL,SECURITY device wifi list');
        console.log(' stdout nmcli  available = ',stdout);

      const lines = stdout.trim().split('\n');
      networks = lines.map(line => {
        const [ssid, signal, security] = line.split(':');
        return {
          SSID: ssid,
          ssid: ssid,
          signal: signal ? `-${100 - parseInt(signal)}` : '-70',
          security: security && security !== '--'
        };
      }).filter(n => n.ssid && n.ssid !== '');
      
    } catch (nmcliError) {
      console.log('nmcli not available, trying iwlist...');
      
      // Fallback to iwlist
      try {
        const { stdout } = await execPromise('sudo iwlist wlan0 scan');
        
        // Parse iwlist output
        const cells = stdout.split('Cell ');
           networks = cells.slice(1).map(cell => {
          const ssidMatch = cell.match(/ESSID:"([^"]+)"/);
          const signalMatch = cell.match(/Signal level=(-?\d+)/);
          const securityMatch = cell.match(/Encryption key:(on|off)/);
          
          return {
            SSID: ssidMatch ? ssidMatch[1] : '',
            ssid: ssidMatch ? ssidMatch[1] : '',
            signal: signalMatch ? signalMatch[1] : '-70',
            security: securityMatch ? securityMatch[1] === 'on' : false
          };
        }).filter(n => n.ssid);
        
      } catch (iwlistError) {
        throw new Error('No WiFi scanning tool available (tried nmcli and iwlist)');
      }
    }
    
    // Update configuration
   // CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.WIFI_AVAILABLE_LIST = networks;
    
    console.log(`✅ Found ${networks.length} WiFi networks`);
    
    res.json({
      success: true,
      networks: networks
    });
    
  } catch (error) {
    console.error('WiFi scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }

});


async function SYSTEM_NETWORK_SETTING(){
 
   console.log("CONNECT_SYSTEM_NETWORK :",CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.CONNECT_SYSTEM_NETWORK);
   console.log("SYSTEM_NETWORK_MODE : ",CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.SYSTEM_NETWORK_MODE);
   let DYNAMIC_IP_ADDRESS = null;
   
        network.addIP("eth0", "192.168.100.1/24").catch(()=>{});
       if(CAMERA_CONFIGURATION.camera_network.GATE_WAY != "192.168.100.1" ){
       network.addIP("eth0",`${CAMERA_CONFIGURATION.camera_network.GATE_WAY}/24`); }
       
   try{

   if (CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.CONNECT_SYSTEM_NETWORK === 'ETHERNET' ||  CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.CONNECT_SYSTEM_NETWORK === 'ETHERNET & WIFI'){

     if (CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.SYSTEM_NETWORK_MODE === 'STATIC' ){
       await setStaticIP("eth0",CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.STATIC_IP_ADDRESS,CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.GATE_WAY);
     
      }else{ 
            //await setDynamicIP("eth0");
           // dynamic up ehternet port 
           // await runCommand("sudo ip addr flush dev eth0");
           await setStaticIP("eth0",CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.STATIC_IP_ADDRESS,CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.GATE_WAY);
          
          }

                     DYNAMIC_IP_ADDRESS =  await getCurrentIPAddress();
                     CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.DYNAMIC_IP_ADDRESS = DYNAMIC_IP_ADDRESS.ethernet;
                     console.log("SYSTEM ethernet ip :",  CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.DYNAMIC_IP_ADDRESS );
   }

      if (CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.CONNECT_SYSTEM_NETWORK === 'WIFI' ||  CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.CONNECT_SYSTEM_NETWORK === 'ETHERNET & WIFI'){
     
        if (CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.WIFI_SSID && CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.WIFI_PASSWORD){
              await connectWifi(CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.WIFI_SSID , CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.WIFI_PASSWORD);
              CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.MAC_Address =  getMACAddress("wlan0");
              await new Promise(r => setTimeout(r,2000))

              if(CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.SYSTEM_NETWORK_MODE === 'STATIC'){
                console.log("Static wifi_IP_ADDRESS:" );
                  //await runCommand("sudo dhclient -r wlan0").catch(()=>{});
                  await runCommand("sudo ip addr flush dev wlan0");
                  await setStaticIP("wlan0",CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.STATIC_IP_ADDRESS,CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.GATE_WAY);
                 // await network.addIP("wlan0", CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.STATIC_IP_ADDRESS + "/24");
                // await network.addGateway("wlan0",CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.GATE_WAY,200);
                    CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.DYNAMIC_IP_ADDRESS = CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.STATIC_IP_ADDRESS;
            
                }else if(CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.SYSTEM_NETWORK_MODE === "DHCP"){
                 // await runCommand("sudo ip addr flush dev wlan0");
                 // await setDynamicIP("wlan0");
                    DYNAMIC_IP_ADDRESS =  await getCurrentIPAddress();
                    CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.DYNAMIC_IP_ADDRESS = DYNAMIC_IP_ADDRESS.wifi;

                }else{
                   
                     DYNAMIC_IP_ADDRESS =  await getCurrentIPAddress();
                     CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.DYNAMIC_IP_ADDRESS = DYNAMIC_IP_ADDRESS.wifi;
           
                     }
              
           }
               console.log("SYSTEM wifi_IP_ADDRESS:",  CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.DYNAMIC_IP_ADDRESS );
           
           }else{

               const status = await wifiStatus();
               if (status.connected){
               console.log('disconnectWifi WiFi Already connected');
               await disconnectWifi();
              }

            
               }     
        console.log("SYSTEM MAGAMENT IP_ADDRESS:" );
      //  network.addIP("eth0", "192.168.100.1/24");   // important sysytem defaulf managment ip 
      network.addIP("eth0", "192.168.100.1/24").catch(()=>{});
       if(CAMERA_CONFIGURATION.camera_network.GATE_WAY != "192.168.100.1" ){
       network.addIP("eth0",`${CAMERA_CONFIGURATION.camera_network.GATE_WAY}/24`); }
       
       DYNAMIC_IP_ADDRESS =  await getCurrentIPAddress();
       console.log(`SYSTEM STATIC_IP_ADDRESS: ${CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.STATIC_IP_ADDRESS}`);
       console.log("SYSTEM DYNAMIC_IP_ADDRESS:", DYNAMIC_IP_ADDRESS);
      

       }catch(error){

       console.error("❌❌❌SYSTEM NETWORK ERROR:",error);
        network.addIP("eth0", "192.168.100.1/24");  
      //  await runCommand("sudo ip addr add 192.168.100.1/24 dev eth0").catch(()=>{});   // important sysytem defaulf managment ip 
       if(CAMERA_CONFIGURATION.camera_network.GATE_WAY != "192.168.100.1" ){
       network.addIP("eth0",`${CAMERA_CONFIGURATION.camera_network.GATE_WAY}/24`); }


       }

} 



let  ffmpegProcess = null;
let  CAMERA_CONFIGURATION_CAP = {};
let  ffmpegStopping = false;
let lastStopTs = 0;
let CAMERA_USB_PORT_ERROR_SOLVE_TIME_STAAMP= 0;
const MAX_BUFFER              = 3 * 1024 * 1024; // 2 MB
const MIN_STOP_INTERVAL_MS    = 1500;   // ⏱ no double stop spam
const DEVICE_RELEASE_DELAY_MS = 800;

let mp4Header = null;           // ftyp + empty_moov

let deadClients = [];
let WESOCKET_CONNECTED_FLAG= false;
let WESOCKET_SEND_DATA_CONNECTED_FLAG = true;
let ALLOWED_LIVE_FLAG = true;
const liveClients = new Set(); 
let LIVE_STREAM_ENABLED = true;


let  videosDir    = null;
let  sdMountPoint = null;
const SD_CARD_MIN_REQUIRED_MB = 2 * 1024; // 1GB free space required to allow recording
let SD_CARD_FREE_SPACE = 0;


let CAMERA_CONFIGURATION = {

   CAMERA_MODE : "RTSP", //USB,RTSP
   DEVICE_NODE: "/dev/video0",

   //video_settings
   format: "h264", // mjpeg | yuyv | h264
   resolution: "1920x1080",
   fps: 30, //5,15,30,50,60
   bitrate: "4M",
   EXTENSION: ".mp4",      // mkv | mp4
  
   ZOOM_IN_FIXED_FLAG: false, // for fixed zoom commands (e.g. zoom in/out by 5 steps) 
   ZOOM_IN_FIXED : 100, // for fixed zoom commands (e.g. zoom in/out by 5 steps)
   ZOOM_OUT_FIXED : 5, // for fixed zoom commands (e.g. zoom in/out by 5 steps)
   ZOOM_POS_FIXED : 100,

   PTZ_POSITION_STEP: "0005", // for absolute/relative position commands (e.g. move pan/tilt by 5 steps)
   PTZ_MULTIPLE_POSITION_STEP: ["0010", "0020", "0050"], // for absolute/relative position commands (e.g. move pan/tilt by 10 steps)

  IMAGE_SETTINGS : {

  brightness_DEFAULT: 7,
  contrast_DEFAULT: 7,
  saturation_DEFAULT: 6,
  sharpness_DEFAULT: 7,
  brightness_CURRENT: 7,
  contrast_CURRENT: 7,
  saturation_CURRENT: 6,
  sharpness_CURRENT: 7,

  whiteBalance: "auto",
  exposure: "auto",
  backlight: false,
  wdr: false,
  hue:        7,
  flip:       0,
  mirror:     0,
},

  camera_network: {

    CAMERA_ONLINE:false,
    ip:           "192.168.100.86",   // ← your camera IP
    SUBNET_MASK:  "255.255.255.0",
    GATE_WAY:     "192.168.100.1",
    DNS_Address:  "8.8.8.8",
    MAC_Address : "D4:E0:8E:99:3E:DF",
    http_port:    80,
    rtspPort:     554,
    tcp_port:     5678,
    udp_port:     1259,
    Sony_Visca_port:52381,
    rtspPath:     "/stream1",        // common paths: /stream1 /h264 /live /video
    httpUser:     "admin",
    httpPass:     "admin",
    viscaTcpPort: 5678,
    viscaUdpPort: 1259,
    CAMERA_BASE_URL:null,
    rtspUrl :     null,  
    httpCgiBase:  null,              // built below

  },

  SBC_SYSTEM_NETWORK: {

    SYSTEM_MAC_ADDRESS : "",
    CONNECT_SYSTEM_NETWORK : "WIFI", // ETHERNET or WIFI , ETHERNET & WIFI
    SYSTEM_NETWORK_MODE: "DHCP",     // DHCP or STATIC
    STATIC_IP_ADDRESS :  "192.168.29.15",
    STATIC_IP_ADDRESS_WIFI :  "",  
    STATIC_IP_ADDRESS_ETHERNET:  "", // ← your camera IP
    DYNAMIC_IP_ADDRESS :  "",   // ← your camera IP
    DYNAMIC_IP_ADDRESS_WIFI : "",
    DYNAMIC_IP_ADDRESS_ETHERNET: "",
    GATE_WAY:     "192.168.29.1",
    SUBNET_MASK :  "255.255.255.0",
    MAC_Address : "D4:E0:8E:99:3E:DF",
    DNS_Address:  "8.8.8.8",
    WIFI_AVAILABLE_LIST :[],
    WIFI_SSID:  "hemant",
    WIFI_PASSWORD: "KHADAS@1234",
  },



  mediamtx: {
    binary:    "./mediamtx",  // path to MediaMTX binary
    configFile:"./mediamtx.yml",
    webRTCPort: 8889,
    rtspPort:   8554,
    streamPath: "live_camera",              // → http://server:8889/live_camera
  },
  

 // Camera capabilities
  PTZ_STATE: {
    hasPTZ: true,
    hasZoom: true,
    hasPresets: true,
    defaultPanSpeed:   12,   // 1–24
    defaultTiltSpeed:  10,   // 1–20
    defaultZoomSpeed:  4,    // 1–7
    defaultFocusSpeed: 4,    // 1–7
    minZoom:   1,
    maxZoom:   20,
    panspeed:  10,
    tiltspeed: 10,
    panRange: [-180, 180],
    tiltRange: [-90, 90],
     moving: false 
  },

};


//console.log(`=========================${CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.STATIC_IP_ADDRESS}`);


CAMERA_CONFIGURATION_CAP = {
  REC_FORMATS: ["MJPEG", "YUYV", "H264"],
  REC_RESOLUTIONS: ["320x240","480x272","424x240","640x360","640x480","720x480","800x448","800x600","1024x576","1024x768","1280x720","1920x1080","2560x1440","3840x2160"],
  REC_FPS: [10,15,20,24,25,30,50,60],
  CAMERA_MODE : ["USB","RTSP"], 
  REC_BITERATE : ["1M","2M","4M","6M","8M"],
  EXTENSION : [".mp4",".mkv"]
};



let RECORDING_STATE = {
  status: "IDLE",
  active: false,
  paused: false,
  AUDIO_MUTED_FLAG: false,
  REC_TIMER_MS: null,
  REC_TIMER_STATE: "OFF",
  filename:          null,
  FINAL_FILE_NAME :  null,
  VIDEO_FOLDER_NAME: null,
  FINAL_FILE_SAVE_PATH:   null,

  REC_START_TIME:     null,
  REC_STOP_TIME :     null,
  REC_VIDEO_DURATION: null,
  PAUSED_AT_TIME:     null,
  TOT_PAUSED_DURATION_MS: 0,
  FINAL_FILE_URL_PATH : null,
  segments: [], 
  curr_segment: null

};

 
let FFMPEG_ERROR = {
  result: null,
  reason: null,
  SPAWN_FAILED:     1,
  DEVICE_BUSY:      2,
  INVALID_ARGUMENT: 3,
  PROCESS_EXITED:   4,
  UNKNOWN: 99

};


function RESET_DAUFALT_CAMERA_STATE(){
  // Reset state
    
    RECORDING_STATE.status = "IDLE";
    RECORDING_STATE.active = false;
    RECORDING_STATE.paused = false;
    RECORDING_STATE.PAUSED_AT_TIME = null;
    RECORDING_STATE.TOT_PAUSED_DURATION_MS = 0;
   
    
    RECORDING_STATE.REC_START_TIME = null;
    RECORDING_STATE.REC_STOP_TIME = null;
    RECORDING_STATE.REC_VIDEO_DURATION = null;

    RECORDING_STATE.REC_TIMER_MS = null;
    RECORDING_STATE.REC_TIMER_STATE = "OFF";
    RECORDING_STATE.AUDIO_MUTED_FLAG = false;
  
    RECORDING_STATE.curr_segment = null;
    RECORDING_STATE.segments = [];
    RECORDING_STATE.filename = null;
    RECORDING_STATE.FINAL_FILE_NAME = null;
    RECORDING_STATE.VIDEO_FOLDER_NAME = null;
    RECORDING_STATE.FINAL_FILE_URL_PATH = null;
    RECORDING_STATE.FINAL_FILE_SAVE_PATH = null;

    FFMPEG_ERROR.result = null;
}

function CAMERA_STATE_STATUS(){

  let CAMERA_STATE_STATUS = { 
    STATUS: RECORDING_STATE.status,
    ACTIVE: RECORDING_STATE.active,
    PAUSED: RECORDING_STATE.paused,
    REC_START_TIME: RECORDING_STATE.REC_START_TIME,
    PAUSED_AT_TIME: RECORDING_STATE.PAUSED_AT_TIME,
    REC_VIDEO_DURATION: RECORDING_STATE.REC_VIDEO_DURATION,
    TOT_PAUSED_DURATION_MS: RECORDING_STATE.TOT_PAUSED_DURATION_MS,
    
    VIDEO_FOLDER_NAME:   RECORDING_STATE.VIDEO_FOLDER_NAME,
    FINAL_FILE_NAME:     RECORDING_STATE.FINAL_FILE_NAME ,
    FINAL_FILE_URL_PATH: RECORDING_STATE.FINAL_FILE_URL_PATH,

    REC_TIMER_MS: RECORDING_STATE.REC_TIMER_MS,
    REC_TIMER_STATE: RECORDING_STATE.REC_TIMER_STATE,
    AUDIO_MUTED_FLAG: RECORDING_STATE.AUDIO_MUTED_FLAG
  }

  return CAMERA_STATE_STATUS;
}


app.get("/api/recording/status", (req, res) => {
  res.json(CAMERA_STATE_STATUS());
   console.log("HOME PAGE STATE REQUEST ", CAMERA_STATE_STATUS());
});

app.get("/hello", (req, res) => {
  res.json(CAMERA_STATE_STATUS());
});


app.get("/api/camera/config", async(req, res) => {

     console.log("GET CAMERA CONFIGURATION REQUEST");
  if (!CAMERA_CONFIGURATION || !CAMERA_CONFIGURATION_CAP) {
    console.error("GET CAMERA CONFIGURATION ERROR:", CAMERA_CONFIGURATION_CAP);
    return res.status(500).json({ error: "CONFIGURATION_SETTING_FAILED" });
  }

   //CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.DYNAMIC_IP_ADDRESS  = await getCurrentIPAddress();
   
 
  res.json({
    success: true,
    current: CAMERA_CONFIGURATION,
    capabilities: CAMERA_CONFIGURATION_CAP
  });
});

// Helper function to parse v4l2-ctl output
function parseV4L2Capabilities(output){

  const capabilities = {
    formats: [],
    resolutions: [],
    fps: []
  };

  const lines = output.split('\n');
  let currentFormat = null;

  for (const line of lines) {
    // Format line: [0]: 'MJPG'
    const formatMatch = line.match(/\[\d+\]:\s+'(\w+)'/);
    if (formatMatch) {
      currentFormat = formatMatch[1];
      if (!capabilities.formats.includes(currentFormat)) {
        capabilities.formats.push(currentFormat);
      }
      continue;
    }

    // Resolution line: Size: Discrete 1920x1080
    const sizeMatch = line.match(/Size:\s+Discrete\s+(\d+x\d+)/);
    if (sizeMatch && currentFormat) {
      const resolution = sizeMatch[1];
      if (!capabilities.resolutions.includes(resolution)) {
        capabilities.resolutions.push(resolution);
      }
      continue;
    }

    // FPS line: Interval: Discrete 0.033s (30.000 fps)
    const fpsMatch = line.match(/\(([\d.]+)\s+fps\)/);
    if (fpsMatch && currentFormat) {
      const fps = Math.round(parseFloat(fpsMatch[1]));
      if (!capabilities.fps.includes(fps)) {
        capabilities.fps.push(fps);
      }
    }
  }

  // Sort
  capabilities.fps.sort((a, b) => a - b);
  
  return capabilities;
}

// ============================================================================
// ROUTE: CAMERA CONFIG (read/update server config)
// ============================================================================
app.get("/api/CAMERA_DETAILS", (req, res) => {
 try {
  res.json({

    camera_ip:    CAMERA_CONFIGURATION.camera_network.ip,
    rtsp_port:    CAMERA_CONFIGURATION.camera_network.rtspPort,
    rtsp_path:    CAMERA_CONFIGURATION.camera_network.rtspPath,
    webrtc_url:   CAMERA_CONFIGURATION.camera_network.rtspUrl,
   // http_cgi_base: CAMERA_CONFIGURATION.camera_network.httpCgiBase,
   // image_state:  CAMERA_CONFIGURATION.IMAGE_STATE,
   /// ptz_state:    CAMERA_CONFIGURATION.PTZ_STATE,
    camera_online: CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE,
  });
 
  }catch (error){
    console.error("❌ CAMERA_DETAILS:", error);
    res.status(500).json({success: false,error: "CAMERA_DETAILS_FAILED",message: error.message});
  }
});

function updateObject(target, source, allowedKeys) {

  if (!source) return;
  Object.keys(source).forEach(key => {
    if (allowedKeys.includes(key) && source[key] !== undefined) {
      target[key] = source[key];
    }
  });
}

const CAMERA_ALLOWED = {
  ROOT: [
    "CAMERA_MODE",
    "DEVICE_NODE",
    "format",
    "resolution",
    "fps",
    "bitrate",
    "EXTENSION"
  ],

 // NETWORK: Object.keys(CAMERA_CONFIGURATION.camera_network), 
NETWORK: Object.keys(CAMERA_CONFIGURATION.camera_network).filter(
  k => !["rtspUrl", "httpCgiBase", "CAMERA_BASE_URL"].includes(k)
),
  SYSTEM_NETWORK: Object.keys(CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK),
  IMAGE: Object.keys(CAMERA_CONFIGURATION.IMAGE_SETTINGS),
  PTZ: Object.keys(CAMERA_CONFIGURATION.PTZ_STATE)
};

app.post("/api/camera/config", (req, res) => {

  console.log("NEW POST CAMERA CONFIGURATION:", req.body);

  try {

    const body = req.body;

    /* ---------------- VALIDATION ---------------- */

    if (body.format &&
        !CAMERA_CONFIGURATION_CAP.REC_FORMATS.includes(body.format.toUpperCase()))
      return res.status(400).json({ error: "Invalid format" });

    if (body.resolution &&
        !CAMERA_CONFIGURATION_CAP.REC_RESOLUTIONS.includes(body.resolution))
      return res.status(400).json({ error: "Invalid resolution" });

    if (body.fps &&
        !CAMERA_CONFIGURATION_CAP.REC_FPS.includes(Number(body.fps)))
      return res.status(400).json({ error: "Invalid FPS" });

    if (body.bitrate &&
        !CAMERA_CONFIGURATION_CAP.REC_BITERATE.includes(body.bitrate))
      return res.status(400).json({ error: "Invalid bitrate" });

    if (body.CAMERA_MODE &&
        !CAMERA_CONFIGURATION_CAP.CAMERA_MODE.includes(body.CAMERA_MODE))
      return res.status(400).json({ error: "Invalid camera mode" });

    if (body.EXTENSION &&
        !CAMERA_CONFIGURATION_CAP.EXTENSION.includes(body.EXTENSION))
      return res.status(400).json({ error: "Invalid extension" });


    /* ---------------- ROOT UPDATE ---------------- */

    updateObject(CAMERA_CONFIGURATION,body,CAMERA_ALLOWED.ROOT);

    if (body.format)
      CAMERA_CONFIGURATION.format = body.format.toLowerCase();

    if (body.fps)
      CAMERA_CONFIGURATION.fps = Number(body.fps);
   
 if (body.DEVICE_NODE)
      CAMERA_CONFIGURATION.DEVICE_NODE = body.DEVICE_NODE;

  if(body.ZOOM_IN_FIXED  && CAMERA_CONFIGURATION.ZOOM_IN_FIXED != body.ZOOM_IN_FIXED){
    CAMERA_CONFIGURATION.ZOOM_IN_FIXED = body.ZOOM_IN_FIXED;
    FIXED_ZOOM_POSITION(CAMERA_CONFIGURATION.ZOOM_IN_FIXED,7);
  }
      

   if(body.ZOOM_OUT_FIXED )
      CAMERA_CONFIGURATION.ZOOM_OUT_FIXED = body.ZOOM_OUT_FIXED;
    if(body.ZOOM_POS_FIXED )  
      CAMERA_CONFIGURATION.ZOOM_POS_FIXED = body.ZOOM_POS_FIXED;

    if(body.PTZ_POSITION_STEP )  
      CAMERA_CONFIGURATION.PTZ_POSITION_STEP = body.PTZ_POSITION_STEP;

   
  // PTZ_MULTIPLE_POSITION_STEP: ["0010", "0020", "0050"], // for absolute/relative position commands (e.g. move pan/tilt by 10 steps)



    /* ---------------- NETWORK UPDATE ---------------- */

       if(body.camera_network){

          //updateObject(CAMERA_CONFIGURATION.camera_network,body.camera_network,CAMERA_ALLOWED.NETWORK);
          // network.addIP("eth0",`${body.camera_network.GATE_WAY}/24`); 
          // CAMERA_CONFIGURATION.camera_network.rtspUrl     = `rtsp://${CAMERA_CONFIGURATION.camera_network.httpUser}:${CAMERA_CONFIGURATION.camera_network.httpPass}@${CAMERA_CONFIGURATION.camera_network.ip}:${CAMERA_CONFIGURATION.camera_network.rtspPort}${CAMERA_CONFIGURATION.camera_network.rtspPath}`;
          // CAMERA_CONFIGURATION.camera_network.httpCgiBase = `http://${CAMERA_CONFIGURATION.camera_network.httpUser}:${CAMERA_CONFIGURATION.camera_network.httpPass}@${CAMERA_CONFIGURATION.camera_network.ip}`;
          // stopMediaMtx();
      
       if (
            body.camera_network.httpUser != CAMERA_CONFIGURATION.camera_network.httpUser 
        ||  body.camera_network.httpPass != CAMERA_CONFIGURATION.camera_network.httpPass
        ||  body.camera_network.ip       != CAMERA_CONFIGURATION.camera_network.ip
        ||  body.camera_network.rtspPort != CAMERA_CONFIGURATION.camera_network.rtspPort
        ||  body.camera_network.rtspPath != CAMERA_CONFIGURATION.camera_network.rtspPath
        || body.camera_network.GATE_WAY  != CAMERA_CONFIGURATION.camera_network.GATE_WAY 
      
        ){    
        
        network.addIP("eth0",`${body.camera_network.GATE_WAY}/24`); 
        console.log("✅ UPDATED CAMERA_CONFIGURATION.camera_network.rtspUrl 1", CAMERA_CONFIGURATION.camera_network.rtspUrl );
        CAMERA_CONFIGURATION.camera_network.rtspUrl     = `rtsp://${body.camera_network.httpUser}:${body.camera_network.httpPass}@${body.camera_network.ip}:${body.camera_network.rtspPort}${body.camera_network.rtspPath}`;
        CAMERA_CONFIGURATION.camera_network.httpCgiBase = `http://${body.camera_network.httpUser}:${body.camera_network.httpPass}@${body.camera_network.ip}`;
         console.log("✅ UPDATED CAMERA_CONFIGURATION.camera_network.rtspUrl2 ", CAMERA_CONFIGURATION.camera_network.rtspUrl );
        stopMediaMtx();
        }

      // updateObject(CAMERA_CONFIGURATION.camera_network,body.camera_network,CAMERA_ALLOWED.NETWORK);

    }

     if(body.SBC_SYSTEM_NETWORK){
      
      if ( body.SBC_SYSTEM_NETWORK.STATIC_IP_ADDRESS != CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.STATIC_IP_ADDRESS  
        || body.SBC_SYSTEM_NETWORK.GATE_WAY !=         CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.GATE_WAY
        || body.SBC_SYSTEM_NETWORK.WIFI_SSID !=          CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.WIFI_SSID 
        || body.SBC_SYSTEM_NETWORK.WIFI_PASSWORD  !=  CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.WIFI_PASSWORD 
        || body.SBC_SYSTEM_NETWORK.WIFI_PASSWORD  !=  CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.WIFI_PASSWORD 
        || body.SBC_SYSTEM_NETWORK.CONNECT_SYSTEM_NETWORK  !=CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.CONNECT_SYSTEM_NETWORK
        || body.SBC_SYSTEM_NETWORK.SYSTEM_NETWORK_MODE  !=  CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK.SYSTEM_NETWORK_MODE
        ) {
            updateObject(CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK,body.SBC_SYSTEM_NETWORK,CAMERA_ALLOWED.SYSTEM_NETWORK);
            SYSTEM_NETWORK_SETTING();
         }

            updateObject(CAMERA_CONFIGURATION.SBC_SYSTEM_NETWORK,body.SBC_SYSTEM_NETWORK,CAMERA_ALLOWED.SYSTEM_NETWORK);
     
     }


    /* ---------------- IMAGE SETTINGS ---------------- */

    if (body.IMAGE_SETTINGS) {
      updateObject(CAMERA_CONFIGURATION.IMAGE_SETTINGS,body.IMAGE_SETTINGS,CAMERA_ALLOWED.IMAGE);
    }


    /* ---------------- PTZ SETTINGS ---------------- */

    if (body.PTZ_STATE) {updateObject(
      CAMERA_CONFIGURATION.PTZ_STATE,body.PTZ_STATE,CAMERA_ALLOWED.PTZ);
    }


    /* ---------------- SAVE ---------------- */

    console.log("✅ UPDATED CAMERA CONFIG:", CAMERA_CONFIGURATION);

    saveCameraConfig();

    res.json({
      success: true,
      message: "CONFIGURATION_SAVED",
      current: CAMERA_CONFIGURATION
    });

  } catch (error) {

    console.error("❌ Configuration save error:", error);

    res.status(500).json({
      success: false,
      error: "CONFIGURATION_SAVE_FAILED",
      message: error.message
    });
  }
});


CAMERA_CONFIGURATION.camera_network.rtspUrl     = `rtsp://${CAMERA_CONFIGURATION.camera_network.httpUser}:${CAMERA_CONFIGURATION.camera_network.httpPass}@${CAMERA_CONFIGURATION.camera_network.ip}:${CAMERA_CONFIGURATION.camera_network.rtspPort}${CAMERA_CONFIGURATION.camera_network.rtspPath}`;
CAMERA_CONFIGURATION.camera_network.httpCgiBase = `http://${CAMERA_CONFIGURATION.camera_network.httpUser}:${CAMERA_CONFIGURATION.camera_network.httpPass}@${CAMERA_CONFIGURATION.camera_network.ip}`;

const CONFIG_FILE = path.join(__dirname, "camera_config.json");

function saveCameraConfig() {

  const tempFile = CONFIG_FILE + ".tmp";
  fs.writeFileSync(tempFile,JSON.stringify(CAMERA_CONFIGURATION, null, 2));
  fs.renameSync(tempFile, CONFIG_FILE);
}


function loadCameraConfig(){
  try {

    if (fs.existsSync(CONFIG_FILE)){
      const data = fs.readFileSync(CONFIG_FILE, "utf8");
      CAMERA_CONFIGURATION = JSON.parse(data);
      console.log("✅ Camera configuration loaded from file");
    } else {
      console.log("⚡❌ No saved config → using defaults");
      saveCameraConfig(); // create file first time
    }

  } catch (err){
    console.error("❌ Config load failed:", err);
  }
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


function getReadyStateName(state) {

  switch (state) {
    case WebSocket.CONNECTING: return "CONNECTING";
    case WebSocket.OPEN: return "OPEN";
    case WebSocket.CLOSING: return "CLOSING";
    case WebSocket.CLOSED: return "CLOSED";
    default: return "UNKNOWN";
  }
}

// ============================================================================
// WEBSOCKET — push live status to all connected clients
// ============================================================================
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


function broadcastStatus() {

  const msg = JSON.stringify({

    type:          "STATUS",
    ptz:            CAMERA_CONFIGURATION.PTZ_STATE,
    image:          CAMERA_CONFIGURATION.IMAGE_STATE,
    recording:     { active: RECORDING_STATE.active, paused: RECORDING_STATE.paused, filename: RECORDING_STATE.filename, startTime: RECORDING_STATE.startTime },
    camera_online: CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE,
    ts:            Date.now(),
  });

  wss.clients.forEach(ws => {

   if(ws.readyState === ws.OPEN){
      ws.send(msg);
    }
  });
 
}

async function cgiRequest(path, label = "") {

   const url = `${CAMERA_CONFIGURATION.camera_network.httpCgiBase}${path}`;
   console.log(`📡 REQUEST [CGI]  ${label || path} URL : ${url}  `);
  try {
    const res = await axios.get(url, {
      timeout: 2000,
      auth: { username: CAMERA_CONFIGURATION.camera_network.httpUser, password: CAMERA_CONFIGURATION.camera_network.httpPass },
    });
    return { ok: true, data: res.data };
  } catch (err) {
    console.error(`❌ CGI Error: ${err.message}`);
    return { ok: false, error: err.message };
  }
}



//download_mediamtx_v16.1 web_rtc
//>>wget https://github.com/bluenviron/mediamtx/releases/download/v1.16.1/mediamtx_v1.16.1_linux_arm64.tar.gz
// extract 
//>>tar -xvf mediamtx_v1.16.1_linux_arm64.tar.gz
//respond
// mediamtx
// mediamtx.yml
// LICENSE
//Make Executable
//chmod +x mediamtx
//Start MediaMTX
//./mediamtx
// ps aux | grep mediamtx
// ============================================================================
// MEDIAMTX CONFIG GENERATION
// ============================================================================


function writeMediaMtxConfig(mode) {

  const yaml_usb = `
logLevel: info
logDestinations: [stdout]

# ---------- PERFORMANCE ----------
readTimeout: 10s
writeTimeout: 10s
writeQueueSize: 1024
udpMaxPayloadSize: 1452


# =========================
# RTSP SERVER SETTINGS
# =========================
rtsp: yes
rtspAddress: :${CAMERA_CONFIGURATION.mediamtx.rtspPort}
rtspTransports: [tcp]
rtspEncryption: "no"

# =========================
# WEBRTC SETTINGS
# =========================
webrtc: yes
webrtcAddress: :${CAMERA_CONFIGURATION.mediamtx.webRTCPort}
#webrtcEncryption: "no"
webrtcAllowOrigins: ["*"]
webrtcICEServers2: []

# Reduce buffering →  # Low latency tuning
webrtcHandshakeTimeout: 10s
webrtcTrackGatherTimeout: 2s
webrtcSTUNGatherTimeout: 5s

# ---------- DISABLE UNUSED SERVICES ----------
rtmp: no
srt: no
api: no
metrics: no
pprof: no
playback: no

# =========================
# HLS (Optional fallback)
# =========================
hls: no
hlsAddress: :8888
hlsAlwaysRemux: yes
hlsVariant: lowLatency
hlsSegmentCount: 7
hlsSegmentDuration: 500ms
hlsPartDuration: 100ms

pathDefaults:
  sourceOnDemand: no
  maxReaders: 0
  rtspTransport: tcp

# =========================
# PATH CONFIGURATION
# =========================
paths:
  ${CAMERA_CONFIGURATION.mediamtx.streamPath}:
    source: publisher 
    sourceOnDemand: no

    # Stability tuning
    maxReaders: 0   # unlimited clients
  

    # Auto-reconnect if camera drops
    sourceOnDemandStartTimeout: 10s
    sourceOnDemandCloseAfter: 30s

    # Logging hooks
    runOnReady: echo    "[MediaMTX] Stream ready successfully"
    runOnNotReady: echo "[MediaMTX] Stream lost"
`;

const yaml_rtsp = `
logLevel: info
logDestinations: [stdout]

# ---------- PERFORMANCE ----------
readTimeout: 10s
writeTimeout: 10s
writeQueueSize: 1024
udpMaxPayloadSize: 1452


# =========================
# RTSP SERVER SETTINGS
# =========================
rtsp: yes
rtspAddress: :${CAMERA_CONFIGURATION.mediamtx.rtspPort}
rtspTransports: [tcp]
rtspEncryption: "no"

# =========================
# WEBRTC SETTINGS
# =========================
webrtc: yes
webrtcAddress: :${CAMERA_CONFIGURATION.mediamtx.webRTCPort}
#webrtcEncryption: "no"
webrtcAllowOrigins: ["*"]
webrtcICEServers2: []

# Reduce buffering →  # Low latency tuning
webrtcHandshakeTimeout: 10s
webrtcTrackGatherTimeout: 2s
webrtcSTUNGatherTimeout: 5s

# ---------- DISABLE UNUSED SERVICES ----------
rtmp: no
srt: no
api: no
metrics: no
pprof: no
playback: no

# =========================
# HLS (Optional fallback)
# =========================
hls: no
hlsAddress: :8888
hlsAlwaysRemux: yes
hlsVariant: lowLatency
hlsSegmentCount: 7
hlsSegmentDuration: 500ms
hlsPartDuration: 100ms

pathDefaults:
  sourceOnDemand: no
  maxReaders: 0
  rtspTransport: tcp

# =========================
# PATH CONFIGURATION
# =========================
paths:
  ${CAMERA_CONFIGURATION.mediamtx.streamPath}:
    source: ${CAMERA_CONFIGURATION.camera_network.rtspUrl} 
    rtspTransport: tcp
    sourceOnDemand: no

    # Stability tuning
    maxReaders: 0   # unlimited clients
  

    # Auto-reconnect if camera drops
    sourceOnDemandStartTimeout: 10s
    sourceOnDemandCloseAfter: 30s

    # Logging hooks
    runOnReady: echo    "[MediaMTX] Stream ready successfully"
    runOnNotReady: echo "[MediaMTX] Stream lost"
`;
console.log("======== mode========", mode);
let yaml ;
if(mode === 'USB'){
 yaml = yaml_usb;

}else if(mode === 'RTSP'){
 yaml = yaml_rtsp;
}else{
   yaml = yaml_rtsp;
}

  fs.writeFileSync(CAMERA_CONFIGURATION.mediamtx.configFile,
    yaml.trim() + "\n"
  );

  console.log("📝mediamtx.yml written");
}


//
// ============================================================================
// START / STOP MEDIAMTX
// ============================================================================
let mediaMtxProcess = null;

function stopMediaMtx(){
  if(mediaMtxProcess){
     mediaMtxProcess.kill("SIGINT");
     mediaMtxProcess = null;
  }
}

function restartMediaMtx(mode){

  console.log("♻️ Restarting MediaMTX:", mode);

  stopMediaMtx();

  setTimeout(() => {
    startMediaMtx(mode);
  }, 1000);
}

async function waitRtspReady(port=8554){
  const net = require("net");

  return new Promise(resolve=>{
    const tryConnect=()=>{
      const s=new net.Socket();
      s.once("connect",()=>{s.destroy();resolve();});
      s.once("error",()=>setTimeout(tryConnect,300));
      s.connect(port,"127.0.0.1");
    };
    tryConnect();
  });
}

function startMediaMtx( mode ){

  if (mediaMtxProcess) {
    console.log("⚠️ MediaMTX already running");
    return;
  }
   
  writeMediaMtxConfig(mode);

  if (!fs.existsSync(CAMERA_CONFIGURATION.mediamtx.binary)){
    console.warn(`⚠️  MediaMTX binary not found at: ${CAMERA_CONFIGURATION.mediamtx.binary}`);
    console.warn("    Download from: https://github.com/bluenviron/mediamtx/releases");
   // console.warn("    Falling back to FFmpeg-based HLS streaming...");
   // startFfmpegHls();
    return;
  }

  console.log("▶️  Starting MediaMTX...",CAMERA_CONFIGURATION.camera_network.rtspUrl);

 mediaMtxProcess = spawn(
  CAMERA_CONFIGURATION.mediamtx.binary,
  [CAMERA_CONFIGURATION.mediamtx.configFile],
  { stdio: ["ignore","pipe","pipe"] }
);
  mediaMtxProcess.stdout.on("data", d => process.stdout.write(`[MTX stdout]: ${d} `));

  mediaMtxProcess.stderr.on("data", d => process.stderr.write(`[MTX stderr]: ${d} `));
  
mediaMtxProcess.once("spawn", () => {
  console.log("✅ MediaMTX started successfully");
});

  mediaMtxProcess.on("close", code => {
   console.warn(`⚠️MediaMTX exited (code ${code}), restarting `);
   mediaMtxProcess = null;
   mediaMtxRunning = false;
   
  });

  console.log(`✅ MediaMTX started`);
  console.log(`📺 WebRTC URL:  http://KHADAS_IP:${CAMERA_CONFIGURATION.mediamtx.webRTCPort}/${CAMERA_CONFIGURATION.mediamtx.streamPath}`);
 // console.log(`🎬 HLS  URL:  http://0.0.0.0:8888/${CAMERA_CONFIGURATION.mediamtx.streamPath}`);
}



// ============================================================================
// CAMERA HEALTH CHECK
// ============================================================================
CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE = false; 
 let mediaMtxRunning = false;


async function CHECK_CAMERA_ONLINE(){

  try {
    //console.log("CAMERA_CONFIGURATION CAMERA_MODE",CAMERA_CONFIGURATION.CAMERA_MODE); 

    if (CAMERA_CONFIGURATION.CAMERA_MODE === 'RTSP' ) {

    await axios.get(`http://${CAMERA_CONFIGURATION.camera_network.ip}/cgi-bin/param.cgi?get_device_conf`, { 
      timeout: 2000, auth: { username: CAMERA_CONFIGURATION.camera_network.httpUser, password: CAMERA_CONFIGURATION.camera_network.httpPass } });

      CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE = true; 
      console.log("✅ CHECK_RTSP_CAMERA_ONLINE"); 
  
     } else if (CAMERA_CONFIGURATION.CAMERA_MODE === 'USB') {

      const deviceExists = fs.existsSync(CAMERA_CONFIGURATION.DEVICE_NODE);
      if (deviceExists){
        try {
          
          CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE = true; 
          console.log("✅ CHECK_USB_CAMERA_ONLINE"); 

          if (!ffmpegProcess ){
          console.log("========CAMERA_ONLINE CHECK_DEVICE_NODE STARTING FFMEG=================:", CAMERA_CONFIGURATION.DEVICE_NODE);
           
           startMediaMtx(CAMERA_CONFIGURATION.CAMERA_MODE);
           mediaMtxRunning = true;
          await new Promise(r => setTimeout(r,500));
          RUN_FFMPEG_ARGUMENT_COMMAND({ outputPath: null,enableLive: true}); 
         }

        //  const output = execSync(`v4l2-ctl -d ${CAMERA_CONFIGURATION.DEVICE_NODE} --list-formats-ext`,{ timeout: 3000 }).toString();
        //  console.log("CAMERA_CONFIGURATION USB", output); 
   
        } catch(e){
          throw new Error('USB device node exists but not responding');
        }
      
      }else{

         const videoDev =   await findCameraPortPath();
         if (!videoDev || !videoDev.videoNode){
          console.log(" CAMERA_USB_ERROR_videoDev:", videoDev);
          return;
       }

        CAMERA_CONFIGURATION.DEVICE_NODE = videoDev.videoNode;
        //throw new Error('USB device not found');
      }

     }

  
  if (CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE && !mediaMtxRunning) {

    console.log("✅ Camera Online → Start MediaMTX");
    mediaMtxRunning = true;
    startMediaMtx(CAMERA_CONFIGURATION.CAMERA_MODE);
    FIXED_ZOOM_POSITION(CAMERA_CONFIGURATION.ZOOM_IN_FIXED,7);
  }

  if (!CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE && mediaMtxRunning) {
      console.log("⚠️ Camera Offline → Stop MediaMTX");
      mediaMtxRunning = false;
    //stopMediaMtx();
   // setTimeout(startMediaMtx, 3000);
  }
 
    } catch (error) {
        CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE = false; 
      console.log("⚠️ERROR IN CHECK_CAMERA_OFFLINE",error.message); 
    }

}


// Test camera connection
app.get("/api/camera/test", async (req, res) => {
  console.log("🔍 Testing camera connection...");

  try {
    if (CAMERA_CONFIGURATION.CAMERA_MODE === 'RTSP') {
      // Test HTTP-CGI connection
      const url = `${CAMERA_CONFIGURATION.camera_network.httpCgiBase}/cgi-bin/param.cgi?get_device_conf`;
      
      const response = await axios.get(url, {
        timeout: 5000
      });

      if (response.status === 200) {
        CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE = true;
        
        res.json({
          success: true,
          online: true,
          mode: 'RTSP',
          message: 'Camera is online and responding'
        });
      } else {
        throw new Error('Camera returned non-200 status');
      }

    } else if (CAMERA_CONFIGURATION.CAMERA_MODE === 'USB') {
      // Test USB device
      const deviceExists = fs.existsSync(CAMERA_CONFIGURATION.DEVICE_NODE);
      
      if (deviceExists) {
        try {
          const output = execSync(
            `v4l2-ctl -d ${CAMERA_CONFIGURATION.DEVICE_NODE} --list-formats-ext`,
            { timeout: 3000 }
          ).toString();

          res.json({
            success: true,
            online: true,
            mode: 'USB',
            message: 'USB camera detected',
            device: CAMERA_CONFIGURATION.DEVICE_NODE
          });
        } catch (e) {
          throw new Error('USB device exists but not responding');
        }
      } else {
        throw new Error('USB device not found');
      }
    }

  } catch (error) {
    console.error("❌ Camera test failed:", error);
    
    res.json({
      success: false,
      online: false,
      mode: CAMERA_CONFIGURATION.CAMERA_MODE,
      message: error.message
    });
  }
});


// ============================================================================
// ROUTE: INQUIRIES
// ============================================================================
app.get("/api/ptz/info/video",   async (req, res) => res.json(await cgiRequest("/cgi-bin/param.cgi?get_media_video")));
app.get("/api/ptz/info/audio",   async (req, res) => res.json(await cgiRequest("/cgi-bin/param.cgi?get_media_audio")));
app.get("/api/ptz/info/network", async (req, res) => res.json(await cgiRequest("/cgi-bin/param.cgi?get_network_conf")));
app.get("/api/ptz/info/device",  async (req, res) => res.json(await cgiRequest("/cgi-bin/param.cgi?get_device_conf")));
app.get("/api/ptz/info/serial",  async (req, res) => res.json(await cgiRequest("/cgi-bin/param.cgi?get_serial_number")));




// ============================================================================
// ROUTE: HOME POSITION
// GET  /api/ptz/home
// ============================================================================
app.get("/api/ptz/home", async (req, res) => {
  console.log("/api/ptz/home REQUES RECIEVE");
   
     if (CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE == false) { 
        console.log("⚠️CHECK_CAMERA_OFFLINE RETURN RECORDING_ERROR"); 
        return res.status(400).json({ error: "CHECK_CAMERA_OFFLINE" });
       // CHECK_CAMERA_ONLINE(); 
       }
  CAMERA_CONFIGURATION.PTZ_STATE.moving = true ;
  const result = await cgiRequest("/cgi-bin/ptzctrl.cgi?ptzcmd&home" ,`PTZ : home` );
  CAMERA_CONFIGURATION.PTZ_STATE.moving = false;
 // broadcastStatus();
 
 res.json({ success: result.ok ,data : result.data});
});

// ============================================================================
// ROUTE: PT RESET
// GET  /api/ptz/reset
// ============================================================================
app.get("/api/ptz/reset", async (req, res) => {

    if (CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE == false) { 
        console.log("⚠️CHECK_CAMERA_OFFLINE RETURN RECORDING_ERROR"); 
        return res.status(400).json({ error: "CHECK_CAMERA_OFFLINE" });
       // CHECK_CAMERA_ONLINE(); 
       }
  const result = await cgiRequest("/cgi-bin/param.cgi?pan_tiltdrive_reset"  ,`PTZ : reset ` );
  
  res.json({ success: result.ok ,data : result.data});
});

// ============================================================================
// ROUTE: PTZ STOP
// ============================================================================
app.get("/api/ptz/stop", async (req, res) => {

    if (CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE == false) { 
        console.log("⚠️CHECK_CAMERA_OFFLINE RETURN RECORDING_ERROR"); 
        return res.status(400).json({ error: "CHECK_CAMERA_OFFLINE" });
       // CHECK_CAMERA_ONLINE(); 
       }

  const ps = CAMERA_CONFIGURATION.PTZ_STATE.defaultPanSpeed;
  const ts = CAMERA_CONFIGURATION.PTZ_STATE.defaultTiltSpeed;
  const result = await cgiRequest(`/cgi-bin/ptzctrl.cgi?ptzcmd&ptzstop&${ps}&${ts}`);
  CAMERA_CONFIGURATION.PTZ_STATE.moving = false;
 // broadcastStatus();
 res.json({ success: result.ok ,data : result.data});
});


// ============================================================================
// ROUTE: PTZ MOVE  (Continuous)
// GET  /api/ptz/move?dir=UP&ps= 1 - 24&ts= 1-20
// dirs: "UP","DOWN","LEFT","RIGHT","LEFTUP","RIGHTUP","LEFTDOWN","RIGHTDOWN","PTZSTOP","HOME"
//SEND  STOP AFTER EVERY PTZ MOVE REQUEST TO STOP MOVING 
 //GET  /api/ptz/move?dir=PTZSTOP
// ============================================================================
app.get("/api/ptz/move", async (req, res) => {

    if (CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE == false) { 
        console.log("⚠️CHECK_CAMERA_OFFLINE RETURN RECORDING_ERROR"); 
        return res.status(400).json({ error: "CHECK_CAMERA_OFFLINE" });
       // CHECK_CAMERA_ONLINE(); 
       }
  
  const dir = (req.query.dir || "PTZSTOP").toUpperCase();
  const ps  = Math.min(24, Math.max(1, parseInt(req.query.ps  || CAMERA_CONFIGURATION.PTZ_STATE.defaultPanSpeed)));
  const ts  = Math.min(20, Math.max(1, parseInt(req.query.ts  || CAMERA_CONFIGURATION.PTZ_STATE.defaultTiltSpeed)));

  const VALID = ["UP","DOWN","LEFT","RIGHT","LEFTUP","RIGHTUP","LEFTDOWN","RIGHTDOWN","PTZSTOP","HOME"];
  if (!VALID.includes(dir)) return res.status(400).json({ error: "Invalid direction /api/ptz/move" });
 let result =null;
 CAMERA_CONFIGURATION.PTZ_STATE.moving = true ;
  
 if(dir === "HOME"){
     result = await cgiRequest(`/cgi-bin/ptzctrl.cgi?ptzcmd&${dir.toLowerCase()}`);
  }else{
  const ep  = dir === "PTZSTOP"? `/cgi-bin/ptzctrl.cgi?ptzcmd&ptzstop&${ps}&${ts}` : `/cgi-bin/ptzctrl.cgi?ptzcmd&${dir.toLowerCase()}&${ps}&${ts}`;
  result = await cgiRequest(ep ,`PTZ : ${dir}` );
  CAMERA_CONFIGURATION.PTZ_STATE.moving = dir !== "PTZSTOP";
  }

  //broadcastStatus();
  res.json({ success: result.ok,data : result.data,direction: dir, pan_speed: ps, tilt_speed: ts });
  CAMERA_CONFIGURATION.PTZ_STATE.moving = false;
}); 


// ============================================================================
// ROUTE: IMAGE SETTING
// GET  /api/ptz/image_setting/mode=BRIGHT&level =7
 //
// mode: ['BRIGHT', 'SATURATION', 'CONTRAST', 'SHARPNESS', 'HUE',`FLIP`,`MIRROR`,'DEFAULT'];
//default vaule  = IF DEFAULT
// bright="7"     level =1 - 7
// saturation="7" level =1 - 7
// contrast="7"   level =1 - 7
// sharpness="6"  level =1 - 7
// hue="7"        level =1 - 7 
// flip="0"       level = 0  or 1(FLIP or NO FLIP)
// mirror="0"      level = 0  or 1(MIRROR or NO MIRROR)  

// ============================================================================

app.get("/api/ptz/image_setting", async (req, res) => {

    if (CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE == false) { 
        console.log("⚠️CHECK_CAMERA_OFFLINE RETURN RECORDING_ERROR"); 
        return res.status(400).json({ error: "CHECK_CAMERA_OFFLINE" });
       // CHECK_CAMERA_ONLINE(); 
       }

   const mode = (req.query.mode).toUpperCase();
   const levelInt = Math.max(0, Math.min(14, parseInt(req.query.level)));
  const validModes = ['BRIGHT', 'SATURATION', 'CONTRAST', 'SHARPNESS', 'HUE',`FLIP`,`MIRROR`,'DEFAULT'];
 
  if (!validModes.includes(mode.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid mode' });
  }
  let result = null;
  if(mode === "DEFAULT"){
     result = await cgiRequest(`/cgi-bin/param.cgi?get_image_default_conf`);
  }else if(mode === "FLIP" || mode === "MIRROR"){
    result = await cgiRequest(`/cgi-bin/param.cgi?post_image_value&${mode.toLowerCase()}&${levelInt > 0 ? 1 : 0}`);
  }else{
   result = await cgiRequest(`/cgi-bin/param.cgi?post_image_value&${mode.toLowerCase()}&${levelInt}`);
  }

  res.json({ success: result.ok,data : result.data });


});

// ============================================================================
// ROUTE: DIRECT ABSOLUTE / RELATIVE POSITION
// POST /api/ptz/position
// body: { mode:"ABS"|"REL", ps, ts, pan:"0001"…"FFFE", tilt:"0001"…"FFFE" }
// pan:  0001=right-first … 0990=right-last | FFFE=left-first … F670=left-last
// tilt: 0001=up-first   … 0510=up-last    | FFFE=down-first … FE51=down-last
// ============================================================================

app.post("/api/ptz/position", async (req, res) => {

    if (CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE == false) { 
        console.log("⚠️CHECK_CAMERA_OFFLINE RETURN RECORDING_ERROR"); 
        return res.status(400).json({ error: "CHECK_CAMERA_OFFLINE" });
       // CHECK_CAMERA_ONLINE(); 
       }

  const { mode = "ABS", ps = 12, ts = 10, pan = "0000", tilt = "0000" } = req.body;

  if (!["ABS","REL"].includes(mode.toUpperCase()))
    return res.status(400).json({ error: "mode must be ABS or REL" });
 CAMERA_CONFIGURATION.PTZ_STATE.moving = true ;
  const ep = `/cgi-bin/ptzctrl.cgi?ptzcmd&${mode.toLowerCase()}&${ps}&${ts}&${pan}&${tilt}`;
  const result = await cgiRequest(ep);
  res.json({ success: result.ok, data : result.data,mode, pan, tilt });
   CAMERA_CONFIGURATION.PTZ_STATE.moving = false ;
});


// ============================================================================
// ROUTE: ZOOM  (Continuous)
// GET  /api/ptz/zoom?action=ZOOMIN&zs=4
// zs = zoom speed 1 - 7
// action: ZOOMIN ZOOMOUT ZOOMSTOP
//SEND  STOP AFTER EVERY PTZ ZOOM REQUEST TO STOP ZOOM  Continuous
 //GET  /api/ptz/zoom?action=ZOOMSTOP
// ============================================================================

 async  function FIXED_ZOOM_POSITION(ZOOMPOSITION,ZOOMSPEED){

   const ZOOM_POSITION    = Math.min(4000, Math.max(0, parseInt(ZOOMPOSITION || CAMERA_CONFIGURATION.PTZ_STATE.ZOOM_POS_FIXED)));
   const zs     = Math.min(7, Math.max(1, parseInt(ZOOMSPEED || CAMERA_CONFIGURATION.PTZ_STATE.defaultZoomSpeed)));
   CAMERA_CONFIGURATION.PTZ_STATE.moving = true ;
   const result = await cgiRequest(`/cgi-bin/ptzctrl.cgi?ptzcmd&zoomto&${zs}&${ZOOM_POSITION}`,`call ptz/fixed_position_zoom : ${ZOOM_POSITION}&${zs}`);
   console.log("📡 CGI FIXED_ZOOM_POSITION RESULT : ", result);
   CAMERA_CONFIGURATION.PTZ_STATE.moving = false ;
   return { success: result.ok, data : result.data, zoom_position: ZOOM_POSITION, zoom_speed: zs };

}


app.get("/api/ptz/zoom_position", async (req, res) => {

    if (CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE == false) { 
        console.log("⚠️CHECK_CAMERA_OFFLINE RETURN RECORDING_ERROR"); 
        return res.status(400).json({ error: "CHECK_CAMERA_OFFLINE" });
       // CHECK_CAMERA_ONLINE(); 
       }

  const ZOOM_POSITION = Math.min(4000, Math.max(0, parseInt(req.query.pos || CAMERA_CONFIGURATION.PTZ_STATE.ZOOM_POS_FIXED)));
  const zs     = Math.min(7, Math.max(1, parseInt(req.query.zs || CAMERA_CONFIGURATION.PTZ_STATE.defaultZoomSpeed)));
  const result = await FIXED_ZOOM_POSITION(ZOOM_POSITION,zs);
  res.json(result);
});


app.get("/api/ptz/zoom", async (req, res) => {

    if (CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE == false) { 
        console.log("⚠️CHECK_CAMERA_OFFLINE RETURN RECORDING_ERROR"); 
        return res.status(400).json({ error: "CHECK_CAMERA_OFFLINE" });
       // CHECK_CAMERA_ONLINE(); 
       }

  const action = (req.query.action || "ZOOMSTOP").toUpperCase();
  const zs     = Math.min(7, Math.max(1, parseInt(req.query.zs || CAMERA_CONFIGURATION.PTZ_STATE.defaultZoomSpeed)));
  const VALID = ["ZOOMIN","ZOOMOUT","ZOOMSTOP"];
  if (!VALID.includes(action)) return res.status(400).json({ error: "Invalid zoom action" });
  CAMERA_CONFIGURATION.PTZ_STATE.moving = true;
  const result = await cgiRequest(`/cgi-bin/ptzctrl.cgi?ptzcmd&${action.toLowerCase()}&${zs}`,`ptz/zoom : ${action.toLowerCase()}&${zs}`);
  res.json({ success: result.ok, data : result.data,action, zoom_speed: zs });
    CAMERA_CONFIGURATION.PTZ_STATE.moving = false ;
});

app.get("/api/ptz/focus_mode", async (req,res)=>{

    if (CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE == false) { 
        console.log("⚠️CHECK_CAMERA_OFFLINE RETURN RECORDING_ERROR"); 
        return res.status(400).json({ error: "CHECK_CAMERA_OFFLINE" });
       // CHECK_CAMERA_ONLINE(); 
       }

      const mode = (req.query.mode || "AUTO").toUpperCase();
      const VALID = ["AUTO","MANUAL"];
    if (!VALID.includes(mode)) return res.status(400).json({ error: "Invalid focus mode" });

    let ep;

    if(mode === "AUTO"){
        ep = `/cgi-bin/ptzctrl.cgi?ptzcmd&unlock_mfocus`;
    }else if(mode === "MANUAL"){  
        ep = `/cgi-bin/ptzctrl.cgi?ptzcmd&lock_mfocus`;
    }
    CAMERA_CONFIGURATION.PTZ_STATE.moving = true;
    const result = await cgiRequest(ep,"Focus Mode");
    CAMERA_CONFIGURATION.PTZ_STATE.moving = false;
     res.json({success:result.ok, data : result.data, mode});
});

// ============================================================================
// ROUTE: FOCUS  (Continuous)
// GET  /api/ptz/focus?action=FOCUSIN&fs=4
// fs = focus speed 1 - 7
// action: FOCUSIN FOCUSOUT STOP
//SEND  STOP AFTER EVERY PTZ FOCUS REQUEST TO STOP FOCUS  Continuous
 //GET  /api/ptz/focus?action=FOCUSSTOP
// ============================================================================
app.get("/api/ptz/focus", async (req, res) => {

    if (CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE == false) { 
        console.log("⚠️CHECK_CAMERA_OFFLINE RETURN RECORDING_ERROR"); 
        return res.status(400).json({ error: "CHECK_CAMERA_OFFLINE" });
       // CHECK_CAMERA_ONLINE(); 
       }

  const action = (req.query.action || "FOCUSSTOP").toUpperCase();
  const fs     = Math.min(7, Math.max(1, parseInt(req.query.fs || CAMERA_CONFIGURATION.PTZ_STATE.defaultFocusSpeed)));
  const VALID = ["FOCUSIN","FOCUSOUT","FOCUSSTOP"];
  if (!VALID.includes(action)) return res.status(400).json({ error: "Invalid focus action" });
CAMERA_CONFIGURATION.PTZ_STATE.moving = true;
  const result = await cgiRequest(`/cgi-bin/ptzctrl.cgi?ptzcmd&${action.toLowerCase()}&${fs}`,`ptz/focus : ${action.toLowerCase()}&${fs}`);
  CAMERA_CONFIGURATION.PTZ_STATE.moving = false;
  res.json({ success: result.ok, data : result.data,action, focus_speed: fs });
});

// ============================================================================
// ROUTE: DIRECT ZOOM POSITION
// GET  /api/ptz/zoom-to?zs=4&pos=0000  (0000=wide … 4000=tele)
// ============================================================================
app.get("/api/ptz/zoom-to", async (req, res) => {

    if (CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE == false) { 
        console.log("⚠️CHECK_CAMERA_OFFLINE RETURN RECORDING_ERROR"); 
        return res.status(400).json({ error: "CHECK_CAMERA_OFFLINE" });
       // CHECK_CAMERA_ONLINE(); 
       }
  const zs  = Math.min(7, Math.max(1, parseInt(req.query.zs  || 4)));
  const pos = req.query.pos || "0000";
  CAMERA_CONFIGURATION.PTZ_STATE.moving = true;
  const result = await cgiRequest(`/cgi-bin/ptzctrl.cgi?ptzcmd&zoomto&${zs}&${pos}`,`ptz/zoom-to : ${zs}&${pos}`);
  res.json({ success: result.ok,data : result.data, zoom_speed: zs, position: pos });
  CAMERA_CONFIGURATION.PTZ_STATE.moving = false;
});

// Preset Set
app.get("/api/ptz/preset/set/:id", async (req, res) => {

    if (CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE == false) { 
        console.log("⚠️CHECK_CAMERA_OFFLINE RETURN RECORDING_ERROR"); 
        return res.status(400).json({ error: "CHECK_CAMERA_OFFLINE" });
       // CHECK_CAMERA_ONLINE(); 
       }

  const id = parseInt(req.params.id);
  if (isNaN(id) || (id > 89 && id < 100) || id > 254) {
    return res.status(400).json({ error: "Invalid preset ID" });
  }
  const result = await cgiRequest(`/cgi-bin/ptzctrl.cgi?ptzcmd&posset&${id}`,`Preset Set ${id}`);
  res.json({ success: result.ok,data : result.data });
});

// Preset Call
app.get("/api/ptz/preset/call/:id", async (req, res) => {

    if (CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE == false) { 
        console.log("⚠️CHECK_CAMERA_OFFLINE RETURN RECORDING_ERROR"); 
        return res.status(400).json({ error: "CHECK_CAMERA_OFFLINE" });
       // CHECK_CAMERA_ONLINE(); 
       }
       
  const id = parseInt(req.params.id);
  if (isNaN(id) || id < 1  || id > 254) {
    return res.status(400).json({ error: "Invalid preset ID" });
  }
  const result = await cgiRequest(`/cgi-bin/ptzctrl.cgi?ptzcmd&poscall&${id}`,`Preset Call ${id}`);
   res.json({ success: result.ok,data : result.data });
});

 

function GET_DATE_TIME_FORMATED() {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_` + `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

function GET_DATE_FORMATED() {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}


function getFreeSpaceMB(mountPoint, callback) {

  exec(`df -k "${mountPoint}"`, (err, stdout) => {
    if (err || !stdout) {
      console.error("df error:", err);
      return callback(null);
    }

    const lines = stdout.trim().split("\n");
    if (lines.length < 2) return callback(null);

    // Filesystem 1K-blocks Used Available Use% Mounted on
    const parts = lines[1].trim().split(/\s+/);
    const availableKB = parseInt(parts[3], 10);

    if (isNaN(availableKB)) return callback(null);

    const availableMB = Math.floor(availableKB / 1024);
    callback(availableMB);
  });

  }


  function cleanupOldRecordings(videosBasePath, requiredFreeMB, callback){
  try {
    const folders = fs.readdirSync(videosBasePath)
      .map(name => ({
        name,
        fullPath: path.join(videosBasePath, name),
        stat: fs.statSync(path.join(videosBasePath, name))
      }))

      .filter(f => f.stat.isDirectory())
      .sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs); // oldest first

    if (folders.length === 0) {
      console.warn("⚠ No folders available for cleanup");
      return callback(false);
    }


    function deleteNext() {

      getFreeSpaceMB(sdMountPoint, (freeMB) => {
        if (freeMB >= requiredFreeMB) {
          console.log("✅ Storage recovered:", freeMB, "MB");
          return callback(true);
        }

        if (folders.length === 0) {
          console.error("❌ All folders deleted but still low storage");
          return callback(false);
        }

        const oldest = folders.shift();
        console.log("🗑 Deleting oldest folder:", oldest.fullPath);

        fs.rmSync(oldest.fullPath, { recursive: true, force: true });

        deleteNext();
      });
    }

    deleteNext();

  } catch (err) {
    console.error("Cleanup error:", err);
    callback(false);
  }
}

function detectSdCard(callback) {

  exec("lsblk -o NAME,TYPE,MOUNTPOINT", (error, stdout) => {
    if (error || !stdout){
      console.error("SD CARD detectSdCard lsblk error:", error);
      return callback(null, null);
    }

    const lines = stdout.split("\n");
    for (const line of lines) {
      if (line.includes("mmc") && line.includes("/media")) {

        const parts = line.trim().split(/\s+/);
         sdMountPoint = parts[parts.length - 1];

        console.log("✅ SD CARD DETECTED AT MOUNT POINT:", sdMountPoint);

        videosDir = path.join(sdMountPoint, "videos", GET_DATE_FORMATED());

        if (!fs.existsSync(videosDir)) {
          console.log("📁 Creating recording path:", videosDir);
          fs.mkdirSync(videosDir, { recursive: true });
        }

          getFreeSpaceMB(sdMountPoint, (freeMB) => {
          if (freeMB == null) {
            console.error("❌ Unable to determine SD card free space");
            return callback(null, null);
          }
         SD_CARD_FREE_SPACE = freeMB;
         
          console.log(`💾 SD CARD FREE SPACE: ${SD_CARD_FREE_SPACE} MB`);

          if (SD_CARD_FREE_SPACE < SD_CARD_MIN_REQUIRED_MB){
            console.error("❌ SD CARD LOW STORAGE — recording blocked");
            const videosBasePath = path.join(sdMountPoint, "videos");
            cleanupOldRecordings(videosBasePath, SD_CARD_MIN_REQUIRED_MB,(status) => {
            if(!status){
            console.error("❌Cleanup failed — recording blocked");
            return callback(null, freeMB);
            }

          console.log("✅ Cleanup successful — recording allowed");
          callback(sdMountPoint, freeMB);
       }); 
       
       return callback(null, null); 
     }

          console.log("✅ SD CARD STORAGE OK — recording allowed");
          callback(sdMountPoint, freeMB);
        });

        return; // stop loop after first valid SD
      }
    }

    console.warn("❌ SD CARD NOT FOUND");
    callback(null, null);
  });
}

let videosMounted = false;

function detectSdCardAsync(){

  return new Promise((resolve, reject) => {
    
    detectSdCard((mount, size) => { 
    if (!mount) {
      console.error("❌ SD CARD NOT DETECTED");
      return reject(new Error("SD_CARD_NOT_DETECTED"));
    }else{

   if (!videosMounted) {
     app.use("/videos", express.static(path.join(sdMountPoint, "videos")));
     videosMounted = true;
  }
    console.log("SD CARD DETECTED AVAILABLE CAPACITY MB:",size);
     resolve({ mount, size });
     
   }

   });
  
  });
      
     
}


app.get("/api/sdcard/check", async (req, res) => {

  try {

    const { mount, size } = await detectSdCardAsync();

    if (size <= SD_CARD_MIN_REQUIRED_MB) {
      return res.status(400).json({error: "SD_CARD_CAPACITY_FULL"});
    }

    res.json({
      success: true,
      mount,
      size
    });

  } catch (err) {

    res.status(400).json({
      error: err.message
    });
  }
});

function getUniqueFilePath(dir, baseName, ext){

  baseName = path.basename(baseName, path.extname(baseName));
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



function getNextSegmentPath(baseFilename) {
  const index = RECORDING_STATE.segments.length + 1;
  const name  = `${baseFilename}seg_part${index}`;
  return getUniqueFilePath(videosDir, name, CAMERA_CONFIGURATION.EXTENSION);

}



async function findCameraPortPath() {

  try {
    const lsusbOutput = execSync(`lsusb`).toString();
    console.log("📋 AVAILABLE USB devices:\n", lsusbOutput);

    const lsusb_t_Output = execSync(`lsusb -t`).toString();
    console.log("📋 AVAILABLE USB PORT LINK devices:\n", lsusb_t_Output);

     const LAST_DEVICE_NODE_LINK = execSync(` ls -ltr /dev/video*`).toString();
    console.log("📋 AVAILABLE LAST_DEVICE_NODE_LINK:\n", LAST_DEVICE_NODE_LINK);
      
    const V4_LINUX_LINK_NODE = execSync(`v4l2-ctl --list-devices`).toString();
    console.log("📋 v4l2-ctl --list-devices :\n", V4_LINUX_LINK_NODE);
   

    const usbDevices = fs.readdirSync("/sys/bus/usb/devices");
     console.error("USB DEVICE LIST",usbDevices);
    for (let i = 0; i < usbDevices.length; i++) {
      const dev = usbDevices[i];
      console.error("DEVICE CHECK",dev);
      if (!dev.includes("-")) continue; // skip root hubs
      console.error("correct DEVICE CHECK",dev);
      
       const base = `/sys/bus/usb/devices/${dev}`;
      const vendorFile = path.join(base, "idVendor");
      const productFile = path.join(base, "idProduct");
      const productNameFile = path.join(base, "product");

      if (!fs.existsSync(vendorFile) || !fs.existsSync(productFile)) continue;

      const vendor = fs.readFileSync(vendorFile, "utf8").trim();
      const product = fs.readFileSync(productFile, "utf8").trim();
      const productName = fs.existsSync(productNameFile)? fs.readFileSync(productNameFile, "utf8").trim(): "Unknown";

      // 🎯 Target camera
      if (vendor === "2e7e" && product === "0c3e" ){ //product === "0877"
       //console.error("DEVICE base CHECK",base);
        const entries = fs.readdirSync(base);

        for (const entry of entries){
         // console.error("DEVICE entries CHECK",entries);
         const videoPath = path.join(base, entry, "video4linux");
        // console.error("DEVICE video4linux CHECK",videoPath);
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

  }catch(err){
    console.error("❌ Camera detection failed:", err.message);
    return null;
  }
}



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
async function usbHardReset(){

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
    
    // // Check for usbreset tool
    // if (!fs.existsSync('/usr/local/bin/usbreset')) {
    //   console.log("📥 Installing usbreset...");
    //   await installUsbreset();
    // }
    
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


 async function checkCameraHealth( print){
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
    console.log("⚠️ FAILED RECOVERY Trying USB hardware reset...");
    recovered = await resetCameraDevice("RESET_USB");
  }
  if(!recovered){
    console.error("❌ All recovery attempts failed");
   }
 
}

// scriptchild.kill('SIGTERM'); // Default - graceful shutdown (15)
// child.kill('SIGKILL'); // Force kill - immediate termination (9)
// child.kill('SIGINT');  // Interrupt - like Ctrl+C (2)
// child.kill('SIGHUP');  // Hangup - terminal closed (1)
// child.kill('SIGQUIT'); // Quit with core dump (3)

async function killFFmpeg(reason = "UNKNOWN"){

     console.log(`⛔🧹KILLING FFMPEG: ${reason}`);
  if (!ffmpegProcess || ffmpegStopping){
       console.log(`⛔ KILL IGNORED (NO FFMPEG) or (ALREADY STOPPING ffmpegStopping running : ${ffmpegStopping} ) `);
       return;
     }
   const now = Date.now();
  //   if (now - lastStopTs < MIN_STOP_INTERVAL_MS){      // ❌ stop called too soon
  //   console.log(`⏱killFFmpeg  STOP IGNORED TIME (TOO FAST) : ${reason}`);
  //   return;
  // } 
     
  try {

     ffmpegStopping = true;
     lastStopTs = now;
     console.log("📝 killFFmpeg(graceful shutdown) PID VALUE : ",ffmpegProcess.pid);
    
    if (ffmpegProcess.stdout) {
      console.log("📝 killFFmpeg(graceful stdout) clean : ");
      // ffmpegProcess.stdout.pause();
       ffmpegProcess.stdout.removeAllListeners("data");
      // ffmpegProcess.stdout.removeAllListeners();
    }
    
    if (ffmpegProcess.stderr) {
       console.log("📝 killFFmpeg(graceful stdout) clean : ");
     // ffmpegProcess.stderr.pause();
      ffmpegProcess.stderr.removeAllListeners("data");
      //ffmpegProcess.stderr.removeAllListeners();
    }

      ffmpegProcess.removeAllListeners();
      ffmpegProcess.stdout.unpipe();

    //ffmpegProcess.kill("SIGTERM");
    ffmpegProcess.kill("SIGINT");
    
    await new Promise(resolve => { ffmpegProcess.once("close", code => { 
          console.log(` killFFmpeg FFMPEG CLOSED: ${code}`);
          resolve(); 
            });
        });

      await new Promise(r => setTimeout(r,100));

    if(ffmpegProcess && !ffmpegProcess.killed){
      console.warn("⚠️ ERROR killFFmpeg ....Force SIGKILL" );
      ffmpegProcess.kill("SIGKILL");
     await new Promise(r => setTimeout(r, 500));
    }

  console.log("✅ KILL_FFMPEG SUCCESSFULLY");
  ffmpegProcess = null;
  ffmpegStopping = false;
  ALLOWED_LIVE_FLAG = true; 

  } catch (e){
    console.warn("⚠️ killFFmpeg Kill error:", e.message);
  }

}

let initBuffer;
let initReady = false;

function findMoovEnd(buffer){
  let offset = 0;

  while (offset + 8 <= buffer.length) {
    const size = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);

    if (size < 8) return null;

    if (type === "moov") {
      const end = offset + size;
      if (buffer.length >= end) {
        return end;
      }
      return null; // moov not fully arrived yet
    }

    offset += size;
  }
  return null;
}

// ffmpeg -f v4l2 -i /dev/video0 -frames:v 1 snapshot.jpg
// //ffmpeg -rtsp_transport tcp -i rtsp://camera/stream1 -frames:v 1 snapshot.jpg
// "-vframes", "1",
// "-q:v", "2",
// "snapshot.jpg"

//CAMERA_CONFIGURATION.CAMERA_MODE ="USB";


function RUN_FFMPEG_ARGUMENT_COMMAND({ outputPath = null, enableLive = false }){
  
  FFMPEG_ERROR.result = false;
  FFMPEG_ERROR.reason = "------";

  if (ffmpegProcess  || ffmpegStopping ){
       FFMPEG_ERROR.result = false;
       FFMPEG_ERROR.reason = "FFMPEG_ALREADY_RUNNING";
       console.log("FFMPEG_ERROR",FFMPEG_ERROR.reason);
       return { success: FFMPEG_ERROR.result, errorId: FFMPEG_ERROR.INVALID_ARGUMENT, reason:FFMPEG_ERROR.reason };
  }

  let args;
 if(CAMERA_CONFIGURATION.CAMERA_MODE === "USB"){

      //   const videoDev =  findCameraPortPath();
      //  if (!videoDev || !videoDev.videoNode){
      //  console.log(" CAMERA_USB_ERROR_RESET:", videoDev);
      //  FFMPEG_ERROR.result = false;
      //  FFMPEG_ERROR.reason = "USB_CAMERA_PORT_ERROR";
      //  console.log("FFMPEG_ERROR",FFMPEG_ERROR.reason);
      //  return { success: FFMPEG_ERROR.result, errorId: FFMPEG_ERROR.INVALID_ARGUMENT, reason:FFMPEG_ERROR.reason };
  
      // }else{
      //   //console.log("LIVE BEFORE CAMERA_CONFIGURATION:", CAMERA_CONFIGURATION);
      //   CAMERA_CONFIGURATION.DEVICE_NODE = videoDev.videoNode;
      // }

 

  args = [

    "-loglevel", "error",
    "-fflags", "+genpts+discardcorrupt+nobuffer",
    "-rtbufsize", "100M",  // ← Add buffer
   // "-stimeout", "5000000",
    "-f", "v4l2",
    "-input_format", "h264",
    "-video_size", CAMERA_CONFIGURATION.resolution,
    "-framerate", String(CAMERA_CONFIGURATION.fps),
    "-thread_queue_size", "512",  // ← Add thread queue
    "-i", CAMERA_CONFIGURATION.DEVICE_NODE,
   //  "-f", "alsa",            // 🎤 AUDIO
    // "-i", "hw:1",            // adjust mic device
    "-map", "0:v",
    "-c:v", "copy",
    //"-c:a", "aac",
   // "-b:a", "128k",
    "-avoid_negative_ts", "make_zero",  // ← Fix timestamp issues
    "-flush_packets","1",
    "-use_wallclock_as_timestamps", "1"
  ];

  // 🎥 OUTPUT MODE
  if (enableLive && outputPath){
   
    console.log("✅ FFMPEG enableLive && outputPath",outputPath);
    args.push(
      "-f", "tee",
      //`[f=mp4:movflags=+faststart]${outputPath}|` + `[f=mp4:g=30:keyint_min=30:sc_threshold=0:movflags=frag_keyframe+empty_moov+default_base_moof:frag_duration=100000]pipe:1`
      `[f=mp4:movflags=+faststart]${outputPath}|` + `[f=rtsp:rtsp_transport=tcp]rtsp://localhost:8554/live_camera`
    );

  }else if(enableLive){
   
  
    console.log("✅ FFMPEG  enableLive ONLY ");
    args.push(
   "-f", "rtsp",
   "-rtsp_transport", "tcp",
   "rtsp://localhost:8554/live_camera"
   
    // "-flush_packets","1",
    // "-f", "mp4",//"h264"
    // "-g" ,"30",
    // "-keyint_min","30",
    // "-sc_threshold","0",
    // "-movflags", "frag_keyframe+empty_moov+default_base_moof",
    // "-frag_duration", "100000",   // 100ms fragments
    // "pipe:1"
    );

   }else if(outputPath){
    
    console.log("✅ FFMPEG  outputPath ONLY");
    args.push(
     "-f", "mp4",
    "-movflags", "+faststart",
     outputPath
    );

  }else{ 
    FFMPEG_ERROR.result = false;
    FFMPEG_ERROR.reason = "NO_OUTPUT_DEFINED";
    return { success: FFMPEG_ERROR.result, errorId: FFMPEG_ERROR.INVALID_ARGUMENT, reason:FFMPEG_ERROR.reason };
  }

  }else if(CAMERA_CONFIGURATION.CAMERA_MODE === "RTSP"){

   
    if (CAMERA_CONFIGURATION.camera_network.CAMERA_ONLINE == false) { 
       console.log("⚠️CHECK_CAMERA_OFFLINE RETURN RECORDING_ERROR"); 
        FFMPEG_ERROR.result = false;
        FFMPEG_ERROR.reason = "CHECK_CAMERA_OFFLINE";
        CHECK_CAMERA_ONLINE();
      
    return { success: FFMPEG_ERROR.result, errorId: FFMPEG_ERROR.INVALID_ARGUMENT, reason:FFMPEG_ERROR.reason }; 
    }else{

      //FIXED_ZOOM_POSITION(CAMERA_CONFIGURATION.ZOOM_IN_FIXED,7);
    }

     args = [
     "-rtsp_transport", "tcp",
     "-loglevel", "error",
     "-fflags", "+genpts+discardcorrupt+nobuffer",
     "-flags", "low_delay",
     "-rtbufsize", "100M",
     "-stimeout", "5000000",
     "-i", CAMERA_CONFIGURATION.camera_network.rtspUrl,
     "-c:v", "copy",
     // "-c:a", "copy",
     "-map", "0:v",
     "-avoid_negative_ts", "make_zero",
     "-use_wallclock_as_timestamps", "1",
     "-flush_packets", "1",
     "-f", "mp4",
    "-movflags", "+faststart",
     outputPath
    // "-f", "mp4",
    // "-movflags", "frag_keyframe+empty_moov+default_base_moof",
   //  "-frag_duration", "100000",
    // "pipe:1"
];


 }else{
    
    FFMPEG_ERROR.result = false;
    FFMPEG_ERROR.reason = "NO_OUTPUT_DEFINED";
    return { success: FFMPEG_ERROR.result, errorId: FFMPEG_ERROR.INVALID_ARGUMENT, reason:FFMPEG_ERROR.reason };

      }

  // 🚀 SPAWN
  try {
     console.log("✅ FFMPEG ",args);
    ffmpegProcess = spawn("ffmpeg", args);
  
  }catch (err){
      FFMPEG_ERROR.result = false;
      FFMPEG_ERROR.reason = "FFMPEG_PROCESS_FAILED_DEFINED";
      return { success: FFMPEG_ERROR.result, errorId: FFMPEG_ERROR.INVALID_ARGUMENT, reason:FFMPEG_ERROR.reason   };
  }
   

  ffmpegProcess.stderr.on("data", data => {

    const msg = data.toString();
     console.error("SBC FFMPEG ERROR:", msg);
    if(msg.includes("error") || msg.includes("Error")){
     
      FFMPEG_ERROR.result = false;
      FFMPEG_ERROR.reason = data.toString();

         if(isCameraDeviceError(msg) && CAMERA_CONFIGURATION.CAMERA_MODE === "USB" ){
            killFFmpeg("🚨 KILL CAMERA DEVICE ERROR DETECTED");
          if (msg.includes("Input/output error") || msg.includes("No such device") || msg.includes("Cannot open video device /dev/video0") ){
              CAMERA_USB_PORT_ERROR_SOLVE("RE_UN_BIND_USB"); 
          }
       }
          return { success: FFMPEG_ERROR.result, errorId: FFMPEG_ERROR.INVALID_ARGUMENT, reason:FFMPEG_ERROR.reason};
      }

  });

  ffmpegProcess.stdout.on('end', () => {
  console.log('🚨FFMPEG stdout data stream ended');
  });

 ffmpegProcess.stderr.on('end', (err) => {
  console.log('🚨FFMPEG stderr data stream ended');
 });

 // 7. stderr error
ffmpegProcess.stderr.on('error', (err) => {
  console.log('🚨FFMPEG stderr error:', err.code);
});

// 8. stdin error
ffmpegProcess.stdin.on('error', (err) => {
  console.log('🚨FFMPEG stdin error:', err.code);
});


  ffmpegProcess.on('exit', (code, signal) => { 
  console.log(`🧹 FFMPEG EXITED EVENT code : ${code} signal: ${signal}`);     // 0 = success, non-zero = error   // SIGTERM, SIGKILL, etc.
});

// Examples:
// code: 0, signal: null         → Normal exit
// code: 1, signal: null         → Error exit

// Common errors:
// ENOENT → Command not found
// EACCES → No permission to execute
// EPERM  → Operation not permitted

  ffmpegProcess.on('close', (code, signal) => {
    ffmpegProcess = null;
    ffmpegStopping = false;
    console.log(`🧹 FFMPEG CLOSED EVENT code : ${code} kksignal: ${signal}`);
   });


ffmpegProcess.on('error', (error) => {
  console.error('Error EVENT:', error);
  if (error.code === 'ENOENT') {
    console.error('FFMPEG Command not found!');
  }else if(error.code === 'EACCES') {
    console.error('FFMPEG Permission denied!');
  }else if (error.code === 'EPERM') {
    console.error('FFMPEG POperation not permitted');
  }else {
    console.error('FFMPEG Stream error:', error.code);
  }
});


  return new Promise((resolve, reject) => {

        ffmpegProcess.once("spawn", () => {
        console.log("✅ FFMPEG STARTED");
        FFMPEG_ERROR.result = true;
        FFMPEG_ERROR.reason = "RECORDING_START";
        resolve();
    });

      ffmpegProcess.once("error", (err) => {
      console.error("❌ FFMPEG SPAWN ERROR:", err);
      reject(err);

    });
    
  });
 

}


app.post("/start", async (req, res) => {
  console.log("/start request receive");
  try {

     if (RECORDING_STATE.active){
        console.log("/start request RECORDING_ALREADY_RUNNING",RECORDING_STATE.active);
        return res.status(400).json({ error: "RECORDING_ALREADY_RUNNING" });
    }

    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ error: "INVALID_REQUEST_BODY" });
    }
  
//  "filename" :"hh",
//  "EXT_DETAILS":null,
//  "TIMER_MSEC":null,
//  "TIMER_STATE" : false,
//  "AUDIO_MUTE_FLAG": true 

    const { filename, AUDIO_MUTE_FLAG , TIMER_MSEC, TIMER_STATE ,EXT_DETAILS} = req.body;
    const FILE_NAME_TEMP = typeof filename === "string" && filename.trim() ? filename.trim() : `video_${GET_DATE_TIME_FORMATED()}`;

 if (!isSafeName(FILE_NAME_TEMP)){
     return res.status(400).json({ error: "INVALID_REQUEST_filename_character" });
    }

    const { mount, size } = await detectSdCardAsync();
    if(!mount){
      return res.status(400).json({ error: "SD_CARD_NOT_DETECTED" });
    }else if(mount && size <= SD_CARD_MIN_REQUIRED_MB){
       return res.status(400).json({ error: "SD_CARD_CAPACITY_FULL" });
    }

      if (ffmpegProcess && !ffmpegStopping){
          await killFFmpeg("CLEANUP ON NEW RECORDING START");
          await new Promise(r => setTimeout(r, 100));
      }
     
    if(ffmpegProcess != null ){
    console.log("CAMERA_ALREADY_RUNNING : ",ffmpegStopping);
    return res.status(500).json({ error: "CAMERA_PROCESS_RUNNING" });

  }
      RESET_DAUFALT_CAMERA_STATE();
    
    WESOCKET_SEND_DATA_CONNECTED_FLAG = true;

    const outputPath = getUniqueFilePath(videosDir,FILE_NAME_TEMP,CAMERA_CONFIGURATION.EXTENSION);
    const segmentPath = getNextSegmentPath(FILE_NAME_TEMP);
    console.log("FIRST REC SEGMENT PATH:", segmentPath);

    RUN_FFMPEG_ARGUMENT_COMMAND({ outputPath: segmentPath,enableLive: LIVE_STREAM_ENABLED});
   
    setTimeout(() => {
    //console.log("RUN_FFMPEG_ARGUMENT_COMMAND OUTPUT",FFMPEG_ERROR);

    if (!FFMPEG_ERROR.result){
      console.error(" RUN_FFMPEG_ARGUMENT_COMMAND FAILED");
      RECORDING_STATE.active = false;
       return res.status(400).json({ error: FFMPEG_ERROR.reason });
      //return res.status(500).json({success: FFMPEG_ERROR.result,error: "CAMERA_FAILED",reason: FFMPEG_ERROR.reason});
    }else{

      console.log("▶ RECORDING STARTED");
    RECORDING_STATE.status = "RECORDING";
    RECORDING_STATE.curr_segment = segmentPath;
    RECORDING_STATE.segments.push(segmentPath);
    RECORDING_STATE.filename = FILE_NAME_TEMP; 
    RECORDING_STATE.FINAL_FILE_NAME = path.basename(outputPath);
    RECORDING_STATE.VIDEO_FOLDER_NAME =  GET_DATE_FORMATED();
    RECORDING_STATE.FINAL_FILE_SAVE_PATH =  outputPath;  
    RECORDING_STATE.FINAL_FILE_URL_PATH = path.join( "videos",RECORDING_STATE.VIDEO_FOLDER_NAME, RECORDING_STATE.FINAL_FILE_NAME);
   
    RECORDING_STATE.active = true;
    RECORDING_STATE.REC_START_TIME = Date.now();
    RECORDING_STATE.paused = false;
    RECORDING_STATE.PAUSED_AT_TIME = null;
    RECORDING_STATE.TOT_PAUSED_DURATION_MS = 0;

   console.log("FINAL_FILE_SAVE_PATH : ",RECORDING_STATE.FINAL_FILE_SAVE_PATH);
       
     return res.json({
      success: true,
      RECORDING_STATE :CAMERA_STATE_STATUS(),
    });
  }
    }, 1000); 
    
 } catch (err) {
    console.error("START_REC_SERVER_FAILED:", err);
    return res.status(500).json({ error: "START_REC_SERVER_FAILED" });
  }
});


app.post("/pause", async (req, res) => {

  console.log("⏸ PAUSE request received");

  if (!RECORDING_STATE.active || RECORDING_STATE.paused) {
     console.log("INVALID PAUSED_STATE: ",RECORDING_STATE.paused );
     console.log("INVALID START_REC_STATE: ",RECORDING_STATE.active );
    return res.status(400).json({ error: "INVALID_PAUSED_STATE" });
  }

  try {

   

     if(ffmpegProcess && ffmpegStopping == false ){
         RECORDING_STATE.paused = true;
         RECORDING_STATE.PAUSED_AT_TIME = Date.now(); // ✅ freeze timer
         RECORDING_STATE.status = "PAUSED";
         await new Promise(r => setTimeout(r, 300));
         await killFFmpeg("PAUSED_STATE STOP FFmpeg.....");
        console.log("⏸ RECORDING PAUSED at", RECORDING_STATE.PAUSED_AT_TIME);

   

     return res.json({
      success: true,
      RECORDING_STATE :CAMERA_STATE_STATUS()
    });

  }else{ 
          console.error("PAUSE ffmpegProcess EEROR :");
          res.status(500).json({ error: "PAUSE_FAILED" });
        }

  }catch (err){
    console.error("PAUSE_FAILED:", err);
    res.status(500).json({ error: "PAUSE_FAILED" });
  }

});




app.post("/resume", async(req, res) => {

    console.log("▶ RESUMED request RECIEVE");
    if (!RECORDING_STATE.active || !RECORDING_STATE.paused){
       console.log("▶INVALID_RESUME_STATE : ",RECORDING_STATE.active ,"PAUSED : ",RECORDING_STATE.paused);
       return res.status(400).json({ error: "INVALID_RESUME_STATE" });
      }

  try{

   
   const baseName = RECORDING_STATE.filename; 
   console.log("RESUME baseName NAME ",baseName);

   const segmentPath = getNextSegmentPath(baseName);
   console.error("RESUME NEW SEGMENT NAME ",segmentPath);

   if (ffmpegProcess && !ffmpegStopping){
       RECORDING_STATE.paused = false;
       await killFFmpeg("CLEANUP ON NEW RESUMED START");
       await new Promise(r => setTimeout(r, 200));
      }
     
    if(ffmpegProcess != null ){
    console.log("RESUME_CAMERA_ALREADY_RUNNING : ",ffmpegStopping);
    return res.status(500).json({ error: "RESUME_CAMERA_PROCESS_RUNNING" });

  }

    WESOCKET_SEND_DATA_CONNECTED_FLAG = true;
    RUN_FFMPEG_ARGUMENT_COMMAND({ enableLive: LIVE_STREAM_ENABLED,outputPath: segmentPath});
    setTimeout(() => { 
     if (!FFMPEG_ERROR.result){
      console.error(" RUN_FFMPEG_ARGUMENT_COMMAND FAILED");
     return res.status(500).json({ error: FFMPEG_ERROR.reason });
    }else{

      console.log("▶ RECORDING RESUMED");
      const pausedDuration = Date.now() - RECORDING_STATE.PAUSED_AT_TIME;
      RECORDING_STATE.curr_segment = segmentPath;
      RECORDING_STATE.segments.push(segmentPath);
      RECORDING_STATE.status = "RECORDING";
      RECORDING_STATE.filename = baseName;
      RECORDING_STATE.TOT_PAUSED_DURATION_MS += pausedDuration;
      RECORDING_STATE.paused = false;
      RECORDING_STATE.PAUSED_AT_TIME = null; // ✅ VERY IMPORTANT
      RECORDING_STATE.active = true;

     return res.json({
      success: true,
      RECORDING_STATE :CAMERA_STATE_STATUS()
    });
  }
    },500); 

  }catch (err){
    console.error("RESUME FAILED:", err);
    res.status(500).json({ error: "RESUME_FAILED" });
  }

});


let segmentListFile = null;
async function mergeSegmentsWithRetry(segments, finalMp4, maxRetries = 3){
 
  for (let attempt = 1; attempt <= maxRetries; attempt++){
    console.log(`🔄 MERGE REC FILE ATTEMPT: ${attempt}/${maxRetries}`);
    try{

      const missingFiles = [];
      const emptyFiles   = [];
      const validSegments = [];

      // for (const file of segments){
      //   if (!fs.existsSync(file)){
      //        missingFiles.push(file);
      //   }else{
      //      const stats = fs.statSync(file);
      //      if(stats.size === 0){
      //       emptyFiles.push(file);}
      //   }
      // }
      
      // if (missingFiles.length > 0) {
      //   throw new Error(`Missing segments: ${missingFiles.join(', ')}`);
      // }
      
      // if (emptyFiles.length > 0) {
      //   console.log(`⚠️ Empty segments found: ${emptyFiles.join(', ')}`);
      // }

    

for (const file of segments){

  if (!fs.existsSync(file)){
    console.warn("❌ Missing segment:", file);
    continue;
  }

  const stats = fs.statSync(file);

  if (stats.size < 1000){   // less than 1KB = broken
    console.warn("⚠️ Ignoring corrupted segment:", file);
    continue;
  }

  validSegments.push(file);
}

if (validSegments.length === 0){
  throw new Error("NO_VALID_SEGMENTS_FOUND");
}

console.log("✅ Valid segments:", validSegments.length);
      const segmentListFile = path.join(videosDir, `rec_video_segments_${Date.now()}.txt`);
     // fs.writeFileSync(segmentListFile, segments.map(f => `file '${f}'`).join("\n"));
      fs.writeFileSync(segmentListFile,validSegments.map(f => `file '${f}'`).join("\n"));

      console.log("📄 Segment list created:", segmentListFile);   

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
        reject({type: "SPAWN_ERROR",message: err.message,stderr: stderrOutput});
        });
        
        merge.on("close", code => {
          try {
            if (fs.existsSync(segmentListFile)){
                fs.unlinkSync(segmentListFile);
            }
          } catch (e) {
            console.warn("⚠️ Failed to delete segment list:", e.message);
          }
          
        if (code === 0){

            if (!fs.existsSync(finalMp4)) { 
              reject({
                type: "OUTPUT_NOT_CREATED",
                message: "Merge succeeded but FINAL RECORDING file not found",
                stderr: stderrOutput
              });
              return;
            }
            
            const stats = fs.statSync(finalMp4);
            if (stats.size === 0){
              reject({
                type: "EMPTY_OUTPUT",
                message: "OUTPUT_REC_FILE_EMPTY",
                stderr: stderrOutput
              });
              return;
            }

          console.log(`✅ Merge successful! Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
          resolve({ success: true, size: stats.size });
         
        }else{

            let errorType = "UNKNOWN_ERROR";
            let errorMessage = `FFmpeg exited with code ${code}`;
            
            if(stderrOutput.includes("Invalid data found")){
              errorType = "INVALID_DATA";
              errorMessage = "Invalid or corrupted data in segment files";

            }else if (stderrOutput.includes("No such file")){
              errorType = "FILE_NOT_FOUND";
              errorMessage = "Segment file not found during merge";

            }else if (stderrOutput.includes("Permission denied")){
              errorType = "PERMISSION_DENIED";
              errorMessage = "Permission denied accessing files";

            }else if (stderrOutput.includes("moov atom not found")){
              errorType = "MOOV_ATOM_MISSING";
              errorMessage = "Segment file missing moov atom (incomplete)";

            }else if (stderrOutput.includes("No space left")){
              errorType = "NO_SPACE";
              errorMessage = "No space left on device";

            }else if (stderrOutput.includes("I/O error")){
              errorType = "IO_ERROR";
              errorMessage = "I/O error reading/writing files";

            }else if (stderrOutput.includes("Timestamps are unset")){
              errorType = "TIMESTAMP_ERROR";
              errorMessage = "Timestamp issues in segments";
            }
            reject({type: errorType,message: errorMessage,code: code,stderr: stderrOutput});
               }

           });

      });
      
      return result; // Success!
      
    } catch (error) {

      console.error(`❌ Merge attempt ${attempt} failed:`);
      console.error(`   Type: ${error.type || "UNKNOWN"}`);
      console.error(`   Message: ${error.message}`);
      
      if (error.stderr){
       // console.error(`   FFmpeg output (last 500 chars):`);
        //console.error(`   ${error.stderr.slice(-500)}`);
        console.error("MERGE ERROR REASON :",error.stderr);
      }
      
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retry
      console.log(`⏳ Waiting 2 seconds before retry...`);
      await new Promise(r => setTimeout(r, 1000));

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


STOPING_RUNNING_FLAG = false;
app.post("/stop", async (req, res) => {
    console.log("⏹STOP RECORDING REQUEST");
  
  if (!RECORDING_STATE.active || STOPING_RUNNING_FLAG ) { 
    console.log("NO_ACTIVE_RECORDING");
    return res.status(400).json({ error: "NO_ACTIVE_RECORDING" });
  }

  try {
     STOPING_RUNNING_FLAG = true;
     RECORDING_STATE.REC_STOP_TIME = Date.now();
     RECORDING_STATE.REC_VIDEO_DURATION = RECORDING_STATE.REC_STOP_TIME - RECORDING_STATE.REC_START_TIME;

    if (ffmpegProcess && ffmpegStopping == false) {
        await new Promise(r => setTimeout(r, 300));
        await killFFmpeg("STOP RECORDING REQUEST");
     }

      await new Promise(r => setTimeout(r, 100));

    let finalMp4 = RECORDING_STATE.FINAL_FILE_SAVE_PATH;
    if (!finalMp4.endsWith(".mp4")){
         finalMp4 += ".mp4";
     }console.log("🎬 Final MP4 PATH :", finalMp4);
    
    const segments = RECORDING_STATE.segments;
    console.log("📋Total segments:", segments.length);
     if (!segments || segments.length === 0) {
      STOPING_RUNNING_FLAG = false;
      throw new Error("NO_SEGMENTS_FOUND");
    }

    for (const file of segments){

      if (fs.existsSync(file)){
        const stats = fs.statSync(file);
        console.log(`✅ ${path.basename(file)} - ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
      }else{
        console.log(`❌ ${path.basename(file)} - NOT FOUND`);
      }
    }

    const mergeResult = await mergeSegmentsWithRetry(segments, finalMp4, 1);
    for (const file of segments){
      try {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
           console.log(`🗑️CLEAN UP SEGMENT FILE:: ${path.basename(file)}`);
        }
      } catch (e) {
        console.warn(`⚠️ Could not delete ${path.basename(file)}:`, e.message);
      }
    }
  
       RECORDING_STATE.status = "IDLE";
       RECORDING_STATE.active = false;
       RECORDING_STATE.paused = false;
       RECORDING_STATE.PAUSED_AT_TIME = null;
       RECORDING_STATE.TOT_PAUSED_DURATION_MS = 0;
      
    
       console.log("🏁 RECORDING COMPLETED");
       res.json({
       success: true,
       RECORDING_STATE :CAMERA_STATE_STATUS()
    });
        STOPING_RUNNING_FLAG = false;
        RESET_DAUFALT_CAMERA_STATE();

  } catch (err) {
    console.error("STOP FAILED Error type:", err.type ,"Error message:", err.message);
    for (const file of RECORDING_STATE.segments){
      try{
        if(fs.existsSync(file)) {
          fs.unlinkSync(file);
          console.log(`🗑️ CLEAN UP SEGMENT FILE: ${path.basename(file)}`);
        }
      }catch (e){
        console.warn(`⚠️ Could not delete SEGMENT FILE : ${path.basename(file)}:`, e.message);
      }
    }
    STOPING_RUNNING_FLAG = false;
    RESET_DAUFALT_CAMERA_STATE();
     res.status(500).json({ error: "STOP_FAILED" ,type: err.type || "UNKNOWN",message: err.message, details: err.stderr ? "Check server logs for FFmpeg output" : undefined});
  }
});


app.get("/reset", async (req, res) => {

  console.log("\n🗑️ reset REQUEST RECIEVE...");
   
 try {

   if (ffmpegProcess  && ffmpegStopping == false){
         killFFmpeg("⛔PAUSE STOP RECORDING");
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

          RESET_DAUFALT_CAMERA_STATE();
   
    res.json({
      success: true,
      RECORDING_STATE: CAMERA_STATE_STATUS()
    });

} catch (err){  

        console.log("\n🗑️ reset REQUEST RECIEVE AND FAILED...");
        res.status(500).json({error: "RESET_FAILED",type: err.type || "UNKNOWN",message: err.message,details: err.stderr ? "Check server logs for FFmpeg output" : undefined});
          }   
  
});



// wss.on("connection", async (ws, req) => {

//   console.log("WS CLIENT CONNECTED REQUEST");
//    ws.isInitSent = false;
//   liveClients.add(ws);
//    WESOCKET_CONNECTED_FLAG = true;
//   console.log("wss CONNECT REQ LIVE CLIENT COUNT: ", liveClients.size,RECORDING_STATE.active);
//   // 🚀 If init segment already available, send immediately
//   if (ffmpegProcess && mp4Header && ws.readyState === WebSocket.OPEN && !ws.isInitSent ) {
//   //  ws.send(mp4Header);
//    // ws.isInitSent = true;
//     //console.log("📦 WSS Init mp4Header segment sent to new client",mp4Header);
//   }

//   const clientId = Date.now() + Math.random().toString(36).substr(2, 9);
//   const clientIp = req.socket.remoteAddress;
//   const clientIport  = req.socket.remotePort;
//   const clientIFamily  = req.socket.remoteFamily;
  
//   console.log(`\n🔌 WS CLIENT CONNECTED`);
//   console.log(`   ID: ${clientId}`);
//   console.log(`   IP: ${clientIp}`);
//   console.log(`   port: ${clientIport}`);
//   console.log(`   family: ${clientIFamily}`);


//  //🔑 KEY FIX: Don't start new FFmpeg if recording is active
//   ws.onmessage = event => { 

//     if (typeof event.data === "string"){

//         const msg = JSON.parse(event.data);
//         console.log("WSS RECIEVE EVENT MESSAGE",msg);

//         if (msg.type === "STREAM_HEADER"){
//             console.log("🔁 VIDEO HEADER REQ ",msg.message);
//             ws.isInitSent = false;
//             return;
//         }

//     }

//   }

//  if(ffmpegStopping && ffmpegProcess){  /// ALWAYS FIRST 
//     console.log("📦 WAIT ffmpegStopping IS TRUE BEFORE STARTING NEW LIVE ",);
//      await new Promise(r => setTimeout(r, 3000));
//   }

// if (ffmpegProcess || RECORDING_STATE.active){
//     console.log("📺 ALREADY LIVE SESSION STARTED SENDDING MP4 HEADER - NEW CLIENT ADDED");
//     ws.send(JSON.stringify({ type: "STREAM_READY", message: "ALREADY LIVE SESSION STARTED SENDDING MP4 HEADER"}));
//      ws.isInitSent = false;
//     return;
//   }

 
// if ( !ALLOWED_LIVE_FLAG && !ffmpegProcess && RECORDING_STATE.active &&  liveClients.size > 1 ){
//   ALLOWED_LIVE_FLAG = true;
// }

// if ( ALLOWED_LIVE_FLAG && !ffmpegProcess ){
//   ALLOWED_LIVE_FLAG = false;
 
//   // await new Promise(r => setTimeout(r, 500));
//   //   const result = RUN_FFMPEG_ARGUMENT_COMMAND({
//   //     enableLive: true,
//   //     outputPath: null
//   //   });
    
//   //   setTimeout(() => {
//   //     if (!FFMPEG_ERROR.result){
//   //       console.error("❌ WSS Failed to start live stream");
//   //       ws.send(JSON.stringify({ type: "ERROR", message: "Failed to start live stream" }));
//   //     } else{
//   //       console.log("✅ WSS LIVE STREAM STARTED");
//   //       ws.send(JSON.stringify({ type: "STREAM_READY", message: "NEW LIVE SESSION STARTED"}));
//   //     }

//   //   }, 1000);
//   // }else{ console.log("✅ WSS LIVE STREAM ALREADY REGISTER WAIT TO CLEAN UP ALLOWED_LIVE_FLAG : ",ALLOWED_LIVE_FLAG);    } 
  
//   ws.on("close", (code, reason) => {
  
//     console.log(`\n🔌 WS CLIENT DISCONNECTED`);
//     console.log(`   ID: ${clientId}`);
//     console.log(`   IP: ${clientIp}`);
//    console.log(`   port: ${clientIport}`);
//    console.log(`   family: ${clientIFamily}`);

//     console.log(`   Code: ${code}`);
//     console.log(`   Reason: ${reason || "none"}`);
   
//     liveClients.delete(ws);
//    console.log("wss CLOSE REQ  LIVE CLIENT COUNT:", liveClients.size, RECORDING_STATE.active);
   

//      if (liveClients.size === 0) {
//          ALLOWED_LIVE_FLAG = true;
//       if (RECORDING_STATE.active){
//         console.log("📹 Recording active - keeping FFmpeg running");
//         WESOCKET_CONNECTED_FLAG = false;
//         mp4Header = null; // Clear header for next connection
//       } else if (ffmpegProcess){
//         WESOCKET_CONNECTED_FLAG = false;
//       //  killFFmpeg("🛑 NO LIVE CLIENTS → STOPPING LIVE FFMPEG");
//       }
//     }
//   });

//  ws.on("error", err => {
//     console.error("WebSocket error:", err);
//     liveClients.delete(ws);
//     ws.terminate();
//   });

// });






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
        return res.status(400).json({ error: "INVALID_VIDEO_FOLDER_NAME" });
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
          //  totalSizeBytes, // raw value
            totalSize: (totalSizeBytes / (1024 * 1024)).toFixed(2),
            //modifiedMs: lastModifiedMs,
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
    if (!isSafeName(folder) || !isSafeName(filename)){
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



function gracefulShutdown(signal){

  console.log(`\n🛑 SERVER SHUTDOWN (SIGINT) received: ${signal}`);
  if (ffmpegProcess) {
   console.log("🧹 Stopping ffmpeg process...");
    ffmpegProcess.kill("SIGINT");
    ffmpegProcess = null;
  }

  stopMediaMtx();
  stopMDNS();

    server.close(() => { console.log("🚪 HTTP server closed"); });

   // releaseLock();
    process.exit(0);


}

function cleanupPort(port) {  //fuser finds which process is using a port and can kill it.
 
  try{
    execSync(`sudo fuser -k ${port}/tcp`);
    console.log(`🧹 Cleared port ${port}`);
  } catch (err) {
    console.log(`ℹ️ Port ${port} already free`,err);
  }
}

process.on("SIGINT", gracefulShutdown); //Terminal / Ctrl+C
process.on("SIGTERM", gracefulShutdown); // systemd / OS systemctl stop, reboot

process.on("uncaughtException", err => {
  console.error("💥 UNCAUGHT EXCEPTION:", err);
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






server.listen(PORT, async() => {
 console.log(`Camera server running on http://0.0.0.0:${PORT}`);
 loadCameraConfig();
 detectSdCardAsync();  
 await SYSTEM_NETWORK_SETTING();

 startMDNS();
 monitorMDNS();
 CHECK_CAMERA_ONLINE();

  setInterval(() =>{

    if(!RECORDING_STATE.active && ffmpegStopping == false && STOPING_RUNNING_FLAG == false  && CAMERA_CONFIGURATION.PTZ_STATE.moving  == false ){
        CHECK_CAMERA_ONLINE();
    }
    
  }, 5000);
  
});

