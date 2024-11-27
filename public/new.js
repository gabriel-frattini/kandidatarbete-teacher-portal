document.querySelector("#newQ").addEventListener("click", () => {
  const questions = document.querySelectorAll(".question");
  const input = document.createElement("input");
  input.setAttribute("name", `question`);
  input.setAttribute("placeholder", `Question ${questions.length + 1}`);
  input.setAttribute("required", "");
  const li = document.createElement("li");
  li.setAttribute("class", "question");
  li.append(input);
  document.querySelector(".questions").append(li);
  console.log(questions);
});

document.querySelector("#removeQ").addEventListener("click", () => {
  const questions = document.querySelectorAll(".question");
  questions[questions.length - 1].remove();
});
