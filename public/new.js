document.querySelector("#newQ").addEventListener("click", () => {
  const questions = document.querySelectorAll(".questions");
  const input = document.createElement("input");
  input.setAttribute("name", `questions`);
  input.setAttribute("placeholder", `Question ${questions.length + 1}`);
  input.setAttribute("required", "");
  const li = document.createElement("li");
  li.setAttribute("class", "questions");
  li.append(input);
  document.querySelector(".questions-list").append(li);
  console.log(questions);
});

document.querySelector("#removeQ").addEventListener("click", () => {
  const questions = document.querySelectorAll(".questions");
  questions[questions.length - 1].remove();
});
