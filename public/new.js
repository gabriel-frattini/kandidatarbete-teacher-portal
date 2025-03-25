
document.querySelector("#newQ").addEventListener("click", () => {
  const questions = document.querySelectorAll(".questions");

  const input = document.createElement("input");
  input.setAttribute("name", "questions");
  input.setAttribute("placeholder", `Question ${questions.length + 1}`);
  input.setAttribute("required", "");
  input.setAttribute("readonly","true");
  input.style.color = "black";
  input.style.backgroundColor = "white";
  input.classList.add("form-control", "mb-2");




  const li = document.createElement("li");
  li.setAttribute("class", "questions");
  li.append(input);

  document.querySelector(".questions-list").append(li);

  console.log(questions);
});

document.querySelector("#removeQ").addEventListener("click", () => {
  const questions = document.querySelectorAll(".questions");
  if (questions.length > 1) {
    questions[questions.length - 1].remove();
  }
});
