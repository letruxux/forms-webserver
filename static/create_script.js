"use strict";
const placeholders = [
    "kids playing fortnite?",
    "percentage of people with smol pp?",
    "things to do with sticc?",
    "where to find panties?",
    "where to watch roblox r34?",
    "why do cats hate water?",
    "best place to hide a body?",
    "how to become a potato?",
    "why is the sky blue?",
    "can you milk a giraffe?",
    "is the earth flat?",
    "why do we dream?",
    "can you die in a dream?",
    "how to make friends with a cat?",
    "why do we yawn?",
    "how to survive a zombie apocalypse?",
    "why do dogs bark at strangers?",
    "can you live without a brain?",
    "how to stop procrastinating?",
    "how to grow a money tree?",
    "why do we hiccup?",
    "is time travel possible?",
    "can you sneeze with your eyes open?",
    "how to train your pet rock?",
    "why do we laugh?",
    "can you cry underwater?",
    "how to become a ninja?",
    "why do we get goosebumps?",
    "can you swallow your tongue?",
    "what happens when we die?",
    "why do we have dreams?",
    "can animals speak human languages?",
    "how does the internet work?",
    "why do we need sleep?",
    "is there life on other planets?",
    "how do birds migrate?",
    "why do leaves change color in fall?",
    "can you travel faster than light?",
    "how does the human brain work?",
    "why do we have emotions?",
    "can you touch the sky?",
    "why do we have seasons?",
    "how do airplanes fly?",
    "can you hear in space?",
    "why do we experience déjà vu?",
    "how do vaccines work?",
    "why do we blush?",
    "can you taste without your tongue?",
    "how do plants grow?",
    "why do we get hiccups?",
    "is there a cure for the common cold?",
    "can you see without light?",
    "how do computers work?",
];

// Get references to the elements
const newQuestionButton = document.getElementById("newQuestionButton");
const newQuestionsContainer = document.getElementById("newQuestionsContainer");
const form = document.getElementById("form");
const formNameInput = document.getElementById("formName");
const webhookUrlInput = document.getElementById("discordWebhook");
const requiresAuthInput = document.getElementById("requiresAuth");

function getRandomPlaceholder() {
    const randomIndex = Math.floor(Math.random() * placeholders.length); // Generate a random index
    const randomPlaceholder = placeholders[randomIndex]; // Get a random placeholder from the array
    return randomPlaceholder;
}

function checkDiscordWebhook(webhookURL) {
    return fetch(webhookURL, {
        method: "HEAD",
    })
        .then((response) => {
            if (!response.ok) {
                return false;
            }
            return true;
        })
        .catch(() => false);
}

function addNewQuestion() {
    // Create a container div to hold both the input and delete button
    const container = document.createElement("div");
    container.style.display = "flex"; // Set display property to flex for side-by-side layout
    container.style.alignItems = "center"; // Align items vertically in the center

    // Create a question input field
    const questionInput = document.createElement("input");
    questionInput.setAttribute("type", "text");
    questionInput.setAttribute("class", "question");
    questionInput.required = true;
    questionInput.setAttribute("placeholder", getRandomPlaceholder());
    questionInput.style.marginRight = "10px"; // Add margin to separate input and button
    questionInput.style.verticalAlign = "top"; // Align input to the top of the container

    // Create a delete button with red background and x icon
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.style.marginTop = "0px";
    deleteButton.style.marginBottom = "10px";
    deleteButton.classList.add("delete-button"); // Add a class to the delete button
    deleteButton.innerHTML = '<i class="fas fa-times"></i>'; // Set button content to "x" for delete icon

    // Event listener to remove the container div when the delete button is clicked
    deleteButton.addEventListener("click", function () {
        container.remove();
    });

    // Append the input and delete button to the container div
    container.appendChild(questionInput);
    container.appendChild(deleteButton);

    // Append the container div to the newQuestionsContainer immediately
    newQuestionsContainer.appendChild(container);
}

// Event listener for the "Add New Question" button
newQuestionButton.addEventListener("click", function () {
    addNewQuestion();
});

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const requiresAuth = requiresAuthInput.checked;
    const formName = formNameInput.value.trim();
    const wh = webhookUrlInput.value.trim();
    const questions = Array.from(document.querySelectorAll(".question")).map(
        (questionInput) => questionInput.value
    );

    if (questions.length > 25) {
        alert("You can't have more than 25 questions.");
        return;
    }

    if (questions.length < 1) {
        alert("You need at least one question.");
        return;
    }

    if (!questions.every((question) => question.trim() !== "")) {
        alert("Field(s) empty!");
        return;
    }

    try {
        const isValidWebhook = await checkDiscordWebhook(wh);

        if (!isValidWebhook) {
            alert("Invalid webhook URL");
            return;
        }
    } catch (error) {
        console.error("Error checking webhook:", error);
        alert("Error checking webhook. Please try again later.");
        return;
    }

    console.log(
        `The form "${formName}" has the following questions (${
            questions.length
        }): ${questions.join(", ")}`
    );
    const formData = {
        form_name: formName,
        questions: questions,
        webhook_url: wh,
        requires_auth: requiresAuth,
    };

    try {
        const response = await fetch("/api/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Success:", data);
            alert(`Form published successfully! Form ID: ${data.form_id}`);
            window.location.replace(`/view?form=${data.form_id}`);
        } else {
            const errorData = await response.json();
            console.error("Error:", errorData.error);
            alert(`Form submission failed. ${errorData.message}`);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Form submission failed. Please try again later.");
    }
});
