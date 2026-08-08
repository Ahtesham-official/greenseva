/**
 * Ultra-Smooth High-Performance Scroll-Driven Background Image Sequence Engine
 * GreenSeva Platform
 */

class ScrollSequence {
    constructor(config) {
        this.canvas = document.getElementById(config.canvasId);
        if (!this.canvas) return;

        this.section = config.sectionId ? document.getElementById(config.sectionId) : null;
        this.isFullPage = !this.section;

        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.frameCount = config.frameCount || 240;
        this.folderPath = config.folderPath || 'ezgif-2d8fe1435630ed0c-jpg';
        this.prefix = config.prefix || 'ezgif-frame-';
        this.extension = config.extension || '.jpg';
        
        this.progressText = config.progressTextId ? document.getElementById(config.progressTextId) : null;
        this.frameDisplay = config.frameDisplayId ? document.getElementById(config.frameDisplayId) : null;
        this.captionsSelector = config.captionsSelector || null;

        this.images = [];
        this.loadedCount = 0;
        this.targetFrame = 0;
        this.currentFrame = 0;
        this.lastRenderedFrame = -1;
        this.lerpFactor = config.lerpFactor || 0.09; // Slow-motion inertia factor
        this.isRunning = false;

        this.init();
    }

    init() {
        this.preloadImages();
        this.bindEvents();
        this.requestTick();
    }

    getFrameUrl(index) {
        const frameNum = String(index + 1).padStart(3, '0');
        return `${this.folderPath}/${this.prefix}${frameNum}${this.extension}`;
    }

    preloadImages() {
        for (let i = 0; i < this.frameCount; i++) {
            const img = new Image();
            img.src = this.getFrameUrl(i);
            img.onload = () => {
                this.loadedCount++;
                if (this.loadedCount === 1 || i === 0) {
                    this.render(true);
                }
            };
            img.onerror = () => {
                img.failed = true;
            };
            this.images.push(img);
        }
    }

    bindEvents() {
        window.addEventListener('scroll', () => this.onScroll(), { passive: true });
        window.addEventListener('resize', () => this.onResize(), { passive: true });
        this.onResize();
        this.onScroll();
    }

    onScroll() {
        let clampedProgress = 0;

        if (this.isFullPage) {
            const totalScrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            clampedProgress = Math.max(0, Math.min(1, window.scrollY / totalScrollable));
        } else if (this.section) {
            const rect = this.section.getBoundingClientRect();
            const totalScrollable = this.section.clientHeight - window.innerHeight;
            if (totalScrollable > 0) {
                const scrolled = -rect.top;
                clampedProgress = Math.max(0, Math.min(1, scrolled / totalScrollable));
            }
        }

        this.targetFrame = Math.min(this.frameCount - 1, Math.max(0, Math.floor(clampedProgress * (this.frameCount - 1))));

        if (this.progressText) {
            this.progressText.textContent = `${Math.round(clampedProgress * 100)}% Scroll`;
        }

        if (!this.isRunning) {
            this.requestTick();
        }
    }

    onResize() {
        if (!this.canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        
        let width = window.innerWidth;
        let height = window.innerHeight;

        if (!this.isFullPage && this.canvas.parentElement) {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            width = rect.width || width;
            height = rect.height || height;
        }

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        
        this.render(true);
    }

    requestTick() {
        this.isRunning = true;
        requestAnimationFrame(() => this.update());
    }

    update() {
        const delta = this.targetFrame - this.currentFrame;
        
        if (Math.abs(delta) > 0.001) {
            this.currentFrame += delta * this.lerpFactor;
            this.render();
            requestAnimationFrame(() => this.update());
        } else {
            this.currentFrame = this.targetFrame;
            this.render();
            this.isRunning = false;
        }
    }

    render(force = false) {
        const frameIndex = Math.round(this.currentFrame);
        
        if (!force && frameIndex === this.lastRenderedFrame) {
            return;
        }

        this.lastRenderedFrame = frameIndex;

        let img = this.images[frameIndex];
        if (!img || !img.complete || img.failed) {
            for (let offset = 1; offset < this.frameCount; offset++) {
                if (frameIndex - offset >= 0 && this.images[frameIndex - offset] && this.images[frameIndex - offset].complete && !this.images[frameIndex - offset].failed) {
                    img = this.images[frameIndex - offset];
                    break;
                }
                if (frameIndex + offset < this.frameCount && this.images[frameIndex + offset] && this.images[frameIndex + offset].complete && !this.images[frameIndex + offset].failed) {
                    img = this.images[frameIndex + offset];
                    break;
                }
            }
        }

        if (img && img.complete && !img.failed) {
            this.drawCoverImage(img);
        }

        if (this.frameDisplay) {
            this.frameDisplay.textContent = `Frame ${frameIndex + 1} / ${this.frameCount}`;
        }

        if (this.captionsSelector) {
            this.updateCaptions(frameIndex + 1);
        }
    }

    drawCoverImage(img) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const displayWidth = this.canvas.width / dpr;
        const displayHeight = this.canvas.height / dpr;

        this.ctx.save();
        this.ctx.scale(dpr, dpr);
        
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        const imgWidth = img.naturalWidth || img.width;
        const imgHeight = img.naturalHeight || img.height;

        if (imgWidth === 0 || imgHeight === 0) {
            this.ctx.restore();
            return;
        }

        const canvasAspect = displayWidth / displayHeight;
        const imgAspect = imgWidth / imgHeight;

        let renderWidth, renderHeight, x, y;

        if (canvasAspect > imgAspect) {
            renderWidth = displayWidth;
            renderHeight = displayWidth / imgAspect;
            x = 0;
            y = (displayHeight - renderHeight) / 2;
        } else {
            renderHeight = displayHeight;
            renderWidth = displayHeight * imgAspect;
            x = (displayWidth - renderWidth) / 2;
            y = 0;
        }

        this.ctx.clearRect(0, 0, displayWidth, displayHeight);
        this.ctx.drawImage(img, x, y, renderWidth, renderHeight);
        this.ctx.restore();
    }

    updateCaptions(currentFrameNum) {
        const captions = document.querySelectorAll(this.captionsSelector);
        captions.forEach(el => {
            const start = parseInt(el.getAttribute('data-frame-start') || '0', 10);
            const end = parseInt(el.getAttribute('data-frame-end') || '240', 10);

            if (currentFrameNum >= start && currentFrameNum <= end) {
                el.classList.remove('hidden');
                requestAnimationFrame(() => {
                    el.classList.remove('opacity-0', 'translate-y-4');
                    el.classList.add('opacity-100', 'translate-y-0');
                });
            } else {
                el.classList.remove('opacity-100', 'translate-y-0');
                el.classList.add('opacity-0', 'translate-y-4');
                setTimeout(() => {
                    if (currentFrameNum < start || currentFrameNum > end) {
                        el.classList.add('hidden');
                    }
                }, 400);
            }
        });
    }
}

// Auto-initialize full-page background or section sequences on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // 1. Full Page Background Animation Canvas (if present on index.html, about.html, contact.html)
    if (document.getElementById('bg-sequence-canvas')) {
        window.bgSequence = new ScrollSequence({
            canvasId: 'bg-sequence-canvas',
            frameCount: 240,
            lerpFactor: 0.08
        });
    }

    // 2. Section Specific Canvases
    if (document.getElementById('sequence-canvas')) {
        window.mainSequence = new ScrollSequence({
            sectionId: 'sequence-section',
            canvasId: 'sequence-canvas',
            progressTextId: 'scroll-progress-text',
            frameDisplayId: 'frame-counter-display',
            captionsSelector: '.seq-caption',
            frameCount: 240,
            lerpFactor: 0.08
        });
    }

    if (document.getElementById('about-sequence-canvas')) {
        window.aboutSequence = new ScrollSequence({
            sectionId: 'about-sequence-section',
            canvasId: 'about-sequence-canvas',
            progressTextId: 'about-scroll-progress-text',
            frameDisplayId: 'about-frame-counter',
            captionsSelector: '.about-seq-caption',
            frameCount: 240,
            lerpFactor: 0.08
        });
    }

    // 3. Rewards Page Background Coin Falling Sequence
    if (document.getElementById('rewards-bg-canvas')) {
        window.rewardsBgSequence = new ScrollSequence({
            canvasId: 'rewards-bg-canvas',
            folderPath: 'Coin_falling_in_slow_motion_202608072043_frames/Coin_falling_in_slow_motion_202608072043_frames',
            prefix: 'frame_',
            frameCount: 103,
            lerpFactor: 0.08
        });
    }

    // 4. Dashboard, Cosmetic & Food Review Background Sequence
    if (document.getElementById('ezgif-bg-canvas')) {
        window.ezgifBgSequence = new ScrollSequence({
            canvasId: 'ezgif-bg-canvas',
            folderPath: 'ezgif-7fe2327c752df20e-jpg',
            prefix: 'ezgif-frame-',
            frameCount: 300,
            lerpFactor: 0.08
        });
    }
});
