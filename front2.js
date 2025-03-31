document.addEventListener("DOMContentLoaded", function () {
    // Splash Screen Elements
    const splashScreen = document.getElementById('splashScreen');
    const headerContent = document.getElementById('headerContent');
    const mainContent = document.getElementById('mainContent');
    const mainSections = document.getElementById('mainSections');

    // Voice-to-Text Elements
    const micButton = document.getElementById("micButton");
    const textArea = document.querySelector(".chatbox .input input");

    // Check if Speech Recognition is supported
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!window.SpeechRecognition) {
        alert("Your browser does not support speech recognition.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.interimResults = false; 
    recognition.continuous = false;
    recognition.lang = "en-US";

    let isListening = false;

    recognition.onstart = function () {
        isListening = true;
        micButton.classList.add("listening"); 
    };

    recognition.onresult = function (event) {
        let finalTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }

        textArea.value += finalTranscript.trim() + " "; 
    };

    recognition.onerror = function (event) {
        console.error("Speech Recognition Error:", event.error);
    };

    recognition.onend = function () {
        isListening = false;
        micButton.classList.remove("listening"); 
    };

    micButton.addEventListener("click", function () {
        if (!isListening) {
            recognition.start();
        } else {
            recognition.stop();
        }
    });

    // Splash Screen Logic
    setTimeout(() => {
        splashScreen.classList.add('hidden');

        setTimeout(() => {
            headerContent.classList.remove('hidden');
            mainContent.classList.remove('hidden');
            mainSections.classList.remove('hidden');

            // Initialize Intersection Observer for animations
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

        }, 1000);
    }, 3000);
});
