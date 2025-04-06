document.addEventListener("DOMContentLoaded", async function () {
    const splashScreen = document.getElementById('splashScreen');
    const headerContent = document.getElementById('headerContent');
    const mainContent = document.getElementById('mainContent');
    const mainSections = document.getElementById('mainSections');

    const chatbox = document.querySelector(".chatbox");
    const inputContainer = document.querySelector(".chatbox .input");
    const inputField = document.querySelector(".chatbox .input input");
    const sendButton = document.querySelector(".chatbox .input button");

    const micButton = document.getElementById("micButton");
    const micIcon = document.querySelector(".mic-icon");

    const googleLoginButton = document.getElementById('google-login-btn');
    const userProfile = document.getElementById('user-profile');
    const userGreeting = document.getElementById('user-greeting');
    const logoutButton = document.getElementById('logout-btn');
    const loginButtons = document.getElementById('login-buttons');

    let auth;
    try {
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js");
        const { getAuth, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js");
        const { getAnalytics } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js");

        const firebaseConfig = {
            apiKey: "AIzaSyCuzG5Xx9wXbecaaYk9UwBaZAw3YyawbUY",
            authDomain: "justindiauth.firebaseapp.com",
            projectId: "justindiauth",
            storageBucket: "justindiauth.firebaseapp.com",
            messagingSenderId: "807997624460",
            appId: "1:807997624460:web:526326bbc77fdbbc9a2ba9",
            measurementId: "G-59PYTNS2ZP"
        };

        const app = initializeApp(firebaseConfig);
        const analytics = getAnalytics(app);
        auth = getAuth(app);
        const provider = new GoogleAuthProvider();

        if (auth) {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    showAuthenticatedUI(user);
                } else {
                    showUnauthenticatedUI();
                }
            });
        }

        if (googleLoginButton) {
            googleLoginButton.addEventListener('click', function () {
                signInWithPopup(auth, provider)
                    .then((result) => {
                        const user = result.user;
                        console.log("Google login successful", user.displayName);
                    })
                    .catch((error) => {
                        console.error("Google login error:", error);
                        alert(`Login failed: ${error.message}`);
                    });
            });
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', function () {
                signOut(auth).then(() => {
                    console.log("Logout successful");
                }).catch((error) => {
                    console.error("Logout error:", error);
                });
            });
        }

    } catch (error) {
        console.error("Firebase initialization error:", error);
    }

    function showAuthenticatedUI(user) {
        const firstName = user.displayName ? user.displayName.split(' ')[0] : "User";
        userGreeting.textContent = `Hi, ${firstName}`;
        userProfile.style.display = 'flex';
        loginButtons.style.display = 'none';
    }

    function showUnauthenticatedUI() {
        userProfile.style.display = 'none';
        loginButtons.style.display = 'flex';
    }

    function linkifyDocument(text) {
        const fileRegex = /Here is your document: ([\w\-]+\.(pdf|docx|txt|png|jpg|jpeg))/i;
        return text.replace(fileRegex, (_, filename) => {
            return `Here is your document: <a href="/documents/${filename}" target="_blank" download>${filename}</a>`;
        });
    }

    function appendMessage(sender, text) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", sender);

        const avatarDiv = document.createElement("div");
        avatarDiv.classList.add("avatar");

        const textDiv = document.createElement("div");
        textDiv.classList.add("text");
        textDiv.textContent = text;

        // Handle overflow
        textDiv.style.overflowWrap = 'break-word';
        textDiv.style.whiteSpace = 'pre-wrap';
        textDiv.style.maxWidth = '80%';

        if (sender === "bot") {
            messageDiv.appendChild(avatarDiv);
            messageDiv.appendChild(textDiv);
        } else {
            messageDiv.appendChild(textDiv);
            messageDiv.appendChild(avatarDiv);
        }

        chatbox.insertBefore(messageDiv, inputContainer);
        chatbox.scrollTop = chatbox.scrollHeight;
    }

    function addBotMessage(messageHTML) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'bot');

        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('avatar');

        const textDiv = document.createElement('div');
        textDiv.classList.add('text');
        textDiv.innerHTML = messageHTML;

        textDiv.style.overflowWrap = 'break-word';
        textDiv.style.whiteSpace = 'pre-wrap';
        textDiv.style.maxWidth = '80%';

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(textDiv);

        chatbox.insertBefore(messageDiv, inputContainer);
        chatbox.scrollTop = chatbox.scrollHeight;
    }

    function getBotResponse(userInput) {
        return fetch('http://127.0.0.1:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userInput }),
        })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => data.response)
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

        getBotResponse(userText).then(botResponse => {
            const linked = linkifyDocument(botResponse);
            addBotMessage(linked);
        });
    }

    sendButton?.addEventListener("click", handleUserInput);
    inputField?.addEventListener("keypress", e => {
        if (e.key === "Enter") handleUserInput();
    });

    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isListening = false;

    if (window.SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.interimResults = false;
        recognition.continuous = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
            isListening = true;
            micButton?.classList.add("listening");
            micIcon?.classList.add("listening");
        };

        recognition.onresult = event => {
            let finalTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            inputField.value += finalTranscript.trim() + " ";
        };

        recognition.onerror = event => console.error("Speech Recognition Error:", event.error);
        recognition.onend = () => {
            isListening = false;
            micButton?.classList.remove("listening");
            micIcon?.classList.remove("listening");
        };

        micButton?.addEventListener("click", () => {
            isListening ? recognition.stop() : recognition.start();
        });
        micIcon?.addEventListener("click", () => {
            isListening ? recognition.stop() : recognition.start();
        });
    } else {
        micButton?.style.setProperty("display", "none");
        micIcon?.style.setProperty("display", "none");
        console.log("Speech recognition not supported in this browser");
    }

    // Animation Observer
    const featureBoxes = document.querySelectorAll('.feature-box');
    const containers = document.querySelectorAll('.container');

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('hidden');
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px', threshold: 0.1 });

    featureBoxes.forEach(box => {
        box.classList.add('hidden');
        observer.observe(box);
    });

    containers.forEach(container => {
        container.classList.add('hidden');
        observer.observe(container);
    });

    // Splash Screen
    setTimeout(() => {
        splashScreen?.classList.add('hidden');
        setTimeout(() => {
            headerContent?.classList.remove('hidden');
            mainContent?.classList.remove('hidden');
            mainSections?.classList.remove('hidden');
        }, 1000);
    }, 3000);
});
