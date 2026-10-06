
let streak = Number(localStorage.getItem("streak")) || 0;

let lastStudyDate =
  localStorage.getItem("lastStudyDate");

let savedSubject =
  localStorage.getItem("subject") || "";

let studyHistory =
  JSON.parse(localStorage.getItem("studyHistory")) || [];


const streakDisplay =
  document.getElementById("streak");

const completeBtn =
  document.getElementById("completeBtn");

const resetBtn =
  document.getElementById("resetBtn");

const message =
  document.getElementById("message");

const subject =
  document.getElementById("subject");

const historyList =
  document.getElementById("historyList");


// Show saved data
streakDisplay.textContent = streak;
subject.value = savedSubject;


// Display history
function displayHistory() {

  historyList.innerHTML = "";

  if (studyHistory.length === 0) {

    const li = document.createElement("li");

    li.textContent = "No study sessions yet.";

    historyList.appendChild(li);

    return;
  }


  studyHistory.forEach(function (day) {

    const li = document.createElement("li");

    li.textContent =
      "✅ " + day.date + " - " + day.subject;

    historyList.appendChild(li);

  });
}


// Show history when page opens
displayHistory();


// Complete study
completeBtn.addEventListener("click", function () {

  const today =
    new Date().toDateString();


  // Check subject
  if (subject.value === "") {

    message.textContent =
      "Please select a subject first.";

    return;
  }


  // Check today's study
  if (lastStudyDate === today) {

    message.textContent =
      "You already completed today's study! ✅";

    return;
  }


  // Increase streak
  streak++;

  lastStudyDate = today;

  savedSubject = subject.value;


  // Add history
  studyHistory.push({

    date: today,

    subject: savedSubject

  });


  // Save data
  localStorage.setItem(
    "streak",
    streak
  );

  localStorage.setItem(
    "lastStudyDate",
    lastStudyDate
  );

  localStorage.setItem(
    "subject",
    savedSubject
  );

  localStorage.setItem(
    "studyHistory",
    JSON.stringify(studyHistory)
  );


  // Update screen
  streakDisplay.textContent =
    streak;

  message.textContent =
    savedSubject +
    " study completed! 🔥";


  displayHistory();

});


// Reset
resetBtn.addEventListener("click", function () {

  streak = 0;

  lastStudyDate = null;

  savedSubject = "";

  studyHistory = [];


  localStorage.removeItem("streak");

  localStorage.removeItem(
    "lastStudyDate"
  );

  localStorage.removeItem(
    "subject"
  );

  localStorage.removeItem(
    "studyHistory"
  );


  streakDisplay.textContent = 0;

  subject.value = "";

  message.textContent =
    "Streak reset.";


  displayHistory();

});