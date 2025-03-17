// splash.js

document.addEventListener('DOMContentLoaded', function() {
    const splashScreen = document.getElementById('splashScreen');
    const headerContent = document.getElementById('headerContent');
    const mainContent = document.getElementById('mainContent');
    const mainSections = document.getElementById('mainSections');

    // Delay to keep splash screen visible for a short duration (e.g., 3 seconds)
    setTimeout(() => {
        splashScreen.classList.add('hidden'); // Fade out splash screen

        // After splash screen fades out, show main content and header
        setTimeout(() => {
            headerContent.classList.remove('hidden');
            mainContent.classList.remove('hidden');
            mainSections.classList.remove('hidden');

            // Initialize Intersection Observer for animations (if you have it in front2.js)
            if (typeof initializeIntersectionObserver === 'function') {
                initializeIntersectionObserver();
            }

        }, 1000); // Delay to allow splash fade-out to complete (adjust if needed, match CSS transition duration)


    }, 3000); // 3000 milliseconds = 3 seconds
});


// (Optional) Function to initialize Intersection Observer (if you move it to splash.js or want to define it separately)
function initializeIntersectionObserver() {
    const featureBoxes = document.querySelectorAll('.feature-box');
    const containers = document.querySelectorAll('.container');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('hidden');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    featureBoxes.forEach(box => {
        box.classList.add('hidden');
        observer.observe(box);
    });

    containers.forEach(container => {
        container.classList.add('hidden');
        observer.observe(container);
    });
}