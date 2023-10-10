document.addEventListener("DOMContentLoaded", async function () {
    try {
        const response = await fetch("/api/list", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            const formData = await response.json();
            const formsList = document.getElementById("formsList");

            formData.forEach((form) => {
                const formId = form.id;
                const formName = form.form_name;
                const listItem = document.createElement("li");
                listItem.classList.add("form-item");

                // Create an element for form name
                const formNameDiv = document.createElement("div");
                formNameDiv.classList.add("form-name");
                const formNameLink = document.createElement("a"); // Create anchor element
                formNameLink.classList.add("black-text");
                formNameLink.href = `/view?form=${form.id}`; // Set the href attribute
                formNameLink.textContent = form.form_name; // Set the text content
                formNameLink.style.textDecoration = "none"; // Remove underline (optional)
                formNameDiv.appendChild(formNameLink); // Append the anchor to the form name div
                formNameDiv.style.marginRight = "10px"; // Add margin-right
                listItem.appendChild(formNameDiv);

                // Create an element for form ID
                const formIdDiv = document.createElement("div");
                formIdDiv.classList.add("form-id");
                formIdDiv.textContent = form.id; // Keep "ID:" text for clarity
                listItem.appendChild(formIdDiv);

                // Create delete button
                const deleteButton = document.createElement("button");
                deleteButton.classList.add("delete-button");
                deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
                deleteButton.style.marginTop = "0px";
                deleteButton.addEventListener("click", async function () {
                    if (
                        confirm(
                            `Are you sure you want to delete the form "${formName}" with ID ${formId}?`
                        )
                    ) {
                        try {
                            const deleteResponse = await fetch("/api/delete", {
                                method: "DELETE",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ form: formId }),
                            });

                            if (deleteResponse.ok) {
                                // Remove the list item after successful deletion
                                listItem.remove();
                            } else {
                                alert(
                                    "Form deletion failed. Please try again later."
                                );
                            }
                        } catch (error) {
                            console.error("Error deleting form:", error);
                            alert(
                                "Form deletion failed. Please try again later."
                            );
                        }
                    }
                });

                // Add delete button to the list item
                listItem.appendChild(deleteButton);

                formsList.appendChild(listItem);
            });
        } else {
            alert("Failed to fetch form data. Please try again later.");
        }
    } catch (error) {
        console.error("Error fetching form data:", error);
        alert("Failed to fetch form data. Please try again later.");
    }
});
