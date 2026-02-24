// "use strict";
// /* ===============================
//    DOM REFERENCES
// ================================ */
// const folderView = document.getElementById("folderView");
// const videoView  = document.getElementById("videoView");
// const backBtn    = document.getElementById("backBtn");
// const pathLabel  = document.getElementById("pathLabel");

// const modal  = document.getElementById("videoModal");
// const player = document.getElementById("videoPlayer");

// /* ===============================
//    STATE
// ================================ */
// let currentFolder = null;
// let modalOpen = false;

// /* ===============================
//    SAFE FETCH WRAPPER
// ================================ */
// async function safeFetch(url) {
//   try {
//     const res = await fetch(url);

//     if (!res.ok) {
//       throw new Error(`HTTP ${res.status}`);
//     }

//     return await res.json();
//   } catch (err) {
//     console.error("Fetch failed:", url, err);
//     showError(`Failed to load data from server`);
//     return null;
//   }
// }

// /* ===============================
//    UI ERROR DISPLAY
// ================================ */
// function showError(message) {
//   alert(`❌ ERROR:\n${message}`);
// }

// /* ===============================
//    LOAD FOLDERS
// ================================ */
// async function loadFolders() {
//   const data = await safeFetch("/api/recordings");
//   if (!data || !Array.isArray(data.folders)) return;

//   folderView.className = "list-box folder";
//   folderView.innerHTML = `
//     <div class="header">
//       <span>Folder</span>
//       <span>Files</span>
//       <span>Total Size</span>
//       <span>Modified</span>
//     </div>
//   `;

//   if (data.folders.length === 0) {
//     folderView.innerHTML += `
//       <div class="row">
//         <span>No recordings found</span>
//         <span>-</span><span>-</span><span>-</span>
//       </div>`;
//     return;
//   }

//   data.folders.forEach(f => {
//     const row = document.createElement("div");
//     row.className = "row clickable";

//     row.innerHTML = `
//       <span>📁 ${f.name}</span>
//       <span>${f.fileCount ?? "-"}</span>
//       <span>${f.totalSize ?? "-"}</span>
//       <span>${f.modified ?? "-"}</span>
//     `;

//     row.onclick = () => openFolder(f.name);
//     folderView.appendChild(row);
//   });
// }

// /* ===============================
//    OPEN FOLDER
// ================================ */
// async function openFolder(folder) {
//   currentFolder = folder;

//   folderView.classList.add("hidden");
//   videoView.classList.remove("hidden");
//   backBtn.classList.remove("hidden");

//   pathLabel.textContent = `/videos/${folder}`;

//   const data = await safeFetch(`/api/recordings/${folder}`);
//   if (!data || !Array.isArray(data.videos)) return;

//   renderVideos(data.videos);
// }

// /* ===============================
//    RENDER VIDEOS
// ================================ */
// function renderVideos(videos) {

//   videoView.className = "list-box video";
//   videoView.innerHTML = `
//     <div class="header">
//       <span>#</span>
//       <span>File</span>
//       <span>Type</span>
//       <span>Size</span>
//       <span>Duration</span>
//       <span>Created</span>
//       <span>Action</span>
//     </div>
//   `;

//   if (videos.length === 0) {
//     videoView.innerHTML += `
//       <div class="row">
//         <span>-</span>
//         <span>No videos found</span>
//         <span>-</span><span>-</span><span>-</span><span>-</span><span>-</span>
//       </div>`;
//     return;
//   }

//   videos.forEach((v, index) => {
//     if (!v.url) return;

//     const row = document.createElement("div");
//     row.className = "row";

//     row.innerHTML = `
//       <span>${index + 1}</span>
//       <span>🎥 ${v.name}</span>
//       <span>${v.type}</span>
//       <span>${v.sizeMB}</span>
//       <span>${v.duration}</span>
//       <span>${v.created}</span>
//       <span>
//         <button onclick="playVideo('${v.url}')">▶ Play</button>
//         <a href="${v.url}" download>⬇</a>
//       </span>
//     `;

//     videoView.appendChild(row);
//   });
// }

// /* ===============================
//    BACK BUTTON
// ================================ */
// backBtn.onclick = () => {
//   stopAndResetPlayer();

//   videoView.classList.add("hidden");
//   folderView.classList.remove("hidden");
//   backBtn.classList.add("hidden");

//   pathLabel.textContent = "/videos";
//   currentFolder = null;
// };

// /* ===============================
//    VIDEO PLAYBACK
// ================================ */
// function playVideo(url){
 
//   if(!url){
//     showError("Invalid video URL");
//     return;
//   }

//   try {

//     stopAndResetPlayer();
//     console.log(url);
//     player.src = url;
//     modal.classList.remove("hidden");
//     modalOpen = true;

//       player.play().catch(err => {
//       console.warn("Playback blocked:", err);
//     });
//      //window.open(url, "_blank", "noopener,noreferrer");

//   } catch (err) {
//     console.error("Play error:", err);
//     showError("Unable to play video");
//   }
// }

// /* ===============================
//    STOP & RESET PLAYER
// ================================ */
// function stopAndResetPlayer() {
//   try {
//     player.pause();
//     player.removeAttribute("src");
//     player.load();
//   } catch (err) {
//     console.warn("Player reset failed:", err);
//   }
// }

// /* ===============================
//    CLOSE MODAL
// ================================ */
// function closePlayer() {
//   stopAndResetPlayer();
//   modal.classList.add("hidden");
//   modalOpen = false;
// }

// /* ===============================
//    CLICK OUTSIDE TO CLOSE
// ================================ */
// modal.addEventListener("click", e => {
//   if (e.target === modal) {
//     closePlayer();
//   }
// });

// /* ===============================
//    ESC KEY TO CLOSE
// ================================ */
// document.addEventListener("keydown", e => {
//   if (e.key === "Escape" && modalOpen) {
//     closePlayer();
//   }
// });

// /* ===============================
//    VIDEO ERROR HANDLING
// ================================ */
// player.addEventListener("error", () => {
//   showError("Video playback error");
//   closePlayer();
// });

// /* ===============================
//    INITIAL LOAD
// ================================ */
// loadFolders();

/* ===============================
   ENHANCED RECORDS CONTROLLER
   Professional Industrial Features
================================ */

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