// Helper functions for modals
function showModal(id) {
    document.getElementById(id).style.display = 'block';
}
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Clear input button
const clearBtn = document.getElementById('clearBtn');
const videoUrlInput = document.getElementById('videoUrl');
if (clearBtn && videoUrlInput) {
    clearBtn.addEventListener('click', () => {
        videoUrlInput.value = '';
    });
}

// Download button logic
const downloadBtn = document.getElementById('downloadBtn');
const loadingModal = document.getElementById('loadingModal');
const errorModal = document.getElementById('errorModal');
const successModal = document.getElementById('successModal');
const loadingStatus = document.getElementById('loadingStatus');
const progressBar = document.getElementById('progressBar');
const errorMessage = document.getElementById('errorMessage');
const downloadFileBtn = document.querySelector('.download-file-btn');

let downloadUrl = '';

if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
        const url = videoUrlInput.value.trim();
        if (!url) {
            errorMessage.textContent = 'Please enter a YouTube URL.';
            showModal('errorModal');
            return;
        }
        showModal('loadingModal');
        loadingStatus.textContent = 'Connecting to server...';
        progressBar.style.width = '10%';
        try {
            const response = await fetch('/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            if (!response.ok) {
                throw new Error('Server error');
            }
            const data = await response.json();
            if (data.success) {
                downloadUrl = data.download_url;
                progressBar.style.width = '100%';
                closeModal('loadingModal');
                showModal('successModal');
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (err) {
            closeModal('loadingModal');
            errorMessage.textContent = err.message || 'Something went wrong.';
            showModal('errorModal');
        }
    });
}

if (downloadFileBtn) {
    downloadFileBtn.addEventListener('click', () => {
        if (downloadUrl) {
            window.location.href = downloadUrl;
            closeModal('successModal');
        }
    });
}

// Close modals on background click
window.onclick = function(event) {
    ['loadingModal', 'errorModal', 'successModal'].forEach(id => {
        const modal = document.getElementById(id);
        if (modal && event.target === modal) {
            closeModal(id);
        }
    });
};

// Custom animated cursor
(function() {
    const cursor = document.querySelector('.custom-cursor');
    if (!cursor) return;
    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let cursorX = mouseX, cursorY = mouseY;
    const speed = 0.18;

    function animate() {
        cursorX += (mouseX - cursorX) * speed;
        cursorY += (mouseY - cursorY) * speed;
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        requestAnimationFrame(animate);
    }
    animate();

    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Elements that should trigger cursor grow effect
    const hoverSelectors = [
        'button', 'a', '.download-btn', '.modal-btn', '.social-icon', '.clear-btn', '.nav-link', '.feature-card', '.floating-card'
    ];
    document.addEventListener('mouseover', e => {
        if (hoverSelectors.some(sel => e.target.closest(sel))) {
            cursor.classList.add('cursor-hover');
        }
    });
    document.addEventListener('mouseout', e => {
        if (hoverSelectors.some(sel => e.target.closest(sel))) {
            cursor.classList.remove('cursor-hover');
        }
    });

    // Hide cursor on touch devices
    window.addEventListener('touchstart', () => {
        cursor.style.display = 'none';
    }, { once: true });
})(); 