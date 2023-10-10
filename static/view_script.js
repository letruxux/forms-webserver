"use strict";

const form_data = JSON.parse(document.currentScript.getAttribute("form_data"));
const user_data = JSON.parse(document.currentScript.getAttribute("user_data"));

const formNameHeader = document.querySelector("#formName");
const questionsSection = document.querySelector("#questionSection");
const formDataForm = document.querySelector("#formDataForm"); // Reference to the form element
const submitButton = document.querySelector("#submitButton");

formNameHeader.textContent = form_data.form_name;
if (form_data.requires_auth) {
    const authNotice = document.getElementById("authNotice");
    authNotice.innerHTML = `<strong>Your discord account data</strong> (username: ${user_data.name}, id: ${user_data.id} and profile picture) <strong>will be shared with the form owner.</strong>`;
}
// Loop through each question in form_data.questions
form_data.questions.forEach((question) => {
    // Create a new div element for the question
    const questionDiv = document.createElement("div");

    // Create a new label element
    const label = document.createElement("label");
    label.textContent = question;

    // Create a new input field (assuming you want text input fields)
    const input = document.createElement("input");
    input.type = "text";
    input.required = true; // Add the required attribute to the input field

    // Set a unique identifier for the input field based on the question text
    input.id = question.replace(/\s+/g, "_"); // Replace spaces with underscores for the ID

    // Append label and input to the question div
    questionDiv.appendChild(label);
    questionDiv.appendChild(input);

    // Append the question div to the questions section
    questionsSection.appendChild(questionDiv);
});

// Event listener for the form submission
formDataForm.addEventListener("submit", function (event) {
    // Get all input fields within the question divs
    const inputFields = document.querySelectorAll("#questionSection input");
    const responses = {};

    // Loop through input fields and collect responses
    inputFields.forEach((inputField) => {
        const question = inputField.previousElementSibling.textContent;
        const answer = inputField.value;
        responses[question] = answer;
    });
    const body = { responses: responses, form_id: form_data.id };
    console.log(body);

    // Use fetch API to send data to the Discord webhook
    fetch("/api/submit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    })
        .then((response) => {
            if (!response.ok) {
                console.log(response.json());
                return alert("Submission failed. Please try again later.");
            }
            return alert("Submission sent successfully!");
        })
        .then((data) => {
            console.log("Success:", data);
            // Handle success response as needed
        })
        .catch((error) => {
            console.error("Error:", error);
            // Handle error as needed
        });

    // Prevent the default form submission behavior
    event.preventDefault();
});
