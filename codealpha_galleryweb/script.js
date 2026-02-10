document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const fileInput = document.getElementById('imageUpload');
    const galleryContainer = document.querySelector('.gallery-container');
    const emptyState = document.getElementById('empty-state');
    // const filterBtns = document.querySelectorAll('.filter-btn'); // Removed
    const visualBtns = document.querySelectorAll('.visual-btn');

    // Lightbox Elements
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.querySelector('.lightbox-img');
    const lightboxCaption = document.querySelector('.lightbox-caption');
    const closeBtn = document.querySelector('.close-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    // State
    let galleryData = []; // { id, src, category, name, element }
    let currentFilter = 'all';
    let currentLightboxIndex = 0; // Index within the *visible* items

    // Demo Categories
    const categories = ['nature', 'urban', 'abstract'];

    // --- File Handling ---
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);

        if (files.length > 0 && emptyState) {
            emptyState.style.display = 'none';
        }

        files.forEach(file => {
            const reader = new FileReader();

            reader.onload = (event) => {
                // Assign random category for demo purposes
                const randomCategory = categories[Math.floor(Math.random() * categories.length)];

                const imageData = {
                    id: Date.now() + Math.random(),
                    src: event.target.result,
                    name: file.name,
                    category: randomCategory,
                    element: null // Reference to DOM element
                };

                createGalleryItem(imageData);
                galleryData.unshift(imageData); // Add to beginning
            };

            reader.readAsDataURL(file);
        });

        // Reset input to allow re-uploading same file if needed
        fileInput.value = '';
    });

    // --- DOM Creation ---
    function createGalleryItem(data) {
        const item = document.createElement('div');
        item.classList.add('gallery-item');
        item.dataset.category = data.category;

        // Check if a visual filter is currently active and apply it
        const activeVisual = document.querySelector('.visual-btn.active').dataset.visual;
        if (activeVisual !== 'none') {
            item.classList.add(`filter-${activeVisual}`);
        }

        item.innerHTML = `
            <img src="${data.src}" alt="${data.name}" loading="lazy">
            <div class="overlay">
                <h3>${data.name}</h3>
                <p>${data.category}</p>
            </div>
        `;

        // Click to open lightbox
        item.addEventListener('click', () => {
            openLightbox(data.id);
        });

        // Prepend to gallery to show newest first (after empty state if present)
        if (galleryContainer.firstChild) {
            galleryContainer.insertBefore(item, galleryContainer.firstChild);
        } else {
            galleryContainer.appendChild(item);
        }

        data.element = item;
    }

    // --- Filtering Logic ---
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // UI Update
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentFilter = btn.dataset.filter;
            filterGallery();
        });
    });

    function filterGallery() {
        galleryData.forEach(item => {
            if (currentFilter === 'all' || item.category === currentFilter) {
                item.element.style.display = 'block';
                // Trigger reflow for animation restart (optional/simple approach)
                item.element.style.animation = 'none';
                item.element.offsetHeight; /* trigger reflow */
                item.element.style.animation = 'fadeIn 0.5s forwards';
            } else {
                item.element.style.display = 'none';
            }
        });
    }

    // --- Visual Effects Logic ---
    visualBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            visualBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const effect = btn.dataset.visual;
            const filterClass = `filter-${effect}`;

            // Remove all filter classes from items
            galleryData.forEach(item => {
                item.element.classList.remove('filter-grayscale', 'filter-sepia', 'filter-invert', 'filter-none');
                if (effect !== 'none') {
                    item.element.classList.add(filterClass);
                }
            });
        });
    });

    // --- Lightbox Logic ---
    function getVisibleItems() {
        return galleryData.filter(item => item.element.style.display !== 'none');
    }

    function openLightbox(itemId) {
        const visibleItems = getVisibleItems();
        const index = visibleItems.findIndex(item => item.id === itemId);

        if (index === -1) return;

        currentLightboxIndex = index;
        updateLightboxContent(visibleItems[index]);
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function updateLightboxContent(item) {
        lightboxImg.src = item.src;
        lightboxCaption.textContent = `${item.name} (${item.category})`;

        // Apply current visual filter to lightbox image too
        const activeVisual = document.querySelector('.visual-btn.active').dataset.visual;
        lightboxImg.className = 'lightbox-img'; // Reset
        if (activeVisual !== 'none') {
            lightboxImg.classList.add(`filter-${activeVisual}`);
        }
    }

    function closeLightboxFunc() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            lightboxImg.src = ''; // Clear src to save memory/stop accidental loading
        }, 300);
    }

    function nextImage() {
        const visibleItems = getVisibleItems();
        if (visibleItems.length === 0) return;
        currentLightboxIndex = (currentLightboxIndex + 1) % visibleItems.length;
        updateLightboxContent(visibleItems[currentLightboxIndex]);
    }

    function prevImage() {
        const visibleItems = getVisibleItems();
        if (visibleItems.length === 0) return;
        currentLightboxIndex = (currentLightboxIndex - 1 + visibleItems.length) % visibleItems.length;
        updateLightboxContent(visibleItems[currentLightboxIndex]);
    }

    // Event Listeners for Lightbox
    closeBtn.addEventListener('click', closeLightboxFunc);
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextImage(); });
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevImage(); });

    // Close on outside click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightboxFunc();
        }
    });

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;

        if (e.key === 'Escape') closeLightboxFunc();
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
    });
});
