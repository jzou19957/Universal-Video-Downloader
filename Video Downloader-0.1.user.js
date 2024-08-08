// ==UserScript==
// @name         Video Downloader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Detect videos and provide download links
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
        #video-downloader-container {
            position: fixed;
            top: 10px;
            right: 10px;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 9999;
            max-height: 80vh;
            overflow-y: auto;
        }
        .video-item {
            margin-bottom: 10px;
            border-bottom: 1px solid #444;
            padding-bottom: 10px;
        }
        .video-thumbnail {
            max-width: 200px;
            max-height: 150px;
        }
        .download-btn {
            background-color: #4CAF50;
            border: none;
            color: white;
            padding: 5px 10px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 14px;
            margin: 4px 2px;
            cursor: pointer;
        }
    `);

    function waitForVideos() {
        return new Promise(resolve => {
            const checkVideos = () => {
                const videos = document.querySelectorAll('video');
                if (videos.length > 0) {
                    resolve(Array.from(videos));
                } else {
                    setTimeout(checkVideos, 1000);
                }
            };
            checkVideos();
        });
    }

    function getVideoSize(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'HEAD',
                url: url,
                onload: function(response) {
                    const size = response.responseHeaders.match(/content-length: (\d+)/i);
                    if (size && size[1]) {
                        resolve(formatSize(parseInt(size[1])));
                    } else {
                        resolve('Unknown');
                    }
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    function formatSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    function createDownloadLink(video, index) {
        const container = document.createElement('div');
        container.className = 'video-item';

        const thumbnail = document.createElement('img');
        thumbnail.className = 'video-thumbnail';
        thumbnail.src = video.poster || '';
        container.appendChild(thumbnail);

        const info = document.createElement('p');
        getVideoSize(video.src).then(size => {
            info.textContent = `Video ${index + 1} (${size})`;
            container.appendChild(info);

            const downloadBtn = document.createElement('a');
            downloadBtn.className = 'download-btn';
            downloadBtn.textContent = 'Download';
            downloadBtn.href = video.src;
            downloadBtn.download = `video_${index + 1}.mp4`;
            container.appendChild(downloadBtn);
        });

        return container;
    }

    function init() {
        waitForVideos().then(videos => {
            const container = document.createElement('div');
            container.id = 'video-downloader-container';

            videos.forEach((video, index) => {
                const downloadLink = createDownloadLink(video, index);
                container.appendChild(downloadLink);
            });

            document.body.appendChild(container);
        });
    }

    init();
})();