
class RecordsController {
  constructor() {
    this.currentFolder = null;
    this.allFolders = [];
    this.allVideos = [];
    this.filteredVideos = [];
    this.sortColumn = null;
    this.sortDirection = 'asc';
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadFolders();
  }

  setupEventListeners() {
    // Back Button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.goBack());
    }

    // Filter Actions
    const applyFilters = document.getElementById('applyFilters');
    if (applyFilters) {
      applyFilters.addEventListener('click', () => this.applyFilters());
    }

    const clearFilters = document.getElementById('clearFilters');
    if (clearFilters) {
      clearFilters.addEventListener('click', () => this.clearFilters());
    }

    // Real-time search
    const filterName = document.getElementById('filterName');
    if (filterName) {
      filterName.addEventListener('input', () => this.applyFilters());
    }

    // Modal close on outside click
    const modal = document.getElementById('videoModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closePlayer();
        }
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('show')) {
        this.closePlayer();
      }
    });
  }

  // Fetch with error handling
  async safeFetch(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error('Fetch failed:', url, err);
      this.showError(`Failed to load data: ${err.message}`);
      return null;
    }
  }

  // Load Folders
  async loadFolders() {
    const data = await this.safeFetch('/api/recordings');
    if (!data || !Array.isArray(data.folders)) return;

    this.allFolders = data.folders;
    this.updateStats(data.folders);
    this.renderFoldersTable(data.folders);
  }

  // Update Stats
  updateStats(folders) {
    let totalVideos = 0;
    let totalSizeBytes = 0;
    let latestDate = null;

    folders.forEach(folder => {
      totalVideos += folder.fileCount || 0;
      // Parse size like "123.45 MB"
      const sizeMatch = folder.totalSize.match(/([\d.]+)/);
      if (sizeMatch) {
        totalSizeBytes += parseFloat(sizeMatch[1]);
      }
      
      const folderDate = new Date(folder.modified);
      if (!latestDate || folderDate > latestDate) {
        latestDate = folderDate;
      }
    });

    document.getElementById('totalFolders').textContent = folders.length;
    document.getElementById('totalVideos').textContent = totalVideos;
    document.getElementById('totalSize').textContent = `${(totalSizeBytes / 1024).toFixed(2)} GB`;
    
    if (latestDate) {
      const dateStr = latestDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      document.getElementById('latestRecording').textContent = dateStr;
    }
  }

  // Render Folders Table
  renderFoldersTable(folders) {
    const table = document.getElementById('recordsTable');
    document.getElementById('tableTitle').textContent = 'Folders';
    
    let html = `
      <thead>
        <tr>
          <th onclick="recordsController.sortTable('name')">
            Folder Name <span class="sort-icon"></span>
          </th>
          <th onclick="recordsController.sortTable('fileCount')">
            Videos <span class="sort-icon"></span>
          </th>
          <th onclick="recordsController.sortTable('totalSize')">
            Total Size <span class="sort-icon"></span>
          </th>
          <th onclick="recordsController.sortTable('modified')">
            Last Modified <span class="sort-icon"></span>
          </th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
    `;

    if (folders.length === 0) {
      html += `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <div class="empty-icon">📁</div>
              <p>No recordings found</p>
            </div>
          </td>
        </tr>
      `;
    } else {
      folders.forEach(folder => {
        html += `
          <tr class="folder-row" onclick="recordsController.openFolder('${folder.name}')">
            <td>
              <div class="video-name">
                <span class="folder-icon">📁</span>
                ${this.escapeHtml(folder.name)}
              </div>
            </td>
            <td>${folder.fileCount || 0}</td>
            <td>${folder.totalSize || '-'}</td>
            <td>${folder.modified || '-'}</td>
            <td>
              <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); recordsController.openFolder('${folder.name}')">
                Open →
              </button>
            </td>
          </tr>
        `;
      });
    }

    html += '</tbody>';
    table.innerHTML = html;
  }

  // Open Folder
  async openFolder(folderName) {
    this.currentFolder = folderName;

    // Update UI
    document.getElementById('statsSection').classList.add('hidden');
    document.getElementById('filterBar').classList.remove('hidden');
    document.getElementById('backBtn').classList.remove('hidden');
    document.getElementById('pathLabel').textContent = `/videos/${folderName}`;

    // Fetch videos
    const data = await this.safeFetch(`/api/recordings/${folderName}`);
    if (!data || !Array.isArray(data.videos)) return;

    this.allVideos = data.videos;
    this.filteredVideos = [...data.videos];
    this.renderVideosTable(this.filteredVideos);
  }

  // Render Videos Table
  renderVideosTable(videos) {
    const table = document.getElementById('recordsTable');
    document.getElementById('tableTitle').textContent = `Videos (${videos.length})`;
    
    let html = `
      <thead>
        <tr>
          <th onclick="recordsController.sortTable('index')" style="width: 60px;">
            ID <span class="sort-icon"></span>
          </th>
          <th onclick="recordsController.sortTable('name')">
            File Name <span class="sort-icon"></span>
          </th>
          <th onclick="recordsController.sortTable('type')" style="width: 80px;">
            Type <span class="sort-icon"></span>
          </th>
          <th onclick="recordsController.sortTable('sizeMB')" style="width: 100px;">
            Size <span class="sort-icon"></span>
          </th>
          <th onclick="recordsController.sortTable('duration')" style="width: 100px;">
            Duration <span class="sort-icon"></span>
          </th>
          <th onclick="recordsController.sortTable('created')" style="width: 180px;">
            Created <span class="sort-icon"></span>
          </th>
          <th style="width: 180px;">Actions</th>
        </tr>
      </thead>
      <tbody>
    `;

    if (videos.length === 0) {
      html += `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-icon">🎥</div>
              <p>No videos found matching your filters</p>
            </div>
          </td>
        </tr>
      `;
    } else {
      videos.forEach((video, index) => {
        html += `
          <tr>
            <td><span class="badge badge-primary">#${index + 1}</span></td>
            <td>
              <div class="video-name">
                🎥 ${this.escapeHtml(video.name)}
              </div>
            </td>
            <td><span class="badge badge-success">${video.type}</span></td>
            <td>${video.sizeMB} MB</td>
            <td>${video.duration || 'N/A'}</td>
            <td>${video.created}</td>
            <td>
              <div class="action-buttons">
                <button class="action-btn btn-play" onclick="recordsController.playVideo('${video.url}')">
                  ▶ Play
                </button>
                <a href="${video.url}" download class="action-btn btn-download">
                  ⬇ Download
                </a>
              </div>
            </td>
          </tr>
        `;
      });
    }

    html += '</tbody>';
    table.innerHTML = html;
  }

  // Apply Filters
  applyFilters() {
    const nameFilter = document.getElementById('filterName')?.value.toLowerCase() || '';
    const dateFrom = document.getElementById('filterDateFrom')?.value || '';
    const dateTo = document.getElementById('filterDateTo')?.value || '';
    const minSize = parseFloat(document.getElementById('filterMinSize')?.value) || 0;

    this.filteredVideos = this.allVideos.filter(video => {
      // Name filter
      if (nameFilter && !video.name.toLowerCase().includes(nameFilter)) {
        return false;
      }

      // Date filters
      if (dateFrom || dateTo) {
        const videoDate = new Date(video.created);
        if (dateFrom && videoDate < new Date(dateFrom)) return false;
        if (dateTo && videoDate > new Date(dateTo)) return false;
      }

      // Size filter
      if (minSize > 0) {
        const videoSize = parseFloat(video.sizeMB) || 0;
        if (videoSize < minSize) return false;
      }

      return true;
    });

    this.renderVideosTable(this.filteredVideos);
  }

  // Clear Filters
  clearFilters() {
    document.getElementById('filterName').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    document.getElementById('filterMinSize').value = '';
    
    this.filteredVideos = [...this.allVideos];
    this.renderVideosTable(this.filteredVideos);
  }

  // Sort Table
  sortTable(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    const data = this.currentFolder ? this.filteredVideos : this.allFolders;

    data.sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];

      // Handle special cases
      if (column === 'sizeMB' || column === 'fileCount') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (column === 'created' || column === 'modified') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Update UI to show sort indicator
    document.querySelectorAll('th').forEach(th => {
      th.classList.remove('sorted-asc', 'sorted-desc');
    });
    
    const sortedTh = Array.from(document.querySelectorAll('th')).find(th => 
      th.textContent.toLowerCase().includes(column.toLowerCase())
    );
    
    if (sortedTh) {
      sortedTh.classList.add(`sorted-${this.sortDirection}`);
    }

    if (this.currentFolder) {
      this.renderVideosTable(data);
    } else {
      this.renderFoldersTable(data);
    }
  }

  // Go Back
  goBack() {
    this.currentFolder = null;
    this.allVideos = [];
    this.filteredVideos = [];

    document.getElementById('statsSection').classList.remove('hidden');
    document.getElementById('filterBar').classList.add('hidden');
    document.getElementById('backBtn').classList.add('hidden');
    document.getElementById('pathLabel').textContent = '/videos';

    this.loadFolders();
  }

  // Play Video
  playVideo(url) {
    if (!url) {
      this.showError('Invalid video URL');
      return;
    }

    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');

    if (!modal || !player) return;

    try {
      this.stopAndResetPlayer();
      player.src = url;
      modal.classList.add('show');
      
      player.play().catch(err => {
        console.warn('Playback blocked:', err);
      });
    } catch (err) {
      console.error('Play error:', err);
      this.showError('Unable to play video');
    }
  }

  // Stop and Reset Player
  stopAndResetPlayer() {
    const player = document.getElementById('videoPlayer');
    if (!player) return;

    try {
      player.pause();
      player.removeAttribute('src');
      player.load();
    } catch (err) {
      console.warn('Player reset failed:', err);
    }
  }

  // Close Player
  closePlayer() {
    this.stopAndResetPlayer();
    const modal = document.getElementById('videoModal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  // Show Error
  showError(message) {
    alert(`❌ ERROR:\n${message}`);
  }

  // Escape HTML to prevent XSS
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Make closePlayer globally accessible for onclick
window.closePlayer = function() {
  if (window.recordsController) {
    window.recordsController.closePlayer();
  }
};

// Initialize
let recordsController;
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing Enhanced Records Controller');
  recordsController = new RecordsController();
  window.recordsController = recordsController;
});


// class RecordsController {
//   constructor() {
//     this.currentFolder = null;
//     this.allFolders = [];
//     this.allVideos = [];
//     this.filteredVideos = [];
//     this.sortColumn = null;
//     this.sortDirection = 'asc';
    
//     // Zoom and Pan state
//     this.zoom = 100;
//     this.panX = 0;
//     this.panY = 0;
//     this.isDragging = false;
//     this.lastMouseX = 0;
//     this.lastMouseY = 0;
//     this.playbackRate = 1;
    
//     this.init();
//   }

//   init() {
//     this.setupEventListeners();
//     this.setupVideoControls();
//     this.loadFolders();
//   }

//   setupEventListeners() {
//     // Back Button
//     const backBtn = document.getElementById('backBtn');
//     if (backBtn) {
//       backBtn.addEventListener('click', () => this.goBack());
//     }

//     // Filter Actions
//     const applyFilters = document.getElementById('applyFilters');
//     if (applyFilters) {
//       applyFilters.addEventListener('click', () => this.applyFilters());
//     }

//     const clearFilters = document.getElementById('clearFilters');
//     if (clearFilters) {
//       clearFilters.addEventListener('click', () => this.clearFilters());
//     }

//     // Real-time search
//     const filterName = document.getElementById('filterName');
//     if (filterName) {
//       filterName.addEventListener('input', () => this.applyFilters());
//     }

//     // Modal close on outside click
//     const modal = document.getElementById('videoModal');
//     if (modal) {
//       modal.addEventListener('click', (e) => {
//         if (e.target === modal) {
//           this.closePlayer();
//         }
//       });
//     }

//     // Keyboard shortcuts
//     document.addEventListener('keydown', (e) => {
//       const modal = document.getElementById('videoModal');
//       if (modal && modal.classList.contains('show')) {
//         if (e.key === 'Escape') {
//           this.closePlayer();
//         } else if (e.key === 'ArrowUp') {
//           e.preventDefault();
//           this.panVideo('up');
//         } else if (e.key === 'ArrowDown') {
//           e.preventDefault();
//           this.panVideo('down');
//         } else if (e.key === 'ArrowLeft') {
//           e.preventDefault();
//           this.panVideo('left');
//         } else if (e.key === 'ArrowRight') {
//           e.preventDefault();
//           this.panVideo('right');
//         } else if (e.key === '+' || e.key === '=') {
//           e.preventDefault();
//           this.adjustZoom(25);
//         } else if (e.key === '-' || e.key === '_') {
//           e.preventDefault();
//           this.adjustZoom(-25);
//         } else if (e.key === '0') {
//           e.preventDefault();
//           this.resetZoom();
//         }
//       }
//     });
//   }

//   setupVideoControls() {
//     // Speed Controls
//     document.querySelectorAll('.speed-btn').forEach(btn => {
//       btn.addEventListener('click', () => {
//         const speed = parseFloat(btn.dataset.speed);
//         this.setPlaybackSpeed(speed);
        
//         // Update active state
//         document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
//         btn.classList.add('active');
//       });
//     });

//     // Zoom Controls
//     const zoomSlider = document.getElementById('zoomSlider');
//     if (zoomSlider) {
//       zoomSlider.addEventListener('input', (e) => {
//         this.setZoom(parseInt(e.target.value));
//       });
//     }

//     const zoomIn = document.getElementById('zoomIn');
//     if (zoomIn) {
//       zoomIn.addEventListener('click', () => this.adjustZoom(25));
//     }

//     const zoomOut = document.getElementById('zoomOut');
//     if (zoomOut) {
//       zoomOut.addEventListener('click', () => this.adjustZoom(-25));
//     }

//     const zoomReset = document.getElementById('zoomReset');
//     if (zoomReset) {
//       zoomReset.addEventListener('click', () => this.resetZoom());
//     }

//     // Pan Controls
//     document.querySelectorAll('.pan-btn[data-direction]').forEach(btn => {
//       btn.addEventListener('click', () => {
//         const direction = btn.dataset.direction;
//         this.panVideo(direction);
//       });
//     });

//     const panCenter = document.getElementById('panCenter');
//     if (panCenter) {
//       panCenter.addEventListener('click', () => this.resetPan());
//     }

//     // Mouse/Touch Pan on Video
//     const videoWrapper = document.getElementById('videoWrapper');
//     if (videoWrapper) {
//       videoWrapper.addEventListener('mousedown', (e) => this.startDrag(e));
//       videoWrapper.addEventListener('mousemove', (e) => this.doDrag(e));
//       videoWrapper.addEventListener('mouseup', () => this.endDrag());
//       videoWrapper.addEventListener('mouseleave', () => this.endDrag());

//       // Touch events
//       videoWrapper.addEventListener('touchstart', (e) => {
//         const touch = e.touches[0];
//         this.startDrag({ clientX: touch.clientX, clientY: touch.clientY });
//       });
//       videoWrapper.addEventListener('touchmove', (e) => {
//         e.preventDefault();
//         const touch = e.touches[0];
//         this.doDrag({ clientX: touch.clientX, clientY: touch.clientY });
//       });
//       videoWrapper.addEventListener('touchend', () => this.endDrag());
//     }
//   }

//   // Playback Speed Control
//   setPlaybackSpeed(rate) {
//     const video = document.getElementById('videoPlayer');
//     if (video) {
//       video.playbackRate = rate;
//       this.playbackRate = rate;
//       console.log(`Playback speed set to ${rate}x`);
//     }
//   }

//   // Zoom Control
//   setZoom(level) {
//     this.zoom = Math.max(100, Math.min(400, level));
    
//     // Update slider
//     const slider = document.getElementById('zoomSlider');
//     if (slider) {
//       slider.value = this.zoom;
//     }

//     // Update label
//     const label = document.getElementById('zoomLevel');
//     if (label) {
//       label.textContent = `${this.zoom}%`;
//     }

//     // Show/hide pan controls
//     const panControls = document.getElementById('panControls');
//     if (panControls) {
//       panControls.style.display = this.zoom > 100 ? 'block' : 'none';
//     }

//     this.applyTransform();
//   }

//   adjustZoom(delta) {
//     this.setZoom(this.zoom + delta);
//   }

//   resetZoom() {
//     this.setZoom(100);
//     this.resetPan();
//   }

//   // Pan Control
//   panVideo(direction) {
//     const panStep = 50;
    
//     switch (direction) {
//       case 'up':
//         this.panY = Math.min(this.panY + panStep, this.getMaxPan());
//         break;
//       case 'down':
//         this.panY = Math.max(this.panY - panStep, -this.getMaxPan());
//         break;
//       case 'left':
//         this.panX = Math.min(this.panX + panStep, this.getMaxPan());
//         break;
//       case 'right':
//         this.panX = Math.max(this.panX - panStep, -this.getMaxPan());
//         break;
//     }

//     this.applyTransform();
//   }

//   resetPan() {
//     this.panX = 0;
//     this.panY = 0;
//     this.applyTransform();
//   }

//   getMaxPan() {
//     // Calculate maximum pan based on zoom level
//     const zoomRatio = this.zoom / 100;
//     return (zoomRatio - 1) * 200;
//   }

//   // Mouse Drag Pan
//   startDrag(e) {
//     if (this.zoom <= 100) return;
    
//     this.isDragging = true;
//     this.lastMouseX = e.clientX;
//     this.lastMouseY = e.clientY;
    
//     const wrapper = document.getElementById('videoWrapper');
//     if (wrapper) {
//       wrapper.classList.add('grabbing');
//     }
//   }

//   doDrag(e) {
//     if (!this.isDragging) return;

//     const deltaX = e.clientX - this.lastMouseX;
//     const deltaY = e.clientY - this.lastMouseY;

//     this.panX += deltaX;
//     this.panY += deltaY;

//     // Constrain to max pan
//     const maxPan = this.getMaxPan();
//     this.panX = Math.max(-maxPan, Math.min(maxPan, this.panX));
//     this.panY = Math.max(-maxPan, Math.min(maxPan, this.panY));

//     this.lastMouseX = e.clientX;
//     this.lastMouseY = e.clientY;

//     this.applyTransform();
//   }

//   endDrag() {
//     this.isDragging = false;
    
//     const wrapper = document.getElementById('videoWrapper');
//     if (wrapper) {
//       wrapper.classList.remove('grabbing');
//     }
//   }

//   // Apply Transform to Video
//   applyTransform() {
//     const video = document.getElementById('videoPlayer');
//     if (!video) return;

//     const scale = this.zoom / 100;
//     const translateX = this.panX;
//     const translateY = this.panY;

//     video.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
//   }

//   // Fetch with error handling
//   async safeFetch(url) {
//     try {
//       const res = await fetch(url);
//       if (!res.ok) {
//         throw new Error(`HTTP ${res.status}`);
//       }
//       return await res.json();
//     } catch (err) {
//       console.error('Fetch failed:', url, err);
//       this.showError(`Failed to load data: ${err.message}`);
//       return null;
//     }
//   }

//   // Load Folders
//   async loadFolders() {
//     const data = await this.safeFetch('/api/recordings');
//     if (!data || !Array.isArray(data.folders)) return;

//     this.allFolders = data.folders;
//     this.updateStats(data.folders);
//     this.renderFoldersTable(data.folders);
//   }

//   // Update Stats
//   updateStats(folders) {
//     let totalVideos = 0;
//     let totalSizeBytes = 0;
//     let latestDate = null;

//     folders.forEach(folder => {
//       totalVideos += folder.fileCount || 0;
//       const sizeMatch = folder.totalSize.match(/([\d.]+)/);
//       if (sizeMatch) {
//         totalSizeBytes += parseFloat(sizeMatch[1]);
//       }
      
//       const folderDate = new Date(folder.modified);
//       if (!latestDate || folderDate > latestDate) {
//         latestDate = folderDate;
//       }
//     });

//     document.getElementById('totalFolders').textContent = folders.length;
//     document.getElementById('totalVideos').textContent = totalVideos;
//     document.getElementById('totalSize').textContent = `${(totalSizeBytes / 1024).toFixed(2)} GB`;
    
//     if (latestDate) {
//       const dateStr = latestDate.toLocaleDateString('en-US', {
//         month: 'short',
//         day: 'numeric',
//         year: 'numeric'
//       });
//       document.getElementById('latestRecording').textContent = dateStr;
//     }
//   }

//   // Render Folders Table
//   renderFoldersTable(folders) {
//     const table = document.getElementById('recordsTable');
//     document.getElementById('tableTitle').textContent = 'Folders';
    
//     let html = `
//       <thead>
//         <tr>
//           <th onclick="recordsController.sortTable('name')">
//             Folder Name <span class="sort-icon"></span>
//           </th>
//           <th onclick="recordsController.sortTable('fileCount')">
//             Videos <span class="sort-icon"></span>
//           </th>
//           <th onclick="recordsController.sortTable('totalSize')">
//             Total Size <span class="sort-icon"></span>
//           </th>
//           <th onclick="recordsController.sortTable('modified')">
//             Last Modified <span class="sort-icon"></span>
//           </th>
//           <th>Actions</th>
//         </tr>
//       </thead>
//       <tbody>
//     `;

//     if (folders.length === 0) {
//       html += `
//         <tr>
//           <td colspan="5">
//             <div class="empty-state">
//               <div class="empty-icon">📁</div>
//               <p>No recordings found</p>
//             </div>
//           </td>
//         </tr>
//       `;
//     } else {
//       folders.forEach(folder => {
//         html += `
//           <tr class="folder-row" onclick="recordsController.openFolder('${folder.name}')">
//             <td>
//               <div class="video-name">
//                 <span class="folder-icon">📁</span>
//                 ${this.escapeHtml(folder.name)}
//               </div>
//             </td>
//             <td>${folder.fileCount || 0}</td>
//             <td>${folder.totalSize || '-'}</td>
//             <td>${folder.modified || '-'}</td>
//             <td>
//               <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); recordsController.openFolder('${folder.name}')">
//                 Open →
//               </button>
//             </td>
//           </tr>
//         `;
//       });
//     }

//     html += '</tbody>';
//     table.innerHTML = html;
//   }

//   // Open Folder
//   async openFolder(folderName) {
//     this.currentFolder = folderName;

//     document.getElementById('statsSection').classList.add('hidden');
//     document.getElementById('filterBar').classList.remove('hidden');
//     document.getElementById('backBtn').classList.remove('hidden');
//     document.getElementById('pathLabel').textContent = `/videos/${folderName}`;

//     const data = await this.safeFetch(`/api/recordings/${folderName}`);
//     if (!data || !Array.isArray(data.videos)) return;

//     this.allVideos = data.videos;
//     this.filteredVideos = [...data.videos];
//     this.renderVideosTable(this.filteredVideos);
//   }

//   // Render Videos Table
//   renderVideosTable(videos) {
//     const table = document.getElementById('recordsTable');
//     document.getElementById('tableTitle').textContent = `Videos (${videos.length})`;
    
//     let html = `
//       <thead>
//         <tr>
//           <th onclick="recordsController.sortTable('index')" style="width: 60px;">
//             ID <span class="sort-icon"></span>
//           </th>
//           <th onclick="recordsController.sortTable('name')">
//             File Name <span class="sort-icon"></span>
//           </th>
//           <th onclick="recordsController.sortTable('type')" style="width: 80px;">
//             Type <span class="sort-icon"></span>
//           </th>
//           <th onclick="recordsController.sortTable('sizeMB')" style="width: 100px;">
//             Size <span class="sort-icon"></span>
//           </th>
//           <th onclick="recordsController.sortTable('duration')" style="width: 100px;">
//             Duration <span class="sort-icon"></span>
//           </th>
//           <th onclick="recordsController.sortTable('created')" style="width: 180px;">
//             Created <span class="sort-icon"></span>
//           </th>
//           <th style="width: 180px;">Actions</th>
//         </tr>
//       </thead>
//       <tbody>
//     `;

//     if (videos.length === 0) {
//       html += `
//         <tr>
//           <td colspan="7">
//             <div class="empty-state">
//               <div class="empty-icon">🎥</div>
//               <p>No videos found matching your filters</p>
//             </div>
//           </td>
//         </tr>
//       `;
//     } else {
//       videos.forEach((video, index) => {
//         html += `
//           <tr>
//             <td><span class="badge badge-primary">#${index + 1}</span></td>
//             <td>
//               <div class="video-name">
//                 🎥 ${this.escapeHtml(video.name)}
//               </div>
//             </td>
//             <td><span class="badge badge-success">${video.type}</span></td>
//             <td>${video.sizeMB} MB</td>
//             <td>${video.duration || 'N/A'}</td>
//             <td>${video.created}</td>
//             <td>
//               <div class="action-buttons">
//                 <button class="action-btn btn-play" onclick="recordsController.playVideo('${video.url}')">
//                   ▶ Play
//                 </button>
//                 <a href="${video.url}" download class="action-btn btn-download">
//                   ⬇ Download
//                 </a>
//               </div>
//             </td>
//           </tr>
//         `;
//       });
//     }

//     html += '</tbody>';
//     table.innerHTML = html;
//   }

//   // Apply Filters
//   applyFilters() {
//     const nameFilter = document.getElementById('filterName')?.value.toLowerCase() || '';
//     const dateFrom = document.getElementById('filterDateFrom')?.value || '';
//     const dateTo = document.getElementById('filterDateTo')?.value || '';
//     const minSize = parseFloat(document.getElementById('filterMinSize')?.value) || 0;

//     this.filteredVideos = this.allVideos.filter(video => {
//       if (nameFilter && !video.name.toLowerCase().includes(nameFilter)) {
//         return false;
//       }

//       if (dateFrom || dateTo) {
//         const videoDate = new Date(video.created);
//         if (dateFrom && videoDate < new Date(dateFrom)) return false;
//         if (dateTo && videoDate > new Date(dateTo)) return false;
//       }

//       if (minSize > 0) {
//         const videoSize = parseFloat(video.sizeMB) || 0;
//         if (videoSize < minSize) return false;
//       }

//       return true;
//     });

//     this.renderVideosTable(this.filteredVideos);
//   }

//   // Clear Filters
//   clearFilters() {
//     document.getElementById('filterName').value = '';
//     document.getElementById('filterDateFrom').value = '';
//     document.getElementById('filterDateTo').value = '';
//     document.getElementById('filterMinSize').value = '';
    
//     this.filteredVideos = [...this.allVideos];
//     this.renderVideosTable(this.filteredVideos);
//   }

//   // Sort Table
//   sortTable(column) {
//     if (this.sortColumn === column) {
//       this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
//     } else {
//       this.sortColumn = column;
//       this.sortDirection = 'asc';
//     }

//     const data = this.currentFolder ? this.filteredVideos : this.allFolders;

//     data.sort((a, b) => {
//       let aVal = a[column];
//       let bVal = b[column];

//       if (column === 'sizeMB' || column === 'fileCount') {
//         aVal = parseFloat(aVal) || 0;
//         bVal = parseFloat(bVal) || 0;
//       } else if (column === 'created' || column === 'modified') {
//         aVal = new Date(aVal);
//         bVal = new Date(bVal);
//       } else if (typeof aVal === 'string') {
//         aVal = aVal.toLowerCase();
//         bVal = bVal.toLowerCase();
//       }

//       if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
//       if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
//       return 0;
//     });

//     document.querySelectorAll('th').forEach(th => {
//       th.classList.remove('sorted-asc', 'sorted-desc');
//     });
    
//     const sortedTh = Array.from(document.querySelectorAll('th')).find(th => 
//       th.textContent.toLowerCase().includes(column.toLowerCase())
//     );
    
//     if (sortedTh) {
//       sortedTh.classList.add(`sorted-${this.sortDirection}`);
//     }

//     if (this.currentFolder) {
//       this.renderVideosTable(data);
//     } else {
//       this.renderFoldersTable(data);
//     }
//   }

//   // Go Back
//   goBack() {
//     this.currentFolder = null;
//     this.allVideos = [];
//     this.filteredVideos = [];

//     document.getElementById('statsSection').classList.remove('hidden');
//     document.getElementById('filterBar').classList.add('hidden');
//     document.getElementById('backBtn').classList.add('hidden');
//     document.getElementById('pathLabel').textContent = '/videos';

//     this.loadFolders();
//   }

//   // Play Video
//   playVideo(url) {
//     if (!url) {
//       this.showError('Invalid video URL');
//       return;
//     }

//     const modal = document.getElementById('videoModal');
//     const player = document.getElementById('videoPlayer');

//     if (!modal || !player) return;

//     try {
//       this.stopAndResetPlayer();
//       this.resetZoom();
//       this.setPlaybackSpeed(1);
      
//       // Reset speed button states
//       document.querySelectorAll('.speed-btn').forEach(btn => {
//         btn.classList.remove('active');
//         if (btn.dataset.speed === '1') {
//           btn.classList.add('active');
//         }
//       });

//       player.src = url;
//       modal.classList.add('show');
      
//       player.play().catch(err => {
//         console.warn('Playback blocked:', err);
//       });
//     } catch (err) {
//       console.error('Play error:', err);
//       this.showError('Unable to play video');
//     }
//   }

//   // Stop and Reset Player
//   stopAndResetPlayer() {
//     const player = document.getElementById('videoPlayer');
//     if (!player) return;

//     try {
//       player.pause();
//       player.removeAttribute('src');
//       player.load();
//     } catch (err) {
//       console.warn('Player reset failed:', err);
//     }
//   }

//   // Close Player
//   closePlayer() {
//     this.stopAndResetPlayer();
//     this.resetZoom();
    
//     const modal = document.getElementById('videoModal');
//     if (modal) {
//       modal.classList.remove('show');
//     }
//   }

//   // Show Error
//   showError(message) {
//     alert(`❌ ERROR:\n${message}`);
//   }

//   // Escape HTML
//   escapeHtml(text) {
//     const div = document.createElement('div');
//     div.textContent = text;
//     return div.innerHTML;
//   }
// }

// // Make closePlayer globally accessible
// window.closePlayer = function() {
//   if (window.recordsController) {
//     window.recordsController.closePlayer();
//   }
// };

// // Initialize
// let recordsController;
// document.addEventListener('DOMContentLoaded', () => {
//   console.log('🚀 Initializing Enhanced Records Controller with Zoom & Speed Controls');
//   recordsController = new RecordsController();
//   window.recordsController = recordsController;
// });