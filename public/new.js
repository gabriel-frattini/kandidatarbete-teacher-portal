document.querySelector("#newQ").addEventListener("click", () => {
  const questions = document.querySelectorAll(".questions");

  const input = document.createElement("input");
  input.setAttribute("name", "questions");
  input.setAttribute("placeholder", `Question ${questions.length + 1}`);
  input.setAttribute("required", "");
  input.classList.add("form-control", "col");

    const select = document.createElement("select");
    select.setAttribute("name", "types");
    select.setAttribute("required", "");
    select.classList.add("form-select", "col");
    select.style.maxWidth = "fit-content";
    const option1 = document.createElement("option");
    option1.setAttribute("selected", "");
    option1.append("Type of Question");
    const option2 = document.createElement("option");
    option2.setAttribute("value", "draw");
    option2.append("Draw");
    const option3 = document.createElement("option");
    option3.setAttribute("value", "text");
    option3.append("Text");
    select.append(option1, option2, option3);


  const li = document.createElement("li");
  li.classList.add("questions", "row");
  li.append(input);
  li.append(select);

  document.querySelector(".questions-list").append(li);

  console.log(questions);
});

document.querySelector("#removeQ").addEventListener("click", () => {
  const questions = document.querySelectorAll(".questions");
  if (questions.length > 1) {
    questions[questions.length - 1].remove();
  }
});
