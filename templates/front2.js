document.addEventListener("DOMContentLoaded", function () {
  const chatbox = document.querySelector(".chatbox");
  const inputContainer = document.querySelector(".chatbox .input");
  const inputField = document.querySelector(".chatbox .input input");
  const sendButton = document.querySelector(".chatbox .input button");
  const micIcon = document.querySelector(".mic-icon");

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

      chatbox.insertBefore(messageDiv, inputContainer);
      chatbox.scrollTop = chatbox.scrollHeight;
  }

  function getBotResponse(userInput) {
    return fetch('http://localhost:5000/api/chat', {
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
      const userText = inputField.value.trim();
      if (!userText) return;

      appendMessage("user", userText);
      inputField.value = "";

      getBotResponse(userText).then((botResponse) => {
          appendMessage("bot", botResponse);
      });
  }

  sendButton.addEventListener("click", handleUserInput);
  inputField.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
          handleUserInput();
      }
  });

  if (micIcon) {
    micIcon.addEventListener('click', () => {
      micIcon.classList.toggle('listening');
      if (micIcon.classList.contains('listening')) {
        console.log('Website: Start listening...'); 
      } else {
        console.log('Website: Stop listening.');    
      }
      });
  }
});

document.addEventListener('DOMContentLoaded', function() { // Ensure DOM is fully loaded
    const featureBoxes = document.querySelectorAll('.feature-box');
    const observerOptions = {
        root: null, // Use viewport as root
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of the element is visible
    };

    const featureBoxObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('hidden'); // Remove 'hidden' class to trigger animation
                featureBoxObserver.unobserve(entry.target); // Stop observing once animated
            }
        });
    }, observerOptions);

    featureBoxes.forEach(box => {
        box.classList.add('hidden'); // Ensure boxes are initially hidden (redundant, but good practice)
        featureBoxObserver.observe(box); // Start observing each feature box
    });
});
