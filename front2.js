document.addEventListener("DOMContentLoaded", function () {
    // Splash Screen Elements
    const splashScreen = document.getElementById('splashScreen');
    const headerContent = document.getElementById('headerContent');
    const mainContent = document.getElementById('mainContent');
    const mainSections = document.getElementById('mainSections');

    // Voice-to-Text Elements
    const micButton = document.getElementById("micButton");
    const textArea = document.querySelector(".chatbox .input textarea");
    const messagesContainer = document.getElementById("messagesContainer");  //Get the message
    const sendButton = document.querySelector(".chatbox .input button");

    // Speech Recognition setup (if applicable - remove if not used)
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isListening = false;

    if (window.SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.interimResults = false;
        recognition.continuous = false;
        recognition.lang = "en-US";

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
            textArea.value = finalTranscript.trim(); // Set the value directly
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
                textArea.value = ""; // Clear the input
                recognition.start();
            } else {
                recognition.stop();
            }
        });

    } else {
        console.warn("Speech recognition not supported in this browser.");
        micButton.style.display = "none"; // Hide the button if no support
    }

      //Autogrow for textbox
        textArea.addEventListener('input', function () {  // on typing
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });


    // Send message and interact with backend API
    sendButton.addEventListener("click", function () {
        const userMessage = textArea.value;

        if (userMessage.trim() !== "") {
            const userMessageDiv = addUserMessage(userMessage);  // Display user message Store user message element

            //Creating loading indicator element dynamically
            const loadingIndicator = createLoadingIndicator();  // Creating a three dots loading function
            messagesContainer.prepend(loadingIndicator); //Add that to container, so we can fix the loader.

            // Send the message to the Ollama backend
            fetch("http://localhost:5000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: userMessage }),
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    if (data.error) {
                        console.error("Backend Error:", data.error);
                        const botMessageDiv = addBotMessage("Error: " + data.error);
                         messagesContainer.removeChild(loadingIndicator);  //Remove loader on fail
                    } else {
                        const botResponse = data.response;
                        const botMessageDiv = addBotMessage(botResponse);
                         messagesContainer.removeChild(loadingIndicator);  //Remove loader

                    }
                })
                .catch((error) => {
                    console.error("Fetch Error:", error);
                    const botMessageDiv = addBotMessage("Sorry, I couldn't reach the server.");
                       messagesContainer.removeChild(loadingIndicator);  //Remove loader

                })
                .finally(() => {  // We wont set the height to inital as
                 textArea.style.height = '40px';   //set to initial height so it wont stay expanded.
                });

            textArea.value = ""; // Clear the input field
        }
    });


    // Helper functions for UI
    function addUserMessage(message) {
        const userMessageDiv = document.createElement("div");
        userMessageDiv.classList.add("message", "user");
        userMessageDiv.innerHTML = `<div class="text">${message}</div><div class="avatar"></div>`;
        messagesContainer.prepend(userMessageDiv);  // Append to the STARTING
        messagesContainer.scrollTop = 0;  // Scroll to top, so that newest message is displayed
        return userMessageDiv;   // We returning the div

    }

    function addBotMessage(message) {
        const botMessageDiv = document.createElement("div");
        botMessageDiv.classList.add("message", "bot");
        botMessageDiv.innerHTML = `<div class="avatar"></div><div class="text">${message}</div>`;
        messagesContainer.prepend(botMessageDiv); // Append to the STARTING
        messagesContainer.scrollTop = 0;  // Scroll to top, so that newest message is displayed
        return botMessageDiv;      // We returning the div
    }
      //Function that creates loading indicator
     function createLoadingIndicator(){
            const loadingIndicator = document.createElement("div");
            loadingIndicator.classList.add("loading-indicator");
            loadingIndicator.innerHTML = `
                 <span></span>
                 <span></span>
                 <span></span>
            `;
            return loadingIndicator;
     }


    //Functions to handle hide and show loading - we dont need these anymore.
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
