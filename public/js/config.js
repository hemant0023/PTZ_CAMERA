class ConfigController {
  
  constructor() {
    this.config = null;
    this.capabilities = null;
    this.previewWS = null;
    this.previewMS = null;
    this.previewSB = null;
    this.previewVisible = true;
    
    this.init();
  }

  init() {
    this.loadConfiguration();
    this.setupEventListeners();
    this.setupLivePreview();
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

  // Populate Dropdowns from Capabilities
  populateDropdowns() {
    if (!this.capabilities) return;

    // Video Format
    const formatSelect = document.getElementById('format');
    formatSelect.innerHTML = '';
    if (this.capabilities.REC_FORMATS) {
      this.capabilities.REC_FORMATS.forEach(format => {
        const option = new Option(format, format);
        if (this.config && format.toLowerCase() === this.config.format) {
          option.selected = true;
        }
        formatSelect.add(option);
      });
    }

    // Resolution
    const resolutionSelect = document.getElementById('resolution');
    resolutionSelect.innerHTML = '';
    if (this.capabilities.REC_RESOLUTIONS) {
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
    fpsSelect.innerHTML = '';
    if (this.capabilities.REC_FPS) {
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
    bitrateSelect.innerHTML = '';
    if (this.capabilities.REC_BITERATE) {
      this.capabilities.REC_BITERATE.forEach(bitrate => {
        const option = new Option(bitrate, bitrate);
        if (this.config && bitrate === this.config.bitrate) {
          option.selected = true;
        }
        bitrateSelect.add(option);
      });
    }

    // Extension
    const extensionSelect = document.getElementById('extension');
    extensionSelect.innerHTML = '';
    if (this.capabilities.EXTENSION) {
      this.capabilities.EXTENSION.forEach(ext => {
        const option = new Option(ext.toUpperCase(), ext);
        if (this.config && ext === this.config.EXTENSION) {
          option.selected = true;
        }
        extensionSelect.add(option);
      });
    }
  }

  // Populate Form Fields with Current Config
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
    if (this.config.DEVICE_NODE) {
      document.getElementById('deviceNode').value = this.config.DEVICE_NODE;
    }

    // RTSP Settings
    if (this.config.camera_network) {
      const net = this.config.camera_network;
      document.getElementById('cameraIP').value = net.ip || '';
      document.getElementById('rtspPort').value = net.rtspPort || 554;
      document.getElementById('httpPort').value = net.http_port || 80;
      document.getElementById('rtspPath').value = net.rtspPath || '/stream1';
      document.getElementById('httpUser').value = net.httpUser || '';
      document.getElementById('httpPass').value = net.httpPass || '';
      
      // Network settings
      document.getElementById('subnetMask').value = net.subnet_mask || '';
      document.getElementById('gateway').value = net.gate_way || '';
      document.getElementById('dns').value = net.DNS_Address || '';
      document.getElementById('macAddress').value = net.MAC_Address || '';
      document.getElementById('tcpPort').value = net.tcp_port || 5678;
      document.getElementById('udpPort').value = net.udp_port || 1259;
    }

    // Video Settings - ensure values match exactly
    if (this.config.format) {
      const formatVal = this.config.format.toUpperCase();
      document.getElementById('format').value = formatVal;
    }
    if (this.config.resolution) {
      document.getElementById('resolution').value = this.config.resolution;
    }
    if (this.config.fps) {
      document.getElementById('fps').value = this.config.fps;
    }
    if (this.config.bitrate) {
      document.getElementById('bitrate').value = this.config.bitrate;
    }
    if (this.config.EXTENSION) {
      document.getElementById('extension').value = this.config.EXTENSION;
    }

    // PTZ Settings
    if (this.config.PTZ_STATE) {
      const ptz = this.config.PTZ_STATE;
      document.getElementById('panSpeed').value = ptz.defaultPanSpeed || 12;
      document.getElementById('tiltSpeed').value = ptz.defaultTiltSpeed || 10;
      document.getElementById('zoomSpeed').value = ptz.defaultZoomSpeed || 4;
      document.getElementById('focusSpeed').value = ptz.defaultFocusSpeed || 4;
    }
  }

  // Update Current Configuration Display
  updateCurrentDisplay() {
    if (!this.config) return;

    document.getElementById('currentMode').textContent = this.config.CAMERA_MODE || '--';
    document.getElementById('currentResolution').textContent = this.config.resolution || '--';
    document.getElementById('currentFPS').textContent = this.config.fps ? `${this.config.fps} FPS` : '--';
    document.getElementById('currentBitrate').textContent = this.config.bitrate || '--';
    document.getElementById('currentFormat').textContent = this.config.format || '--';

    // Build RTSP URL
    if (this.config.camera_network) {
      const net = this.config.camera_network;
      const rtspUrl = `rtsp://${net.httpUser}:***@${net.ip}:${net.rtspPort}${net.rtspPath}`;
      document.getElementById('currentRTSP').textContent = rtspUrl;
    }
  }

  // Setup Event Listeners
  setupEventListeners() {
    // Camera Mode Switch
    document.querySelectorAll('input[name="cameraMode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.toggleModeSettings(e.target.value);
      });
    });

    // Test Connection Button
    document.getElementById('testConnectionBtn').addEventListener('click', () => {
      this.testConnection();
    });

    // Preview Button
    document.getElementById('previewBtn').addEventListener('click', () => {
      this.testStreamQuality();
    });

    // Save Configuration Button
    document.getElementById('saveConfigBtn').addEventListener('click', () => {
      this.saveConfiguration();
    });

    // Reset Button
    document.getElementById('resetBtn').addEventListener('click', () => {
      this.resetConfiguration();
    });

    // Preview Toggle
    document.getElementById('togglePreview').addEventListener('click', () => {
      this.togglePreview();
    });

    // Real-time validation
    document.getElementById('cameraIP').addEventListener('blur', (e) => {
      this.validateIP(e.target);
    });
  }

  // Toggle USB/RTSP Settings
  toggleModeSettings(mode) {
    const usbSettings = document.getElementById('usbSettings');
    const rtspSettings = document.getElementById('rtspSettings');

    if (mode === 'USB') {
      usbSettings.style.display = 'block';
      rtspSettings.style.display = 'none';
    } else {
      usbSettings.style.display = 'none';
      rtspSettings.style.display = 'block';
    }
  }

  // Test Connection
  async testConnection() {
    const btn = document.getElementById('testConnectionBtn');
    btn.disabled = true;
    btn.textContent = '🔍 Testing...';

    // const mode = document.querySelector('input[name="cameraMode"]:checked').value;

    // try {
    //   if (mode === 'RTSP') {
    //     const ip = document.getElementById('cameraIP').value;
    //     const user = document.getElementById('httpUser').value;
    //     const pass = document.getElementById('httpPass').value;

    //     // Test HTTP-CGI
    //     const response = await fetch(`http://${ip}/cgi-bin/param.cgi?get_device_conf`, {
    //       method: 'GET',
    //       headers: {
    //         'Authorization': 'Basic ' + btoa(`${user}:${pass}`)
    //       }
    //     });

    //     if (response.ok) {
    //       this.showStatus('✅ Connection successful! Camera is online.', 'success');
    //       this.updateCameraStatus('online');
    //     } else {
    //       this.showStatus('⚠️ Connection failed. Check credentials.', 'error');
    //       this.updateCameraStatus('offline');
    //     }
    //   } else {
    //     // Test USB device
    //     const response = await fetch('/api/camera/config');
    //     const data = await response.json();
        
    //     if (data.success) {
    //       this.showStatus('✅ USB device detected!', 'success');
    //       this.updateCameraStatus('online');
    //     } else {
    //       this.showStatus('⚠️ USB device not found.', 'error');
    //       this.updateCameraStatus('offline');
    //     }
    //   }
    // } catch (error) {
    //   console.error('Connection test error:', error);
    //   this.showStatus('❌ Connection test failed: ' + error.message, 'error');
    //   this.updateCameraStatus('offline');
    // } finally {
    //   btn.disabled = false;
    //   btn.textContent = '🔍 Test Connection';
    // }

  }

  // Test Stream Quality
  async testStreamQuality() {
    
    const btn = document.getElementById('previewBtn');
    btn.disabled = true;
    btn.textContent = '👁️ Starting Preview...';

    try {
      // Show preview window
      document.getElementById('livePreview').style.display = 'block';
      this.previewVisible = true;
      
      // Start stream
      await this.startPreviewStream();
      
      this.showStatus('✅ Preview started. Check bottom-right corner.', 'success');
    } catch (error) {
      console.error('Preview error:', error);
      this.showStatus('❌ Preview failed: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '👁️ Test Stream Quality';
    }
  }

  // Save Configuration
  async saveConfiguration() {

    const btn = document.getElementById('saveConfigBtn');
    btn.disabled = true;
    btn.textContent = '💾 Saving...';

    try {
      const mode = document.querySelector('input[name="cameraMode"]:checked').value;
      
      // Build configuration object matching backend structure
      const newConfig = {
        CAMERA_MODE: mode,
        format: document.getElementById('format').value.toLowerCase(),
        resolution: document.getElementById('resolution').value,
        fps: parseInt(document.getElementById('fps').value),
        bitrate: document.getElementById('bitrate').value,
        EXTENSION: document.getElementById('extension').value
      };

      // Add mode-specific settings
      if (mode === 'USB') {
        newConfig.DEVICE_NODE = document.getElementById('deviceNode').value;
      }

      // Always include camera_network (even for USB mode)
      newConfig.camera_network = {
        ip: document.getElementById('cameraIP').value,
        rtspPort: parseInt(document.getElementById('rtspPort').value) || 554,
        http_port: parseInt(document.getElementById('httpPort').value) || 80,
        rtspPath: document.getElementById('rtspPath').value,
        httpUser: document.getElementById('httpUser').value,
        httpPass: document.getElementById('httpPass').value,
        subnet_mask: document.getElementById('subnetMask').value,
        gate_way: document.getElementById('gateway').value,
        DNS_Address: document.getElementById('dns').value,
        tcp_port: parseInt(document.getElementById('tcpPort').value) || 5678,
        udp_port: parseInt(document.getElementById('udpPort').value) || 1259
      };

      // Include PTZ settings
      newConfig.PTZ_STATE = {
        defaultPanSpeed: parseInt(document.getElementById('panSpeed').value),
        defaultTiltSpeed: parseInt(document.getElementById('tiltSpeed').value),
        defaultZoomSpeed: parseInt(document.getElementById('zoomSpeed').value),
        defaultFocusSpeed: parseInt(document.getElementById('focusSpeed').value)
      };

      console.log('Saving configuration:', newConfig);

      const response = await fetch('/api/camera/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });

      const result = await response.json();

      if (response.ok) {
        this.showStatus('✅ Configuration saved successfully! Changes will take effect on next recording.', 'success');
        // Reload configuration to show updated values
        setTimeout(() => this.loadConfiguration(), 1000);
      } else {
        this.showStatus('❌ Failed to save: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Save error:', error);
      this.showStatus('❌ Save failed: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '💾 Save Configuration';
    }
  }

  // Reset Configuration
  async resetConfiguration() {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) {
      return;
    }

    const btn = document.getElementById('resetBtn');
    btn.disabled = true;
    btn.textContent = '↺ Resetting...';

    try {
      // Implement reset logic
      await this.loadConfiguration();
      this.showStatus('✅ Configuration reset to defaults.', 'success');
    } catch (error) {
      console.error('Reset error:', error);
      this.showStatus('❌ Reset failed: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '↺ Reset to Defaults';
    }
  }

  // Setup Live Preview
  setupLivePreview() {
    // Will be started when user clicks preview button
  }



  // Start Preview Stream
  async startPreviewStream() {
    const video = document.getElementById('previewVideo');
    const statusEl = document.getElementById('previewStatus');
    const qualityEl = document.getElementById('previewQuality');
    const STREAM_URL = `http://${location.hostname}:8889/live_camera/whep`;
    let pc = null;

  if (pc) {
    pc.ontrack = null;
    pc.onconnectionstatechange = null;
    pc.close();
    pc = null;
  }

  video.srcObject = null;

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

try {

  pc.onconnectionstatechange = () => {
     console.log("WETRC_STATE:", pc.connectionState);
     if(pc.connectionState === "failed" ||pc.connectionState === "disconnected" || pc.connectionState === "closed") {
      scheduleReconnect();
    }
  };

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
    statusEl.textContent = 'Streaming';
  } catch (err) {
    console.error("WebRTC start failed:", err);
    statusEl.textContent = 'Preview failed: ' + err.message;
  }
            // Update quality info
    const quality = `${this.config.resolution} @ ${this.config.fps}fps`;
     qualityEl.textContent = quality;
        
          
  }

  // Toggle Preview Visibility
  togglePreview() {
    const preview = document.getElementById('livePreview');
    const btn =     document.getElementById('togglePreview');
    
    if (this.previewVisible) {
      preview.style.display = 'none';
      btn.textContent = 'Show';
      this.previewVisible = false;
      
      // Stop stream
      if (this.previewWS) {
        this.previewWS.close();
      }
    } else {
      preview.style.display = 'block';
      btn.textContent = 'Hide';
      this.previewVisible = true;
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
    
    if (status === 'online') {
      badge.className = 'connection-badge online';
      badge.innerHTML = '<span class="status-dot"></span><span>Camera Online</span>';
    } else {
      badge.className = 'connection-badge offline';
      badge.innerHTML = '<span class="status-dot"></span><span>Camera Offline</span>';
    }
  }

  // Validate IP Address
  validateIP(input) {
    const value = input.value;
    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    if (value && !ipPattern.test(value)) {
      input.style.borderColor = 'var(--danger)';
      this.showStatus('⚠️ Invalid IP address format', 'error');
    } else {
      input.style.borderColor = 'var(--border)';
    }
  }

  // Show Status Message
  showStatus(message, type = 'info') {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';

    setTimeout(() => {statusEl.style.display = 'none';}, 5000);
  }
}

// Initialize on page load
let configController;
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing Configuration Controller');
  configController = new ConfigController();
});
