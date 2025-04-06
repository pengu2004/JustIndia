document.addEventListener("DOMContentLoaded", async function () {
    // Splash Screen Elements
    const splashScreen = document.getElementById('splashScreen');
    const headerContent = document.getElementById('headerContent');
    const mainContent = document.getElementById('mainContent');
    const mainSections = document.getElementById('mainSections');

    // Chat UI Elements
    const chatbox = document.querySelector(".chatbox");
    const inputContainer = document.querySelector(".chatbox .input");
    const inputField = document.querySelector(".chatbox .input input");
    const sendButton = document.querySelector(".chatbox .input button");
    
    // Voice-to-Text Elements
    const micButton = document.getElementById("micButton");
    const micIcon = document.querySelector(".mic-icon");
    
    // Authentication UI Elements
    const googleLoginButton = document.getElementById('google-login-btn');
    const userProfile = document.getElementById('user-profile');
    const userGreeting = document.getElementById('user-greeting');
    const logoutButton = document.getElementById('logout-btn');
    const loginButtons = document.getElementById('login-buttons');

    // Initialize Firebase modules
    let auth;
    try {
        // Import Firebase modules
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js");
        const { getAuth, signOut, onAuthStateChanged, 
                GoogleAuthProvider, signInWithPopup } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js");
        const { getAnalytics } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js");
        
        // Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyCuzG5Xx9wXbecaaYk9UwBaZAw3YyawbUY",
            authDomain: "justindiauth.firebaseapp.com",
            projectId: "justindiauth",
            storageBucket: "justindiauth.firebasestorage.app",
            messagingSenderId: "807997624460",
            appId: "1:807997624460:web:526326bbc77fdbbc9a2ba9",
            measurementId: "G-59PYTNS2ZP"
        };
        
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const analytics = getAnalytics(app);
        auth = getAuth(app);
        const provider = new GoogleAuthProvider();
        
        // Set up auth state listener
        if (auth) {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    // User is signed in
                    showAuthenticatedUI(user);
                    console.log("User logged in:", user.displayName || user.email);
                } else {
                    // User is signed out
                    showUnauthenticatedUI();
                    console.log("User logged out");
                }
            });
        }
        
        // Handle Google login
        if (googleLoginButton) {
            googleLoginButton.addEventListener('click', function() {
                console.log("Google login button clicked");
                signInWithPopup(auth, provider)
                    .then((result) => {
                        // Google Sign In successful
                        const user = result.user;
                        console.log("Google login successful", user.displayName);
                    })
                    .catch((error) => {
                        // Handle errors
                        console.error("Google login error:", error);
                        alert(`Login failed: ${error.message}`);
                    });
            });
        } else {
            console.error("Google login button not found in the DOM");
        }
        
        // Handle logout
        if (logoutButton) {
            logoutButton.addEventListener('click', function() {
                signOut(auth).then(() => {
                    // Sign-out successful
                    console.log("Logout successful");
                }).catch((error) => {
                    // An error happened
                    console.error("Logout error:", error);
                });
            });
        } else {
            console.error("Logout button not found in the DOM");
        }
    
    } catch (error) {
        console.error("Firebase initialization error:", error);
        // Continue with splash screen even if Firebase fails
    }
    
    // Show UI for authenticated users
    function showAuthenticatedUI(user) {
        if (userProfile && userGreeting) {
            // Display the user's name
            const firstName = user.displayName ? user.displayName.split(' ')[0] : "User";
            userGreeting.textContent = `Hi, ${firstName}`;
            
            // Show user profile section and hide login buttons
            userProfile.style.display = 'flex';
            loginButtons.style.display = 'none';
            
            console.log("Authenticated UI shown for:", firstName);
        } else {
            console.error("User profile or greeting elements not found");
        }
    }
    
    // Show UI for unauthenticated users
    function showUnauthenticatedUI() {
        if (userProfile && loginButtons) {
            // Hide user profile section and show login buttons
            userProfile.style.display = 'none';
            loginButtons.style.display = 'flex';
            
            console.log("Unauthenticated UI shown");
        } else {
            console.error("User profile or login buttons elements not found");
        }
    }

    // Chatbox functionality
    function appendMessage(sender, text) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", sender);
        const avatarDiv = document.createElement("div");
        avatarDiv.classList.add("avatar");
        const textDiv = document.createElement("div");
        textDiv.classList.add("text");
        textDiv.textContent = text;
        
        if (sender === "bot") {
            messageDiv.appendChild(avatarDiv);
            messageDiv.appendChild(textDiv);
        } else {
            messageDiv.appendChild(textDiv);
            messageDiv.appendChild(avatarDiv);
        }
        
        if (chatbox && inputContainer) {
            chatbox.insertBefore(messageDiv, inputContainer);
            chatbox.scrollTop = chatbox.scrollHeight;
        }
    }
    
    function getBotResponse(userInput) {
        return fetch('https://nominally-vast-mite.ngrok-free.app/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userInput }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            return data.response;
        })
        .catch(error => {
            console.error('Error:', error);
            return "Sorry, I'm having trouble connecting to the server. Please try again later.";
        });
    }
    
    function handleUserInput() {
        if (!inputField) return;
        
        const userText = inputField.value.trim();
        if (!userText) return;
        
        appendMessage("user", userText);
        inputField.value = "";
        
        getBotResponse(userText).then((botResponse) => {
            appendMessage("bot", botResponse);
        });
    }
    
    if (sendButton) {
        sendButton.addEventListener("click", handleUserInput);
    }
    
    if (inputField) {
        inputField.addEventListener("keypress", function (event) {
            if (event.key === "Enter") {
                handleUserInput();
            }
        });
    }

    // Check if Speech Recognition is supported
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
            if (micButton) micButton.classList.add("listening"); 
            if (micIcon) micIcon.classList.add("listening");
        };

        recognition.onresult = function (event) {
            let finalTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }

            if (inputField) inputField.value += finalTranscript.trim() + " "; 
        };

        recognition.onerror = function (event) {
            console.error("Speech Recognition Error:", event.error);
        };

        recognition.onend = function () {
            isListening = false;
            if (micButton) micButton.classList.remove("listening"); 
            if (micIcon) micIcon.classList.remove("listening");
        };

        if (micButton) {
            micButton.addEventListener("click", function () {
                if (!isListening) {
                    recognition.start();
                } else {
                    recognition.stop();
                }
            });
        }
        
        if (micIcon) {
            micIcon.addEventListener('click', () => {
                if (!isListening) {
                    recognition.start();
                    console.log('Website: Start listening...');
                } else {
                    recognition.stop();
                    console.log('Website: Stop listening.');
                }
            });
        }
    } else {
        if (micButton) micButton.style.display = "none";
        if (micIcon) micIcon.style.display = "none";
        console.log("Speech recognition not supported in this browser");
    }

    // Feature box animations
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

    // Initialize animations for feature boxes
    if (featureBoxes.length > 0) {
        featureBoxes.forEach(box => {
            box.classList.add('hidden');
            observer.observe(box);
        });
        
        console.log("Feature box animation observers initialized");
    }

    // Initialize animations for containers
    if (containers.length > 0) {
        containers.forEach(container => {
            container.classList.add('hidden');
            observer.observe(container);
        });
        
        console.log("Container animation observers initialized");
    }

    // Splash Screen Logic
    console.log("Starting splash screen animation");
    setTimeout(() => {
        if (splashScreen) {
            splashScreen.classList.add('hidden');
            console.log("Splash screen hidden");
        } else {
            console.error("Splash screen element not found");
        }

        setTimeout(() => {
            if (headerContent) {
                headerContent.classList.remove('hidden');
                console.log("Header content shown");
            }
            if (mainContent) {
                mainContent.classList.remove('hidden');
                console.log("Main content shown");
            }
            if (mainSections) {
                mainSections.classList.remove('hidden');
                console.log("Main sections shown");
            }
        }, 1000);
    }, 3000);
    
    console.log("DOMContentLoaded handler completed");
});
