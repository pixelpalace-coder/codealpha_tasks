document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playPauseIcon = playPauseBtn.querySelector('i');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const repeatBtn = document.getElementById('repeat-btn');

    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');

    const volumeSlider = document.getElementById('volume-slider');
    const volumeIcon = document.getElementById('volume-icon');

    const audioUpload = document.getElementById('audio-upload');
    const trackTitle = document.getElementById('track-title');
    const artistName = document.getElementById('artist-name');
    const coverArt = document.getElementById('cover-art');
    const placeholderArt = document.getElementById('placeholder-art');

    const playlistPanel = document.getElementById('playlist-panel');
    const playlistList = document.getElementById('playlist-list');
    const playlistToggle = document.getElementById('playlist-toggle');
    const closePlaylist = document.getElementById('close-playlist');

    // State Variables
    let songs = [];
    let currentSongIndex = 0;
    let isPlaying = false;
    let isShuffle = false;
    let isRepeat = false; // 0: off, 1: all, (2: one - optional extent) -> simplifying to boolean for now

    const audio = new Audio();

    // Event Listeners
    playPauseBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);
    shuffleBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);

    progressBar.addEventListener('click', setProgress);

    volumeSlider.addEventListener('input', setVolume);

    audioUpload.addEventListener('change', handleFileUpload);

    playlistToggle.addEventListener('click', () => playlistPanel.classList.add('show'));
    closePlaylist.addEventListener('click', () => playlistPanel.classList.remove('show'));

    // Functions
    function handleFileUpload(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Add new files to songs array
        const newSongs = files.filter(file => file.type.startsWith('audio/')).map(file => {
            return {
                name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                artist: 'Unknown Artist', // Placeholder, could parse metadata in future
                url: URL.createObjectURL(file), // Create object URL for local playback
                originalFile: file
            };
        });

        // If it's the first upload, start playing the first new song
        const wasEmpty = songs.length === 0;
        songs = [...songs, ...newSongs];
        renderPlaylist();

        if (wasEmpty && songs.length > 0) {
            loadSong(0);
        }
    }

    function loadSong(index) {
        if (songs.length === 0) return;

        currentSongIndex = index;
        const song = songs[currentSongIndex];

        trackTitle.textContent = song.name;
        artistName.textContent = song.artist;
        audio.src = song.url;
        audio.load();

        // Reset UI
        progressFill.style.width = '0%';
        currentTimeEl.textContent = '0:00';
        totalTimeEl.textContent = '0:00'; // Will update on loadedmetadata

        // Highlight in playlist
        updatePlaylistHighlight();

        // Auto play if we were already playing or if it's a direct selection
        if (isPlaying) {
            audio.play();
        }
    }

    function togglePlay() {
        if (songs.length === 0) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        isPlaying = !isPlaying;
        updatePlayPauseIcon();
    }

    function updatePlayPauseIcon() {
        if (isPlaying) {
            playPauseIcon.classList.remove('fa-play');
            playPauseIcon.classList.add('fa-pause');
        } else {
            playPauseIcon.classList.remove('fa-pause');
            playPauseIcon.classList.add('fa-play');
        }
    }

    function prevSong() {
        if (songs.length === 0) return;

        currentSongIndex--;
        if (currentSongIndex < 0) {
            currentSongIndex = songs.length - 1;
        }

        // If playing, we want to keep playing the new song
        // If paused, we just load it (unless we want to auto-play on skip, but user req says 'control' usually implies keeping state)
        // Let's safe-guard: if we change tracks, we generally expect playback if it was playing.
        // Actually, for better UX, usually next/prev plays immediately.
        let wasPlaying = isPlaying;
        loadSong(currentSongIndex);
        if (wasPlaying || true) { // Force play on skip for smoother UX
            playSong();
        }
    }

    function nextSong() {
        if (songs.length === 0) return;

        if (isShuffle) {
            currentSongIndex = Math.floor(Math.random() * songs.length);
        } else {
            currentSongIndex++;
            if (currentSongIndex >= songs.length) {
                currentSongIndex = 0;
            }
        }

        loadSong(currentSongIndex);
        playSong();
    }

    function playSong() {
        audio.play().then(() => {
            isPlaying = true;
            updatePlayPauseIcon();
        }).catch(err => console.error("Playback failed:", err));
    }

    function handleEnded() {
        if (isRepeat) {
            playSong();
        } else {
            nextSong();
        }
    }

    function updateProgress(e) {
        const { duration, currentTime } = e.srcElement;
        if (isNaN(duration)) return;

        const progressPercent = (currentTime / duration) * 100;
        progressFill.style.width = `${progressPercent}%`;

        currentTimeEl.textContent = formatTime(currentTime);
        totalTimeEl.textContent = formatTime(duration);
    }

    function setProgress(e) {
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const duration = audio.duration;

        if (isNaN(duration)) return;

        audio.currentTime = (clickX / width) * duration;
    }

    function setVolume(e) {
        audio.volume = e.target.value;
        updateVolumeIcon(audio.volume);
    }

    function updateVolumeIcon(volume) {
        volumeIcon.className = 'fa-solid';
        if (volume > 0.7) {
            volumeIcon.classList.add('fa-volume-high');
        } else if (volume > 0.3) {
            volumeIcon.classList.add('fa-volume-low');
        } else if (volume > 0) {
            volumeIcon.classList.add('fa-volume-off'); // volume-off usually creates a 'low' look or we can use volume-xmark for mute
        } else {
            volumeIcon.classList.add('fa-volume-xmark');
        }
    }

    function toggleShuffle() {
        isShuffle = !isShuffle;
        shuffleBtn.style.color = isShuffle ? 'var(--accent-color)' : 'var(--text-secondary)';
    }

    function toggleRepeat() {
        isRepeat = !isRepeat;
        repeatBtn.style.color = isRepeat ? 'var(--accent-color)' : 'var(--text-secondary)';
    }

    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    }

    function renderPlaylist() {
        playlistList.innerHTML = '';
        songs.forEach((song, index) => {
            const li = document.createElement('li');
            li.classList.add('playlist-item');
            if (index === currentSongIndex) {
                li.classList.add('active');
            }

            li.innerHTML = `
                <span class="song-title">${index + 1}. ${song.name}</span>
                <i class="fa-solid fa-music"></i>
            `;

            li.addEventListener('click', () => {
                loadSong(index);
                playSong();
            });

            playlistList.appendChild(li);
        });
    }

    function updatePlaylistHighlight() {
        const items = document.querySelectorAll('.playlist-item');
        items.forEach((item, index) => {
            if (index === currentSongIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Add button press effects
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.95)');
        btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1.1)'); // recover to hover state
        btn.addEventListener('mouseleave', () => btn.style.transform = '');
    });
});
