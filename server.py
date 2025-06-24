from flask import Flask, request, jsonify, send_from_directory, after_this_request
from yt_dlp import YoutubeDL
import os
import re

# Flask app setup
app = Flask(__name__, static_url_path='', static_folder='.')
# Place downloads outside the web root
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOWNLOAD_FOLDER = os.path.join(BASE_DIR, '..', 'downloads')
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

def sanitize_filename(title):
    """
    Remove invalid filename characters for safe file saving.
    """
    return re.sub(r'[^\w\-_. ]', '', title)

@app.route('/')
def index():
    """
    Serve the main HTML page.
    """
    return app.send_static_file('index.html')

@app.route('/download', methods=['POST'])
def download():
    """
    Handle video download requests. Accepts a YouTube URL, downloads the video using yt-dlp,
    and returns a download link with the original video title as the filename.
    """
    data = request.get_json()
    url = data.get('url')
    if not url:
        return jsonify({'success': False, 'error': 'No URL provided.'}), 400
    try:
        # Extract video info to get the title (without downloading)
        with YoutubeDL({'quiet': True}) as ydl:
            info = ydl.extract_info(url, download=False)
            title = info.get('title', 'video')
            ext = info.get('ext', 'mp4')
        safe_title = sanitize_filename(title)
        output_template = os.path.join(DOWNLOAD_FOLDER, f'{safe_title}.%(ext)s')
        ydl_opts = {
            'outtmpl': output_template,
            'format': 'best[ext=mp4]/best',
            'quiet': True,
        }
        # Download the video
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            ext = info.get('ext', 'mp4')
        filename = f'{safe_title}.{ext}'
        download_url = f'/downloads/{filename}'
        return jsonify({'success': True, 'download_url': download_url})
    except Exception as e:
        # Return error message if download fails
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/downloads/<path:filename>')
def serve_file(filename):
    """
    Serve the downloaded video file for the user to download, then delete it for security.
    """
    file_path = os.path.join(DOWNLOAD_FOLDER, filename)
    @after_this_request
    def remove_file(response):
        try:
            os.remove(file_path)
        except Exception:
            pass
        return response
    return send_from_directory(DOWNLOAD_FOLDER, filename, as_attachment=True)

if __name__ == '__main__':
    # Run the Flask development server
    app.run(debug=True) 