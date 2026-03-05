// class ConfigController {
  
//   constructor() {
//     this.config = null;
//     this.capabilities = null;
//     this.previewWS = null;
//     this.previewMS = null;
//     this.previewSB = null;
//     this.previewVisible = true;
    
//     this.init();
//   }

//   init() {
//     this.loadConfiguration();
//     this.setupEventListeners();
//     this.setupLivePreview();
//   }

//   // Load Current Configuration
//   async loadConfiguration() {
//     try {
//       const response = await fetch('/api/camera/config');
//       const data = await response.json();
      
//       this.config = data.current;
//       this.capabilities = data.capabilities;
      
//       this.populateDropdowns();
//       this.populateFormFields();
//       this.updateCurrentDisplay();
//       this.checkCameraStatus();
      
//       console.log('Configuration loaded:', this.config);
//     } catch (error) {
//       console.error('Failed to load configuration:', error);
//       this.showStatus('Failed to load configuration', 'error');
//     }
//   }

//   // Populate Dropdowns from Capabilities
//   populateDropdowns() {
//     if (!this.capabilities) return;

//     // Video Format
//     const formatSelect = document.getElementById('format');
//     formatSelect.innerHTML = '';
//     if (this.capabilities.REC_FORMATS) {
//       this.capabilities.REC_FORMATS.forEach(format => {
//         const option = new Option(format, format);
//         if (this.config && format.toLowerCase() === this.config.format) {
//           option.selected = true;
//         }
//         formatSelect.add(option);
//       });
//     }

//     // Resolution
//     const resolutionSelect = document.getElementById('resolution');
//     resolutionSelect.innerHTML = '';
//     if (this.capabilities.REC_RESOLUTIONS) {
//       this.capabilities.REC_RESOLUTIONS.forEach(res => {
//         const option = new Option(res, res);
//         if (this.config && res === this.config.resolution) {
//           option.selected = true;
//         }
//         resolutionSelect.add(option);
//       });
//     }

//     // FPS
//     const fpsSelect = document.getElementById('fps');
//     fpsSelect.innerHTML = '';
//     if (this.capabilities.REC_FPS) {
//       this.capabilities.REC_FPS.forEach(fps => {
//         const option = new Option(`${fps} FPS`, fps);
//         if (this.config && fps === this.config.fps) {
//           option.selected = true;
//         }
//         fpsSelect.add(option);
//       });
//     }

//     // Bitrate
//     const bitrateSelect = document.getElementById('bitrate');
//     bitrateSelect.innerHTML = '';
//     if (this.capabilities.REC_BITERATE) {
//       this.capabilities.REC_BITERATE.forEach(bitrate => {
//         const option = new Option(bitrate, bitrate);
//         if (this.config && bitrate === this.config.bitrate) {
//           option.selected = true;
//         }
//         bitrateSelect.add(option);
//       });
//     }

//     // Extension
//     const extensionSelect = document.getElementById('extension');
//     extensionSelect.innerHTML = '';
//     if (this.capabilities.EXTENSION) {
//       this.capabilities.EXTENSION.forEach(ext => {
//         const option = new Option(ext.toUpperCase(), ext);
//         if (this.config && ext === this.config.EXTENSION) {
//           option.selected = true;
//         }
//         extensionSelect.add(option);
//       });
//     }
//   }

//   // Populate Form Fields with Current Config
//   populateFormFields() {
//     if (!this.config) return;

//     // Camera Mode
//     const modeRadios = document.querySelectorAll('input[name="cameraMode"]');
//     modeRadios.forEach(radio => {
//       if (radio.value === this.config.CAMERA_MODE) {
//         radio.checked = true;
//       }
//     });
//     this.toggleModeSettings(this.config.CAMERA_MODE);

//     // USB Settings
//     if (this.config.DEVICE_NODE) {
//       document.getElementById('deviceNode').value = this.config.DEVICE_NODE;
//     }

//     // RTSP Settings
//     if (this.config.camera_network) {
//       const net = this.config.camera_network;
//       document.getElementById('cameraIP').value = net.ip || '';
//       document.getElementById('rtspPort').value = net.rtspPort || 554;
//       document.getElementById('httpPort').value = net.http_port || 80;
//       document.getElementById('rtspPath').value = net.rtspPath || '/stream1';
//       document.getElementById('httpUser').value = net.httpUser || '';
//       document.getElementById('httpPass').value = net.httpPass || '';
      
//       // Network settings
//       document.getElementById('subnetMask').value = net.subnet_mask || '';
//       document.getElementById('gateway').value = net.gate_way || '';
//       document.getElementById('dns').value = net.DNS_Address || '';
//       document.getElementById('macAddress').value = net.MAC_Address || '';
//       document.getElementById('tcpPort').value = net.tcp_port || 5678;
//       document.getElementById('udpPort').value = net.udp_port || 1259;
//     }

//     // Video Settings - ensure values match exactly
//     if (this.config.format) {
//       const formatVal = this.config.format.toUpperCase();
//       document.getElementById('format').value = formatVal;
//     }
//     if (this.config.resolution) {
//       document.getElementById('resolution').value = this.config.resolution;
//     }
//     if (this.config.fps) {
//       document.getElementById('fps').value = this.config.fps;
//     }
//     if (this.config.bitrate) {
//       document.getElementById('bitrate').value = this.config.bitrate;
//     }
//     if (this.config.EXTENSION) {
//       document.getElementById('extension').value = this.config.EXTENSION;
//     }

//     // PTZ Settings
//     if (this.config.PTZ_STATE) {
//       const ptz = this.config.PTZ_STATE;
//       document.getElementById('panSpeed').value = ptz.defaultPanSpeed || 12;
//       document.getElementById('tiltSpeed').value = ptz.defaultTiltSpeed || 10;
//       document.getElementById('zoomSpeed').value = ptz.defaultZoomSpeed || 4;
//       document.getElementById('focusSpeed').value = ptz.defaultFocusSpeed || 4;
//     }
//   }

//   // Update Current Configuration Display
//   updateCurrentDisplay() {
//     if (!this.config) return;

//     document.getElementById('currentMode').textContent = this.config.CAMERA_MODE || '--';
//     document.getElementById('currentResolution').textContent = this.config.resolution || '--';
//     document.getElementById('currentFPS').textContent = this.config.fps ? `${this.config.fps} FPS` : '--';
//     document.getElementById('currentBitrate').textContent = this.config.bitrate || '--';
//     document.getElementById('currentFormat').textContent = this.config.format || '--';

//     // Build RTSP URL
//     if (this.config.camera_network) {
//       const net = this.config.camera_network;
//       const rtspUrl = `rtsp://${net.httpUser}:***@${net.ip}:${net.rtspPort}${net.rtspPath}`;
//       document.getElementById('currentRTSP').textContent = rtspUrl;
//     }
//   }

//   // Setup Event Listeners
//   setupEventListeners() {
//     // Camera Mode Switch
//     document.querySelectorAll('input[name="cameraMode"]').forEach(radio => {
//       radio.addEventListener('change', (e) => {
//         this.toggleModeSettings(e.target.value);
//       });
//     });

//     // Test Connection Button
//     document.getElementById('testConnectionBtn').addEventListener('click', () => {
//       this.testConnection();
//     });

//     // Preview Button
//     document.getElementById('previewBtn').addEventListener('click', () => {
//       this.testStreamQuality();
//     });

//     // Save Configuration Button
//     document.getElementById('saveConfigBtn').addEventListener('click', () => {
//       this.saveConfiguration();
//     });

//     // Reset Button
//     document.getElementById('resetBtn').addEventListener('click', () => {
//       this.resetConfiguration();
//     });

//     // Preview Toggle
//     document.getElementById('togglePreview').addEventListener('click', () => {
//       this.togglePreview();
//     });

//     // Real-time validation
//     document.getElementById('cameraIP').addEventListener('blur', (e) => {
//       this.validateIP(e.target);
//     });
//   }

//   // Toggle USB/RTSP Settings
//   toggleModeSettings(mode) {
//     const usbSettings = document.getElementById('usbSettings');
//     const rtspSettings = document.getElementById('rtspSettings');

//     if (mode === 'USB') {
//       usbSettings.style.display = 'block';
//       rtspSettings.style.display = 'none';
//     } else {
//       usbSettings.style.display = 'none';
//       rtspSettings.style.display = 'block';
//     }
//   }

//   // Test Connection
//   async testConnection() {
//     const btn = document.getElementById('testConnectionBtn');
//     btn.disabled = true;
//     btn.textContent = '🔍 Testing...';

//     // const mode = document.querySelector('input[name="cameraMode"]:checked').value;

//     // try {
//     //   if (mode === 'RTSP') {
//     //     const ip = document.getElementById('cameraIP').value;
//     //     const user = document.getElementById('httpUser').value;
//     //     const pass = document.getElementById('httpPass').value;

//     //     // Test HTTP-CGI
//     //     const response = await fetch(`http://${ip}/cgi-bin/param.cgi?get_device_conf`, {
//     //       method: 'GET',
//     //       headers: {
//     //         'Authorization': 'Basic ' + btoa(`${user}:${pass}`)
//     //       }
//     //     });

//     //     if (response.ok) {
//     //       this.showStatus('✅ Connection successful! Camera is online.', 'success');
//     //       this.updateCameraStatus('online');
//     //     } else {
//     //       this.showStatus('⚠️ Connection failed. Check credentials.', 'error');
//     //       this.updateCameraStatus('offline');
//     //     }
//     //   } else {
//     //     // Test USB device
//     //     const response = await fetch('/api/camera/config');
//     //     const data = await response.json();
        
//     //     if (data.success) {
//     //       this.showStatus('✅ USB device detected!', 'success');
//     //       this.updateCameraStatus('online');
//     //     } else {
//     //       this.showStatus('⚠️ USB device not found.', 'error');
//     //       this.updateCameraStatus('offline');
//     //     }
//     //   }
//     // } catch (error) {
//     //   console.error('Connection test error:', error);
//     //   this.showStatus('❌ Connection test failed: ' + error.message, 'error');
//     //   this.updateCameraStatus('offline');
//     // } finally {
//     //   btn.disabled = false;
//     //   btn.textContent = '🔍 Test Connection';
//     // }

//   }

//   // Test Stream Quality
//   async testStreamQuality() {
    
//     const btn = document.getElementById('previewBtn');
//     btn.disabled = true;
//     btn.textContent = '👁️ Starting Preview...';

//     try {
//       // Show preview window
//       document.getElementById('livePreview').style.display = 'block';
//       this.previewVisible = true;
      
//       // Start stream
//       await this.startPreviewStream();
      
//       this.showStatus('✅ Preview started. Check bottom-right corner.', 'success');
//     } catch (error) {
//       console.error('Preview error:', error);
//       this.showStatus('❌ Preview failed: ' + error.message, 'error');
//     } finally {
//       btn.disabled = false;
//       btn.textContent = '👁️ Test Stream Quality';
//     }
//   }

//   // Save Configuration
//   async saveConfiguration() {

//     const btn = document.getElementById('saveConfigBtn');
//     btn.disabled = true;
//     btn.textContent = '💾 Saving...';

//     try {
//       const mode = document.querySelector('input[name="cameraMode"]:checked').value;
      
//       // Build configuration object matching backend structure
//       const newConfig = {
//         CAMERA_MODE: mode,
//         format: document.getElementById('format').value.toLowerCase(),
//         resolution: document.getElementById('resolution').value,
//         fps: parseInt(document.getElementById('fps').value),
//         bitrate: document.getElementById('bitrate').value,
//         EXTENSION: document.getElementById('extension').value
//       };

//       // Add mode-specific settings
//       if (mode === 'USB') {
//         newConfig.DEVICE_NODE = document.getElementById('deviceNode').value;
//       }

//       // Always include camera_network (even for USB mode)
//       newConfig.camera_network = {
//         ip: document.getElementById('cameraIP').value,
//         rtspPort: parseInt(document.getElementById('rtspPort').value) || 554,
//         http_port: parseInt(document.getElementById('httpPort').value) || 80,
//         rtspPath: document.getElementById('rtspPath').value,
//         httpUser: document.getElementById('httpUser').value,
//         httpPass: document.getElementById('httpPass').value,
//         subnet_mask: document.getElementById('subnetMask').value,
//         gate_way: document.getElementById('gateway').value,
//         DNS_Address: document.getElementById('dns').value,
//         tcp_port: parseInt(document.getElementById('tcpPort').value) || 5678,
//         udp_port: parseInt(document.getElementById('udpPort').value) || 1259
//       };

//       // Include PTZ settings
//       newConfig.PTZ_STATE = {
//         defaultPanSpeed: parseInt(document.getElementById('panSpeed').value),
//         defaultTiltSpeed: parseInt(document.getElementById('tiltSpeed').value),
//         defaultZoomSpeed: parseInt(document.getElementById('zoomSpeed').value),
//         defaultFocusSpeed: parseInt(document.getElementById('focusSpeed').value)
//       };

//       console.log('Saving configuration:', newConfig);

//       const response = await fetch('/api/camera/config', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(newConfig)
//       });

//       const result = await response.json();

//       if (response.ok) {
//         this.showStatus('✅ Configuration saved successfully! Changes will take effect on next recording.', 'success');
//         // Reload configuration to show updated values
//         setTimeout(() => this.loadConfiguration(), 1000);
//       } else {
//         this.showStatus('❌ Failed to save: ' + (result.error || 'Unknown error'), 'error');
//       }
//     } catch (error) {
//       console.error('Save error:', error);
//       this.showStatus('❌ Save failed: ' + error.message, 'error');
//     } finally {
//       btn.disabled = false;
//       btn.textContent = '💾 Save Configuration';
//     }
//   }

//   // Reset Configuration
//   async resetConfiguration() {
//     if (!confirm('Reset all settings to defaults? This cannot be undone.')) {
//       return;
//     }

//     const btn = document.getElementById('resetBtn');
//     btn.disabled = true;
//     btn.textContent = '↺ Resetting...';

//     try {
//       // Implement reset logic
//       await this.loadConfiguration();
//       this.showStatus('✅ Configuration reset to defaults.', 'success');
//     } catch (error) {
//       console.error('Reset error:', error);
//       this.showStatus('❌ Reset failed: ' + error.message, 'error');
//     } finally {
//       btn.disabled = false;
//       btn.textContent = '↺ Reset to Defaults';
//     }
//   }

//   // Setup Live Preview
//   setupLivePreview() {
//     // Will be started when user clicks preview button
//   }



//   // Start Preview Stream
//   async startPreviewStream() {
//     const video = document.getElementById('previewVideo');
//     const statusEl = document.getElementById('previewStatus');
//     const qualityEl = document.getElementById('previewQuality');
//     const STREAM_URL = `http://${location.hostname}:8889/live_camera/whep`;
//     let pc = null;

//   if (pc) {
//     pc.ontrack = null;
//     pc.onconnectionstatechange = null;
//     pc.close();
//     pc = null;
//   }

//   video.srcObject = null;

//   pc = new RTCPeerConnection({
//      bundlePolicy: "max-bundle",
//      rtcpMuxPolicy: "require",
//      encodedInsertableStreams: false,
//     iceServers: []
//   });

//   pc.ontrack = (ev) => {
//     video.srcObject = ev.streams[0];
//   };

// video.autoplay = true;
// video.muted = true;    // required by Chrome 
// video.playsInline = true; //Disable fullscreen hijack  
// video.disablePictureInPicture = true;

// try {

//   pc.onconnectionstatechange = () => {
//      console.log("WETRC_STATE:", pc.connectionState);
//      if(pc.connectionState === "failed" ||pc.connectionState === "disconnected" || pc.connectionState === "closed") {
//       scheduleReconnect();
//     }
//   };

//     const offer = await pc.createOffer({
//       offerToReceiveVideo: true
//     });

//     await pc.setLocalDescription(offer);

//     const res = await fetch(STREAM_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/sdp" },
//       body: offer.sdp
//     });

//     if (!res.ok)
//       throw new Error("MediaMTX rejected connection");

//     const answer = await res.text();
//     await pc.setRemoteDescription({
//       type: "answer",
//       sdp: answer
//     });

//     console.log("✅ WebRTC Connected");
//     statusEl.textContent = 'Streaming';
//   } catch (err) {
//     console.error("WebRTC start failed:", err);
//     statusEl.textContent = 'Preview failed: ' + err.message;
//   }
//             // Update quality info
//     const quality = `${this.config.resolution} @ ${this.config.fps}fps`;
//      qualityEl.textContent = quality;
        
          
//   }

//   // Toggle Preview Visibility
//   togglePreview() {
//     const preview = document.getElementById('livePreview');
//     const btn =     document.getElementById('togglePreview');
    
//     if (this.previewVisible) {
//       preview.style.display = 'none';
//       btn.textContent = 'Show';
//       this.previewVisible = false;
      
//       // Stop stream
//       if (this.previewWS) {
//         this.previewWS.close();
//       }
//     } else {
//       preview.style.display = 'block';
//       btn.textContent = 'Hide';
//       this.previewVisible = true;
//     }
//   }

//   // Check Camera Status
//   async checkCameraStatus() {
//     try {
//       const response = await fetch('/api/camera/config');
//       const data = await response.json();
      
//       if (data.current && data.current.camera_network) {
//         const online = data.current.camera_network.CAMERA_ONLINE;
//         this.updateCameraStatus(online ? 'online' : 'offline');
//       }
//     } catch (error) {
//       this.updateCameraStatus('offline');
//     }
//   }

//   // Update Camera Status Badge
//   updateCameraStatus(status) {
//     const badge = document.getElementById('cameraStatus');
    
//     if (status === 'online') {
//       badge.className = 'connection-badge online';
//       badge.innerHTML = '<span class="status-dot"></span><span>Camera Online</span>';
//     } else {
//       badge.className = 'connection-badge offline';
//       badge.innerHTML = '<span class="status-dot"></span><span>Camera Offline</span>';
//     }
//   }

//   // Validate IP Address
//   validateIP(input) {
//     const value = input.value;
//     const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
//     if (value && !ipPattern.test(value)) {
//       input.style.borderColor = 'var(--danger)';
//       this.showStatus('⚠️ Invalid IP address format', 'error');
//     } else {
//       input.style.borderColor = 'var(--border)';
//     }
//   }

//   // Show Status Message
//   showStatus(message, type = 'info') {
//     const statusEl = document.getElementById('statusMessage');
//     statusEl.textContent = message;
//     statusEl.className = `status-message ${type}`;
//     statusEl.style.display = 'block';

//     setTimeout(() => {statusEl.style.display = 'none';}, 5000);
//   }
// }

// // Initialize on page load
// let configController;
// document.addEventListener('DOMContentLoaded', () => {
//   console.log('🚀 Initializing Configuration Controller');
//   configController = new ConfigController();
// });






































// class ConfigController {
  
//   constructor() {
//     this.config = null;
//     this.capabilities = null;
//     this.currentTab = 'general';
    
//     this.init();
//   }

//   init() {
//     this.loadConfiguration();
//     this.setupEventListeners();
//     this.setupTabSwitching();
//   }

//   // Tab Switching
//   setupTabSwitching() {
//     window.switchTab = (tabName) => {
//       // Hide all tabs
//       document.querySelectorAll('.tab-content').forEach(tab => {
//         tab.classList.remove('active');
//       });
      
//       // Remove active class from all tab buttons
//       document.querySelectorAll('.tab').forEach(btn => {
//         btn.classList.remove('active');
//       });
      
//       // Show selected tab
//       const selectedTab = document.getElementById(`tab-${tabName}`);
//       if (selectedTab) {
//         selectedTab.classList.add('active');
//       }
      
//       // Activate button
//       event.target.classList.add('active');
//       this.currentTab = tabName;
//     };
//   }

//   // Load Current Configuration
//   async loadConfiguration() {
//     try {
//       const response = await fetch('/api/camera/config');
//       const data = await response.json();
      
//       this.config = data.current;
//       this.capabilities = data.capabilities;
      
//       this.populateDropdowns();
//       this.populateFormFields();
//       this.updateCurrentDisplay();
//       this.checkCameraStatus();
      
//       console.log('Configuration loaded:', this.config);
//     } catch (error) {
//       console.error('Failed to load configuration:', error);
//       this.showStatus('Failed to load configuration', 'error');
//     }
//   }

//   // Populate Dropdowns from Capabilities
//   populateDropdowns() {
//     if (!this.capabilities) return;

//     // Video Format
//     const formatSelect = document.getElementById('format');
//     if (formatSelect) {
//       formatSelect.innerHTML = '';
//       if (this.capabilities.REC_FORMATS) {
//         this.capabilities.REC_FORMATS.forEach(format => {
//           const option = new Option(format, format);
//           if (this.config && format.toLowerCase() === this.config.format) {
//             option.selected = true;
//           }
//           formatSelect.add(option);
//         });
//       }
//     }

//     // Resolution
//     const resolutionSelect = document.getElementById('resolution');
//     if (resolutionSelect) {
//       resolutionSelect.innerHTML = '';
//       if (this.capabilities.REC_RESOLUTIONS) {
//         this.capabilities.REC_RESOLUTIONS.forEach(res => {
//           const option = new Option(res, res);
//           if (this.config && res === this.config.resolution) {
//             option.selected = true;
//           }
//           resolutionSelect.add(option);
//         });
//       }
//     }

//     // FPS
//     const fpsSelect = document.getElementById('fps');
//     if (fpsSelect) {
//       fpsSelect.innerHTML = '';
//       if (this.capabilities.REC_FPS) {
//         this.capabilities.REC_FPS.forEach(fps => {
//           const option = new Option(`${fps} FPS`, fps);
//           if (this.config && fps === this.config.fps) {
//             option.selected = true;
//           }
//           fpsSelect.add(option);
//         });
//       }
//     }

//     // Bitrate
//     const bitrateSelect = document.getElementById('bitrate');
//     if (bitrateSelect) {
//       bitrateSelect.innerHTML = '';
//       if (this.capabilities.REC_BITERATE) {
//         this.capabilities.REC_BITERATE.forEach(bitrate => {
//           const option = new Option(bitrate, bitrate);
//           if (this.config && bitrate === this.config.bitrate) {
//             option.selected = true;
//           }
//           bitrateSelect.add(option);
//         });
//       }
//     }

//     // Extension
//     const extensionSelect = document.getElementById('extension');
//     if (extensionSelect) {
//       extensionSelect.innerHTML = '';
//       if (this.capabilities.EXTENSION) {
//         this.capabilities.EXTENSION.forEach(ext => {
//           const option = new Option(ext.toUpperCase(), ext);
//           if (this.config && ext === this.config.EXTENSION) {
//             option.selected = true;
//           }
//           extensionSelect.add(option);
//         });
//       }
//     }
//   }

//   // Populate Form Fields with Current Config
//   populateFormFields() {
//     if (!this.config) return;

//     // Camera Mode
//     const modeRadios = document.querySelectorAll('input[name="cameraMode"]');
//     modeRadios.forEach(radio => {
//       if (radio.value === this.config.CAMERA_MODE) {
//         radio.checked = true;
//       }
//     });
//     this.toggleModeSettings(this.config.CAMERA_MODE);

//     // USB Settings
//     if (this.config.DEVICE_NODE) {
//       const deviceNode = document.getElementById('deviceNode');
//       if (deviceNode) deviceNode.value = this.config.DEVICE_NODE;
//     }

//     // RTSP Settings
//     if (this.config.camera_network) {
//       const net = this.config.camera_network;
      
//       const fields = {
//         cameraIP: net.ip,
//         rtspPort: net.rtspPort,
//         httpPort: net.http_port,
//         rtspPath: net.rtspPath,
//         httpUser: net.httpUser,
//         httpPass: net.httpPass,
//         subnetMask: net.subnet_mask,
//         gateway: net.gate_way,
//         dns: net.DNS_Address,
//         macAddress: net.MAC_Address,
//         tcpPort: net.tcp_port,
//         udpPort: net.udp_port
//       };

//       Object.entries(fields).forEach(([id, value]) => {
//         const el = document.getElementById(id);
//         if (el && value) el.value = value;
//       });
//     }

//     // Video Settings
//     if (this.config.format) {
//       const format = document.getElementById('format');
//       if (format) format.value = this.config.format.toUpperCase();
//     }

//     // PTZ Settings
//     if (this.config.PTZ_STATE) {
//       const ptz = this.config.PTZ_STATE;
      
//       const ptzFields = {
//         panSpeed: ptz.defaultPanSpeed,
//         tiltSpeed: ptz.defaultTiltSpeed,
//         zoomSpeed: ptz.defaultZoomSpeed,
//         focusSpeed: ptz.defaultFocusSpeed
//       };

//       Object.entries(ptzFields).forEach(([id, value]) => {
//         const el = document.getElementById(id);
//         if (el && value) el.value = value;
//       });
//     }

//     // Image Settings
//     if (this.config.IMAGE_SETTINGS) {
//       const img = this.config.IMAGE_SETTINGS;
      
//       const imageFields = {
//         brightness: img.brightness_CURRENT || img.brightness_DEFAULT || 7,
//         contrast: img.contrast_CURRENT || img.contrast_DEFAULT || 7,
//         saturation: img.saturation_CURRENT || img.saturation_DEFAULT || 6,
//         sharpness: img.sharpness_CURRENT || img.sharpness_DEFAULT || 7,
//         hue: img.hue || 7
//       };

//       Object.entries(imageFields).forEach(([id, value]) => {
//         const slider = document.getElementById(id);
//         const display = document.getElementById(`${id}Val`);
//         if (slider) {
//           slider.value = value;
//           if (display) display.textContent = value;
//         }
//       });
//     }

//     // Zoom Configuration
//     if (this.config.ZOOM_IN_FIXED) {
//       const zoomIn = document.getElementById('zoomInFixed');
//       if (zoomIn) zoomIn.value = this.config.ZOOM_IN_FIXED;
//     }
//     if (this.config.ZOOM_OUT_FIXED) {
//       const zoomOut = document.getElementById('zoomOutFixed');
//       if (zoomOut) zoomOut.value = this.config.ZOOM_OUT_FIXED;
//     }
//     if (this.config.PTZ_POSITION_STEP) {
//       const posStep = document.getElementById('ptzPositionStep');
//       if (posStep) posStep.value = this.config.PTZ_POSITION_STEP;
//     }
//   }

//   // Update Current Configuration Display
//   updateCurrentDisplay() {
//     if (!this.config) return;

//     const displays = {
//       currentMode: this.config.CAMERA_MODE || '--',
//       currentResolution: this.config.resolution || '--',
//       currentFPS: this.config.fps ? `${this.config.fps} FPS` : '--',
//       currentBitrate: this.config.bitrate || '--',
//       currentFormat: this.config.format || '--'
//     };

//     Object.entries(displays).forEach(([id, value]) => {
//       const el = document.getElementById(id);
//       if (el) el.textContent = value;
//     });

//     // Build RTSP URL
//     if (this.config.camera_network) {
//       const net = this.config.camera_network;
//       const rtspUrl = `rtsp://${net.httpUser}:***@${net.ip}:${net.rtspPort}${net.rtspPath}`;
//       const el = document.getElementById('currentRTSP');
//       if (el) el.textContent = rtspUrl;
//     }
//   }

//   // Setup Event Listeners
//   setupEventListeners() {
//     // Camera Mode Switch
//     document.querySelectorAll('input[name="cameraMode"]').forEach(radio => {
//       radio.addEventListener('change', (e) => {
//         this.toggleModeSettings(e.target.value);
//       });
//     });

//     // Save Configuration Button
//     const saveBtn = document.getElementById('saveConfigBtn');
//     if (saveBtn) {
//       saveBtn.addEventListener('click', () => this.saveConfiguration());
//     }

//     // Reset Button
//     const resetBtn = document.getElementById('resetBtn');
//     if (resetBtn) {
//       resetBtn.addEventListener('click', () => this.resetConfiguration());
//     }

//     // Reset Image Button
//     const resetImageBtn = document.getElementById('resetImageBtn');
//     if (resetImageBtn) {
//       resetImageBtn.addEventListener('click', () => this.resetImageSettings());
//     }

//     // Image Sliders
//     ['brightness', 'contrast', 'saturation', 'sharpness', 'hue'].forEach(control => {
//       const slider = document.getElementById(control);
//       const display = document.getElementById(`${control}Val`);
//       if (slider && display) {
//         slider.addEventListener('input', () => {
//           display.textContent = slider.value;
//         });
//       }
//     });
//   }

//   // Toggle USB/RTSP Settings
//   toggleModeSettings(mode) {
//     const usbSettings = document.getElementById('usbSettings');
//     const rtspSettings = document.getElementById('rtspSettings');

//     if (mode === 'USB') {
//       if (usbSettings) usbSettings.style.display = 'block';
//       if (rtspSettings) rtspSettings.style.display = 'none';
//     } else {
//       if (usbSettings) usbSettings.style.display = 'none';
//       if (rtspSettings) rtspSettings.style.display = 'block';
//     }
//   }

//   // Save Configuration
//   async saveConfiguration() {
//     const btn = document.getElementById('saveConfigBtn');
//     if (btn) {
//       btn.disabled = true;
//       btn.textContent = '💾 Saving...';
//     }

//     try {
//       const mode = document.querySelector('input[name="cameraMode"]:checked').value;
      
//       // Build configuration object
//       const newConfig = {
//         CAMERA_MODE: mode,
//         format: document.getElementById('format')?.value.toLowerCase() || 'h264',
//         resolution: document.getElementById('resolution')?.value || '1920x1080',
//         fps: parseInt(document.getElementById('fps')?.value || '30'),
//         bitrate: document.getElementById('bitrate')?.value || '4M',
//         EXTENSION: document.getElementById('extension')?.value || '.mp4'
//       };

//       // USB Settings
//       if (mode === 'USB') {
//         newConfig.DEVICE_NODE = document.getElementById('deviceNode')?.value || '/dev/video0';
//       }

//       // Network Settings
//       newConfig.camera_network = {
//         ip: document.getElementById('cameraIP')?.value || '',
//         rtspPort: parseInt(document.getElementById('rtspPort')?.value) || 554,
//         http_port: parseInt(document.getElementById('httpPort')?.value) || 80,
//         rtspPath: document.getElementById('rtspPath')?.value || '/stream1',
//         httpUser: document.getElementById('httpUser')?.value || 'admin',
//         httpPass: document.getElementById('httpPass')?.value || 'admin',
//         subnet_mask: document.getElementById('subnetMask')?.value || '255.255.255.0',
//         gate_way: document.getElementById('gateway')?.value || '192.168.100.1',
//         DNS_Address: document.getElementById('dns')?.value || '8.8.8.8',
//         tcp_port: parseInt(document.getElementById('tcpPort')?.value) || 5678,
//         udp_port: parseInt(document.getElementById('udpPort')?.value) || 1259
//       };

//       // PTZ Settings
//       newConfig.PTZ_STATE = {
//         defaultPanSpeed: parseInt(document.getElementById('panSpeed')?.value) || 12,
//         defaultTiltSpeed: parseInt(document.getElementById('tiltSpeed')?.value) || 10,
//         defaultZoomSpeed: parseInt(document.getElementById('zoomSpeed')?.value) || 4,
//         defaultFocusSpeed: parseInt(document.getElementById('focusSpeed')?.value) || 4
//       };

//       // Image Settings
//       newConfig.IMAGE_SETTINGS = {
//         brightness_CURRENT: parseInt(document.getElementById('brightness')?.value) || 7,
//         contrast_CURRENT: parseInt(document.getElementById('contrast')?.value) || 7,
//         saturation_CURRENT: parseInt(document.getElementById('saturation')?.value) || 6,
//         sharpness_CURRENT: parseInt(document.getElementById('sharpness')?.value) || 7,
//         hue: parseInt(document.getElementById('hue')?.value) || 7
//       };

//       // Zoom Configuration
//       newConfig.ZOOM_IN_FIXED = parseInt(document.getElementById('zoomInFixed')?.value) || 5;
//       newConfig.ZOOM_OUT_FIXED = parseInt(document.getElementById('zoomOutFixed')?.value) || 5;
//       newConfig.PTZ_POSITION_STEP = document.getElementById('ptzPositionStep')?.value || '0005';

//       console.log('Saving configuration:', newConfig);

//       const response = await fetch('/api/camera/config', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(newConfig)
//       });

//       const result = await response.json();

//       if (response.ok) {
//         this.showStatus('✅ Configuration saved successfully!', 'success');
//         setTimeout(() => this.loadConfiguration(), 1000);
//       } else {
//         this.showStatus('❌ Failed to save: ' + (result.error || 'Unknown error'), 'error');
//       }
//     } catch (error) {
//       console.error('Save error:', error);
//       this.showStatus('❌ Save failed: ' + error.message, 'error');
//     } finally {
//       if (btn) {
//         btn.disabled = false;
//         btn.textContent = '💾 Save Configuration';
//       }
//     }
//   }

//   // Reset Image Settings
//   async resetImageSettings() {
//     if (!confirm('Reset image settings to defaults?')) return;

//     try {
//       // Call backend to reset image settings
//       const response = await fetch('/api/ptz/image_setting?mode=DEFAULT&level=1');
//       const result = await response.json();

//       if (result.success) {
//         // Reset sliders to default values
//         const defaults = {
//           brightness: 7,
//           contrast: 7,
//           saturation: 6,
//           sharpness: 7,
//           hue: 7
//         };

//         Object.entries(defaults).forEach(([id, value]) => {
//           const slider = document.getElementById(id);
//           const display = document.getElementById(`${id}Val`);
//           if (slider) slider.value = value;
//           if (display) display.textContent = value;
//         });

//         this.showStatus('✅ Image settings reset to defaults', 'success');
//       } else {
//         this.showStatus('❌ Failed to reset image settings', 'error');
//       }
//     } catch (error) {
//       console.error('Reset image error:', error);
//       this.showStatus('❌ Reset failed: ' + error.message, 'error');
//     }
//   }

//   // Reset Configuration
//   async resetConfiguration() {
//     if (!confirm('Reset all settings to defaults? This cannot be undone.')) {
//       return;
//     }

//     const btn = document.getElementById('resetBtn');
//     if (btn) {
//       btn.disabled = true;
//       btn.textContent = '↺ Resetting...';
//     }

//     try {
//       await this.loadConfiguration();
//       this.showStatus('✅ Configuration reset to defaults.', 'success');
//     } catch (error) {
//       console.error('Reset error:', error);
//       this.showStatus('❌ Reset failed: ' + error.message, 'error');
//     } finally {
//       if (btn) {
//         btn.disabled = false;
//         btn.textContent = '↺ Reset to Defaults';
//       }
//     }
//   }

//   // Check Camera Status
//   async checkCameraStatus() {
//     try {
//       const response = await fetch('/api/camera/config');
//       const data = await response.json();
      
//       if (data.current && data.current.camera_network) {
//         const online = data.current.camera_network.CAMERA_ONLINE;
//         this.updateCameraStatus(online ? 'online' : 'offline');
//       }
//     } catch (error) {
//       this.updateCameraStatus('offline');
//     }
//   }

//   // Update Camera Status Badge
//   updateCameraStatus(status) {
//     const badge = document.getElementById('cameraStatus');
    
//     if (badge) {
//       if (status === 'online') {
//         badge.className = 'connection-badge online';
//         badge.innerHTML = '<span class="status-dot"></span><span>Camera Online</span>';
//       } else {
//         badge.className = 'connection-badge offline';
//         badge.innerHTML = '<span class="status-dot"></span><span>Camera Offline</span>';
//       }
//     }
//   }

//   // Show Status Message
//   showStatus(message, type = 'info') {
//     const statusEl = document.getElementById('statusMessage');
//     if (statusEl) {
//       statusEl.textContent = message;
//       statusEl.className = `status-message ${type}`;
//       statusEl.style.display = 'block';

//       setTimeout(() => {
//         statusEl.style.display = 'none';
//       }, 5000);
//     }
//   }
// }

// // Initialize on page load
// let configController;
// document.addEventListener('DOMContentLoaded', () => {
//   console.log('🚀 Initializing Enhanced Configuration Controller');
//   configController = new ConfigController();
// });


class ConfigController {
  
  constructor() {
    this.config = null;
    this.capabilities = null;
    this.currentTab = 'general';
    this.previewPC = null;
    this.previewVisible = true;
    this.selectedWifi = null;
    
    this.init();
  }

  init() {
    this.loadConfiguration();
    this.setupEventListeners();
    this.setupTabSwitching();
    this.setupLivePreview();
  }

  // Tab Switching
  setupTabSwitching() {
    window.switchTab = (tabName) => {
      document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
      });
      
      document.querySelectorAll('.tab').forEach(btn => {
        btn.classList.remove('active');
      });
      
      const selectedTab = document.getElementById(`tab-${tabName}`);
      if (selectedTab) {
        selectedTab.classList.add('active');
      }
      
      event.target.classList.add('active');
      this.currentTab = tabName;
    };
  }

  // Load Current Configuration
  async loadConfiguration() {
    try {
      const response = await fetch('/api/camera/config');
      const data = await response.json();
      
      this.config = data.current;
      this.capabilities = data.capabilities;
      
      this.populateDropdowns();
      this.populateFormFields();
      this.updateCurrentDisplay();
      this.checkCameraStatus();
      
      console.log('Configuration loaded:', this.config);
    } catch (error) {
      console.error('Failed to load configuration:', error);
      this.showStatus('Failed to load configuration', 'error');
    }
  }

  // Populate Dropdowns
  populateDropdowns() {
    if (!this.capabilities) return;

    // Video Format
    const formatSelect = document.getElementById('format');
    if (formatSelect && this.capabilities.REC_FORMATS) {
      formatSelect.innerHTML = '';
      this.capabilities.REC_FORMATS.forEach(format => {
        const option = new Option(format.toUpperCase(), format.toLowerCase());
        if (this.config && format.toLowerCase() === this.config.format) {
          option.selected = true;
        }
        formatSelect.add(option);
      });
    }

    // Resolution
    const resolutionSelect = document.getElementById('resolution');
    if (resolutionSelect && this.capabilities.REC_RESOLUTIONS) {
      resolutionSelect.innerHTML = '';
      this.capabilities.REC_RESOLUTIONS.forEach(res => {
        const option = new Option(res, res);
        if (this.config && res === this.config.resolution) {
          option.selected = true;
        }
        resolutionSelect.add(option);
      });
    }

    // FPS
    const fpsSelect = document.getElementById('fps');
    if (fpsSelect && this.capabilities.REC_FPS) {
      fpsSelect.innerHTML = '';
      this.capabilities.REC_FPS.forEach(fps => {
        const option = new Option(`${fps} FPS`, fps);
        if (this.config && fps === this.config.fps) {
          option.selected = true;
        }
        fpsSelect.add(option);
      });
    }

    // Bitrate
    const bitrateSelect = document.getElementById('bitrate');
    if (bitrateSelect && this.capabilities.REC_BITERATE) {
      bitrateSelect.innerHTML = '';
      this.capabilities.REC_BITERATE.forEach(bitrate => {
        const option = new Option(bitrate, bitrate);
        if (this.config && bitrate === this.config.bitrate) {
          option.selected = true;
        }
        bitrateSelect.add(option);
      });
    }
  }

  // Populate Form Fields
  populateFormFields() {
    if (!this.config) return;

    // Camera Mode
    const modeRadios = document.querySelectorAll('input[name="cameraMode"]');
    modeRadios.forEach(radio => {
      if (radio.value === this.config.CAMERA_MODE) {
        radio.checked = true;
      }
    });
    this.toggleModeSettings(this.config.CAMERA_MODE);

    // USB Settings
    this.setFieldValue('deviceNode', this.config.DEVICE_NODE);

    // RTSP Settings
    if (this.config.camera_network) {
      const net = this.config.camera_network;
      
      this.setFieldValue('cameraIP', net.ip);
      this.setFieldValue('rtspPort', net.rtspPort);
      this.setFieldValue('httpPort', net.http_port);
      this.setFieldValue('rtspPath', net.rtspPath);
      this.setFieldValue('httpUser', net.httpUser);
      this.setFieldValue('httpPass', net.httpPass);
      this.setFieldValue('cam_subnetMask', net.SUBNET_MASK);
      this.setFieldValue('cam_gateway', net.GATE_WAY);
      this.setFieldValue('cam_dns', net.DNS_Address);
      this.setFieldValue('cam_macAddress', net.MAC_Address);
      this.setFieldValue('cam_tcpPort', net.tcp_port);
      this.setFieldValue('cam_udpPort', net.udp_port);
    }

    // PTZ Settings
    if (this.config.PTZ_STATE) {
      const ptz = this.config.PTZ_STATE;
      
      this.setFieldValue('panSpeed', ptz.defaultPanSpeed);
      this.setFieldValue('tiltSpeed', ptz.defaultTiltSpeed);
      this.setFieldValue('zoomSpeed', ptz.defaultZoomSpeed);
      this.setFieldValue('focusSpeed', ptz.defaultFocusSpeed);
    }

    // Image Settings
    if (this.config.IMAGE_SETTINGS) {
      const img = this.config.IMAGE_SETTINGS;
      
      this.setSlider('brightness', img.brightness_CURRENT || img.brightness_DEFAULT || 7);
      this.setSlider('contrast', img.contrast_CURRENT || img.contrast_DEFAULT || 7);
      this.setSlider('saturation', img.saturation_CURRENT || img.saturation_DEFAULT || 6);
      this.setSlider('sharpness', img.sharpness_CURRENT || img.sharpness_DEFAULT || 7);
      this.setSlider('hue', img.hue || 7);
    }

    // Zoom Configuration with NEW fields
    const zoomFlag = document.getElementById('zoomInFixedFlag');
    if (zoomFlag) {
      zoomFlag.checked = this.config.ZOOM_IN_FIXED_FLAG || false;
    }
    
    this.setFieldValue('zoomInFixed', this.config.ZOOM_IN_FIXED || 100);
    this.setFieldValue('zoomOutFixed', this.config.ZOOM_OUT_FIXED || 5);
    this.setFieldValue('zoomPosFixed', this.config.ZOOM_POS_FIXED || 100);
    this.setFieldValue('ptzPositionStep', this.config.PTZ_POSITION_STEP || '0005');

    // SBC System Network Settings
    if (this.config.SBC_SYSTEM_NETWORK) {
      const sbc = this.config.SBC_SYSTEM_NETWORK;
      
      // Network Type
      const netTypeRadios = document.querySelectorAll('input[name="sbcNetworkType"]');
      netTypeRadios.forEach(radio => {
        if (radio.value === sbc.CONNECT_SYSTEM_NETWORK) {
          radio.checked = true;
        }
      });
      this.toggleWifiSettings(sbc.CONNECT_SYSTEM_NETWORK);

      // Network Mode
      const netModeRadios = document.querySelectorAll('input[name="sbcNetworkMode"]');
      netModeRadios.forEach(radio => {
        if (radio.value === sbc.SYSTEM_NETWORK_MODE) {
          radio.checked = true;
        }
      });
      this.toggleStaticIPSettings(sbc.SYSTEM_NETWORK_MODE);

      // All Network Fields
      this.setFieldValue('sbc_staticIP', sbc.STATIC_IP_ADDRESS);
      this.setFieldValue('sbc_dynamicIP', sbc.DYNAMIC_IP_ADDRESS);
      this.setFieldValue('sbc_subnetMask', sbc.SUBNET_MASK);
      this.setFieldValue('sbc_macAddress', sbc.MAC_Address);
      this.setFieldValue('sbc_gateway', sbc.GATE_WAY);
      this.setFieldValue('sbc_dns', sbc.DNS_Address);
      this.setFieldValue('sbc_wifiSSID', sbc.WIFI_SSID);
      this.setFieldValue('sbc_wifiPassword', sbc.WIFI_PASSWORD);

      // Populate WiFi Available List if exists
      if (sbc.WIFI_AVAILABLE_LIST && sbc.WIFI_AVAILABLE_LIST.length > 0) {
        this.displayWifiList(sbc.WIFI_AVAILABLE_LIST);
      }
    }
  }

  // Helper: Set Field Value
  setFieldValue(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) {
      el.value = value;
    }
  }

  // Helper: Set Slider
  setSlider(id, value) {
    const slider = document.getElementById(id);
    const display = document.getElementById(`${id}Val`);
    if (slider) {
      slider.value = value;
      if (display) display.textContent = value;
    }
  }

  // Update Current Display
  updateCurrentDisplay() {
    if (!this.config) return;

    const displays = {
      currentMode: this.config.CAMERA_MODE || '--',
      currentResolution: this.config.resolution || '--',
      currentFPS: this.config.fps ? `${this.config.fps} FPS` : '--',
      currentFormat: this.config.format || '--'
    };

    Object.entries(displays).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });
  }

  // Setup Event Listeners
  setupEventListeners() {
    // Camera Mode Switch
    document.querySelectorAll('input[name="cameraMode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.toggleModeSettings(e.target.value);
      });
    });

    // SBC Network Type Switch
    document.querySelectorAll('input[name="sbcNetworkType"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.toggleWifiSettings(e.target.value);
      });
    });

    // SBC Network Mode Switch
    document.querySelectorAll('input[name="sbcNetworkMode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.toggleStaticIPSettings(e.target.value);
      });
    });

    // Save Configuration Button
    document.getElementById('saveConfigBtn')?.addEventListener('click', () => this.saveConfiguration());

    // Reset Button
    document.getElementById('resetBtn')?.addEventListener('click', () => this.resetConfiguration());

    // Reset Image Button
    document.getElementById('resetImageBtn')?.addEventListener('click', () => this.resetImageSettings());

    // Toggle Preview Button
    document.getElementById('togglePreviewBtn')?.addEventListener('click', () => this.togglePreview());

    // Preview Controls
    document.getElementById('minimizePreview')?.addEventListener('click', () => this.minimizePreview());
    document.getElementById('closePreview')?.addEventListener('click', () => this.closePreview());

    // WiFi Scan Button
    document.getElementById('scanWifiBtn')?.addEventListener('click', () => this.scanWifiNetworks());

    // Image Sliders
    ['brightness', 'contrast', 'saturation', 'sharpness', 'hue'].forEach(control => {
      const slider = document.getElementById(control);
      const display = document.getElementById(`${control}Val`);
      if (slider && display) {
        slider.addEventListener('input', () => {
          display.textContent = slider.value;
        });
      }
    });
  }

  // Toggle USB/RTSP Settings
  toggleModeSettings(mode) {
    const usbSettings = document.getElementById('usbSettings');
    const rtspSettings = document.getElementById('rtspSettings');

    if (mode === 'USB') {
      if (usbSettings) usbSettings.classList.remove('hidden');
      if (rtspSettings) rtspSettings.classList.add('hidden');
    } else {
      if (usbSettings) usbSettings.classList.add('hidden');
      if (rtspSettings) rtspSettings.classList.remove('hidden');
    }
  }

  // Toggle WiFi Settings
  toggleWifiSettings(type) {
    const wifiSettings = document.getElementById('wifiSettings');
    if (type === 'WIFI' || type === 'ETHERNET & WIFI') {
      if (wifiSettings) wifiSettings.classList.remove('hidden');
    } else {
      if (wifiSettings) wifiSettings.classList.add('hidden');
    }
  }

  // Toggle Static IP Settings
  toggleStaticIPSettings(mode) {
    const staticFields = ['sbc_staticIP'];
    
    staticFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.disabled = mode !== 'STATIC';
      }
    });
  }

  // WiFi Scan
  async scanWifiNetworks() {
    const btn = document.getElementById('scanWifiBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '📡 Scanning...';
    }

    try {
      const response = await fetch('/api/network/wifi/scan');
      const data = await response.json();

      if (response.ok && data.success) {
        this.displayWifiList(data.networks);
        this.showStatus('✅ Found ' + data.networks.length + ' networks', 'success');
      } else {
        throw new Error(data.error || 'Scan failed');
      }
    } catch (error) {
      console.error('WiFi scan error:', error);
      this.showStatus('❌ WiFi scan failed: ' + error.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '📡 Scan Networks';
      }
    }
  }

  // Display WiFi List
  displayWifiList(networks) {
    const wifiList = document.getElementById('wifiList');
    const wifiListContainer = document.getElementById('wifiListContainer');

    if (!wifiList || !wifiListContainer) return;

    wifiList.innerHTML = '';

    if (networks.length === 0) {
      wifiList.innerHTML = '<div class="wifi-item">No networks found</div>';
      wifiListContainer.style.display = 'block';
      return;
    }

    networks.forEach(network => {
      const item = document.createElement('div');
      item.className = 'wifi-item';
      
      // Signal strength indicator
      let signalStrength = '📶';
      if (network.signal) {
        const signal = parseInt(network.signal);
        if (signal > -50) signalStrength = '📶📶📶';
        else if (signal > -70) signalStrength = '📶📶';
        else signalStrength = '📶';
      }

      item.innerHTML = `
        <span>${network.ssid || network.SSID || 'Unknown'} ${network.security ? '🔒' : ''}</span>
        <span class="wifi-signal">${signalStrength}</span>
      `;

      item.addEventListener('click', () => {
        // Deselect all
        document.querySelectorAll('.wifi-item').forEach(i => i.classList.remove('selected'));
        
        // Select this one
        item.classList.add('selected');
        this.selectedWifi = network;
        
        // Set SSID field
        const ssidField = document.getElementById('sbc_wifiSSID');
        if (ssidField) {
          ssidField.value = network.ssid || network.SSID || '';
        }
      });

      wifiList.appendChild(item);
    });

    wifiListContainer.style.display = 'block';
  }

  // Save Configuration
  async saveConfiguration() {
    const btn = document.getElementById('saveConfigBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '💾 Saving...';
    }

    try {
      const mode = document.querySelector('input[name="cameraMode"]:checked')?.value || 'RTSP';
      
      // Build complete configuration object matching CAMERA_CONFIGURATION structure
      const newConfig = {
        CAMERA_MODE: mode,
        DEVICE_NODE: document.getElementById('deviceNode')?.value || '/dev/video0',
        
        // Video Settings
        format: document.getElementById('format')?.value?.toLowerCase() || 'h264',
        resolution: document.getElementById('resolution')?.value || '1920x1080',
        fps: parseInt(document.getElementById('fps')?.value || '30'),
        bitrate: document.getElementById('bitrate')?.value || '4M',
        EXTENSION: document.getElementById('extension')?.value || '.mp4',
        
        // Zoom Configuration - EXACT field names
        ZOOM_IN_FIXED_FLAG: document.getElementById('zoomInFixedFlag')?.checked || false,
        ZOOM_IN_FIXED: parseInt(document.getElementById('zoomInFixed')?.value) || 100,
        ZOOM_OUT_FIXED: parseInt(document.getElementById('zoomOutFixed')?.value) || 5,
        ZOOM_POS_FIXED: parseInt(document.getElementById('zoomPosFixed')?.value) || 100,
        
        PTZ_POSITION_STEP: document.getElementById('ptzPositionStep')?.value || '0005',
        PTZ_MULTIPLE_POSITION_STEP: ['0010', '0020', '0050'], // Keep default array
        
        // Image Settings
        IMAGE_SETTINGS: {
          brightness_DEFAULT: 7,
          contrast_DEFAULT: 7,
          saturation_DEFAULT: 6,
          sharpness_DEFAULT: 7,
          brightness_CURRENT: parseInt(document.getElementById('brightness')?.value) || 7,
          contrast_CURRENT: parseInt(document.getElementById('contrast')?.value) || 7,
          saturation_CURRENT: parseInt(document.getElementById('saturation')?.value) || 6,
          sharpness_CURRENT: parseInt(document.getElementById('sharpness')?.value) || 7,
          whiteBalance: 'auto',
          exposure: 'auto',
          backlight: false,
          wdr: false,
          hue: parseInt(document.getElementById('hue')?.value) || 7,
          flip: 0,
          mirror: 0
        },
        
        // Camera Network - EXACT field names
        camera_network: {
          CAMERA_ONLINE: false,
          ip: document.getElementById('cameraIP')?.value || '192.168.100.86',
          SUBNET_MASK: document.getElementById('cam_subnetMask')?.value || '255.255.255.0',
          GATE_WAY: document.getElementById('cam_gateway')?.value || '192.168.100.1',
          DNS_Address: document.getElementById('cam_dns')?.value || '8.8.8.8',
          MAC_Address: document.getElementById('cam_macAddress')?.value || '',
          http_port: parseInt(document.getElementById('httpPort')?.value) || 80,
          rtspPort: parseInt(document.getElementById('rtspPort')?.value) || 554,
          tcp_port: parseInt(document.getElementById('cam_tcpPort')?.value) || 5678,
          udp_port: parseInt(document.getElementById('cam_udpPort')?.value) || 1259,
          Sony_Visca_port: 52381,
          rtspPath: document.getElementById('rtspPath')?.value || '/stream1',
          httpUser: document.getElementById('httpUser')?.value || 'admin',
          httpPass: document.getElementById('httpPass')?.value || 'admin',
          viscaTcpPort: 5678,
          viscaUdpPort: 1259,
          CAMERA_BASE_URL: null,
          rtspUrl: null,
          httpCgiBase: null
        },
        
        // SBC System Network - EXACT field names
        SBC_SYSTEM_NETWORK: {
          CONNECT_SYSTEM_NETWORK: document.querySelector('input[name="sbcNetworkType"]:checked')?.value || 'WIFI',
          SYSTEM_NETWORK_MODE: document.querySelector('input[name="sbcNetworkMode"]:checked')?.value || 'DHCP',
          STATIC_IP_ADDRESS: document.getElementById('sbc_staticIP')?.value || '192.168.29.54',
          DYNAMIC_IP_ADDRESS: document.getElementById('sbc_dynamicIP')?.value || '192.168.29.54',
          SUBNET_MASK: document.getElementById('sbc_subnetMask')?.value || '255.255.255.0',
          MAC_Address: document.getElementById('sbc_macAddress')?.value || '',
          GATE_WAY: document.getElementById('sbc_gateway')?.value || '192.168.29.1',
          DNS_Address: document.getElementById('sbc_dns')?.value || '8.8.8.8',
          WIFI_AVAILABLE_LIST: [], // Will be populated by scan
          WIFI_SSID: document.getElementById('sbc_wifiSSID')?.value || 'KHADAS',
          WIFI_PASSWORD: document.getElementById('sbc_wifiPassword')?.value || ''
        },
        
        // MediaMTX (keep existing)
        mediamtx: {
          binary: './mediamtx',
          configFile: './mediamtx.yml',
          webRTCPort: 8889,
          rtspPort: 8554,
          streamPath: 'live_camera'
        },
        
        // PTZ State
        PTZ_STATE: {
          hasPTZ: true,
          hasZoom: true,
          hasPresets: true,
          defaultPanSpeed: parseInt(document.getElementById('panSpeed')?.value) || 12,
          defaultTiltSpeed: parseInt(document.getElementById('tiltSpeed')?.value) || 10,
          defaultZoomSpeed: parseInt(document.getElementById('zoomSpeed')?.value) || 4,
          defaultFocusSpeed: parseInt(document.getElementById('focusSpeed')?.value) || 4,
          minZoom: 1,
          maxZoom: 20,
          panspeed: 10,
          tiltspeed: 10,
          panRange: [-180, 180],
          tiltRange: [-90, 90],
          moving: false
        }
      };

      console.log('Saving configuration:', newConfig);

      const response = await fetch('/api/camera/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });

      const result = await response.json();

      if (response.ok) {
        this.showStatus('✅ Configuration saved successfully!', 'success');
        
        // Apply network changes if needed
        const applyNetwork = await this.applyNetworkChanges(newConfig.SBC_SYSTEM_NETWORK);
        if (applyNetwork.success) {
          this.showStatus('✅ Network configuration applied!', 'success');
        }
        
        setTimeout(() => this.loadConfiguration(), 1000);
      } else {
        this.showStatus('❌ Failed to save: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Save error:', error);
      this.showStatus('❌ Save failed: ' + error.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '💾 Save Configuration';
      }
    }
  }

  // Apply Network Changes
  async applyNetworkChanges(networkConfig) {
    try {
      const response = await fetch('/api/network/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(networkConfig)
      });

      return await response.json();
    } catch (error) {
      console.error('Network apply error:', error);
      return { success: false, error: error.message };
    }
  }

  // Live Preview Setup
  setupLivePreview() {
    setTimeout(() => this.startPreview(), 1000);
  }

  // Start Preview Stream
  async startPreview() {
    const video = document.getElementById('previewVideo');
    const statusEl = document.getElementById('previewStatus');
    const qualityEl = document.getElementById('previewQuality');
    
    if (!video) return;

    try {
      this.cleanupPreview();

      const streamUrl = `http://${location.hostname}:8889/live_camera/whep`;

      this.previewPC = new RTCPeerConnection({
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        iceServers: []
      });

      this.previewPC.ontrack = (ev) => {
        video.srcObject = ev.streams[0];
        if (qualityEl) qualityEl.textContent = 'Streaming';
      };

      this.previewPC.onconnectionstatechange = () => {
        console.log('Preview connection state:', this.previewPC.connectionState);
        if (statusEl) {
          statusEl.textContent = this.previewPC.connectionState === 'connected' ? 'Connected' : 'Connecting';
        }
      };

      const offer = await this.previewPC.createOffer({
        offerToReceiveVideo: true
      });

      await this.previewPC.setLocalDescription(offer);

      const res = await fetch(streamUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp
      });

      if (!res.ok) throw new Error('MediaMTX rejected connection');

      const answer = await res.text();
      await this.previewPC.setRemoteDescription({
        type: 'answer',
        sdp: answer
      });

      console.log('✅ Preview WebRTC Connected');
    } catch (err) {
      console.error('Preview start failed:', err);
      if (statusEl) statusEl.textContent = 'Failed';
      if (qualityEl) qualityEl.textContent = 'Offline';
    }
  }

  // Cleanup Preview
  cleanupPreview() {
    if (this.previewPC) {
      this.previewPC.ontrack = null;
      this.previewPC.onconnectionstatechange = null;
      this.previewPC.close();
      this.previewPC = null;
    }

    const video = document.getElementById('previewVideo');
    if (video) video.srcObject = null;
  }

  // Toggle Preview
  togglePreview() {
    const container = document.getElementById('previewContainer');
    this.previewVisible = !this.previewVisible;
    
    if (this.previewVisible) {
      container.classList.remove('hidden');
      this.startPreview();
    } else {
      container.classList.add('hidden');
      this.cleanupPreview();
    }
  }

  // Minimize Preview
  minimizePreview() {
    const container = document.getElementById('previewContainer');
    container.classList.toggle('minimized');
  }

  // Close Preview
  closePreview() {
    this.previewVisible = false;
    document.getElementById('previewContainer').classList.add('hidden');
    this.cleanupPreview();
  }

  // Reset Image Settings
  async resetImageSettings() {
    if (!confirm('Reset image settings to defaults?')) return;

    try {
      const response = await fetch('/api/ptz/image_setting?mode=DEFAULT&level=1');
      const result = await response.json();

      if (result.success) {
        const defaults = { brightness: 7, contrast: 7, saturation: 6, sharpness: 7, hue: 7 };
        Object.entries(defaults).forEach(([id, value]) => this.setSlider(id, value));
        this.showStatus('✅ Image settings reset to defaults', 'success');
      } else {
        this.showStatus('❌ Failed to reset image settings', 'error');
      }
    } catch (error) {
      console.error('Reset image error:', error);
      this.showStatus('❌ Reset failed: ' + error.message, 'error');
    }
  }

  // Reset Configuration
  async resetConfiguration() {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;

    const btn = document.getElementById('resetBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '↺ Resetting...';
    }

    try {
      await this.loadConfiguration();
      this.showStatus('✅ Configuration reset to defaults.', 'success');
    } catch (error) {
      console.error('Reset error:', error);
      this.showStatus('❌ Reset failed: ' + error.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '↺ Reset to Defaults';
      }
    }
  }

  // Check Camera Status
  async checkCameraStatus() {
    try {
      const response = await fetch('/api/camera/config');
      const data = await response.json();
      
      if (data.current && data.current.camera_network) {
        const online = data.current.camera_network.CAMERA_ONLINE;
        this.updateCameraStatus(online ? 'online' : 'offline');
      }
    } catch (error) {
      this.updateCameraStatus('offline');
    }
  }

  // Update Camera Status Badge
  updateCameraStatus(status) {
    const badge = document.getElementById('cameraStatus');
    
    if (badge) {
      if (status === 'online') {
        badge.className = 'connection-badge online';
        badge.innerHTML = '<span class="status-dot"></span><span>Camera Online</span>';
      } else {
        badge.className = 'connection-badge offline';
        badge.innerHTML = '<span class="status-dot"></span><span>Camera Offline</span>';
      }
    }
  }

  // Show Status Message
  showStatus(message, type = 'info') {
    const statusEl = document.getElementById('statusMessage');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `status-message ${type}`;
      statusEl.style.display = 'block';

      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 5000);
    }
  }
}

// Initialize on page load
let configController;
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing Complete Configuration Controller');
  configController = new ConfigController();
});
