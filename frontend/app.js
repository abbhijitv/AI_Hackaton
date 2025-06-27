let proctoringEnabled = false;
let acknowledged = false;
let currentSpeech;
let isChatOpen = false;

// Chatbot Questions
const questions = [
  "What is a GPU?",
  "Why use Python for data science?",
  "What is overfitting?",
  "Explain neural networks.",
  "What is reinforcement learning?"
];

// Elements
const video = document.getElementById('proctor-video');
const statusDiv = document.getElementById('proctor-status');
const startActivitiesBtn = document.getElementById('start-activities-btn');
const warpActivities = document.getElementById('warp-activities');

// === Webcam Control ===
async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.style.display = 'block';
    video.play();
  } catch (err) {
    console.error("Camera access error:", err);
    alert("Cannot access webcam. Please allow camera permissions.");
  }
}

function stopWebcam() {
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
  video.style.display = 'none';
}

// === Proctoring & Acknowledgement ===
function toggleProctoring() {
  if (!proctoringEnabled) {
    if (!acknowledged) {
      openAckModal();
      return;
    }
    proctoringEnabled = true;
    document.getElementById('proctor-btn').innerText = "Disable Proctoring";
    startWebcam();            // start webcam when enabling proctoring
    showStartActivitiesButton();
  } else {
    proctoringEnabled = false;
    acknowledged = false;
    document.getElementById('proctor-btn').innerText = "Enable Proctoring";
    stopWebcam();             // stop webcam when disabling proctoring
    hideStartActivitiesButton();
    warpActivities.style.display = 'none';
  }
}

function openAckModal() {
  document.getElementById('ack-modal').style.display = 'flex';
}

function closeAckModal() {
  document.getElementById('ack-modal').style.display = 'none';
}

document.getElementById('ack-agree-btn').addEventListener('click', () => {
  acknowledged = true;
  closeAckModal();
  proctoringEnabled = true;
  document.getElementById('proctor-btn').innerText = "Disable Proctoring";
  startWebcam();
  showStartActivitiesButton();
});

// Show start activities button after agreeing
function showStartActivitiesButton() {
  document.getElementById('start-activities-container').style.display = 'block';
}

function hideStartActivitiesButton() {
  document.getElementById('start-activities-container').style.display = 'none';
}

// === Chatbot toggle ===
function toggleChat() {
  isChatOpen = !isChatOpen;
  const chatbot = document.getElementById("chatbot");
  chatbot.style.display = isChatOpen ? "flex" : "none";

  if (isChatOpen) showQuestionOptions();
}

// === Speech & Chatbot Functions ===
function speak(text) {
  if (currentSpeech) {
    speechSynthesis.cancel();
  }
  const msg = new SpeechSynthesisUtterance(text);
  msg.onend = () => {
    currentSpeech = null;
  };
  speechSynthesis.speak(msg);
  currentSpeech = msg;
}

function addMessage(text, sender) {
  const log = document.getElementById("chat-log");
  const msg = document.createElement("div");
  msg.className = `chat-message ${sender}`;
  msg.innerText = text;
  log.appendChild(msg);
  log.scrollTop = log.scrollHeight;
}

function showQuestionOptions() {
  const container = document.getElementById("question-options");
  container.innerHTML = questions
    .map((q, i) => `<button onclick="askQuestion(${i})">${q}</button>`)
    .join("<br>");
  document.getElementById("next-step").innerHTML = "";
}

function askQuestion(index) {
  if (currentSpeech) {
    speechSynthesis.cancel();
    currentSpeech = null;
  }

  const question = questions[index];
  addMessage(question, "user");

  fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  })
    .then(res => res.json())
    .then(data => {
      addMessage(data.answer, "bot");
      speak(data.answer);
      showNextStep();
    });
}

function showNextStep() {
  const nextStepDiv = document.getElementById("next-step");
  nextStepDiv.innerHTML = `
    <p>Anything else?</p>
    <button onclick="showQuestionOptions()">Ask another question</button>
    <button onclick="sayGoodbye()">I am done</button>
  `;

  document.getElementById("question-options").innerHTML = "";
}

function sayGoodbye() {
  if (currentSpeech) {
    speechSynthesis.cancel();
    currentSpeech = null;
  }
  const container = document.getElementById("question-options");
  const nextStepDiv = document.getElementById("next-step");
  const message = "Thank you for using AI support!";
  addMessage(message, "bot");
  speak(message);
  container.innerHTML = "";
  nextStepDiv.innerHTML = `<button onclick="showQuestionOptions()">More questions</button>`;
}

// Initially hide chatbot and video/status
document.getElementById("chatbot").style.display = "none";
video.style.display = "none";
statusDiv.style.display = "none";

// === CPU vs GPU Quiz ===
const quizQuestions = [
  {
    question: "Rendering complex 3D graphics for a video game.",
    correct: "GPU",
    explanation: "GPUs excel at parallel processing, making them ideal for rendering graphics efficiently."
  },
  {
    question: "Running your operating system and handling daily tasks.",
    correct: "CPU",
    explanation: "CPUs handle general-purpose computing and sequential tasks, perfect for OS operations."
  },
  {
    question: "Training a deep learning neural network on a large dataset.",
    correct: "GPU",
    explanation: "GPUs accelerate training by performing many operations simultaneously."
  },
  {
    question: "Compiling source code for software development.",
    correct: "CPU",
    explanation: "Compilation involves complex logic and sequential operations, which CPUs handle well."
  },
  {
    question: "Performing complex scientific simulations that require massive parallel computations.",
    correct: "GPU",
    explanation: "GPUs can run thousands of threads concurrently, speeding up simulations."
  }
];

let currentQuizIndex = 0;

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const feedbackDiv = document.getElementById('feedback');
const nextQuestionBtn = document.getElementById('next-question-btn');

function loadQuizQuestion() {
  const q = quizQuestions[currentQuizIndex];
  questionText.textContent = q.question;
  feedbackDiv.textContent = '';
  feedbackDiv.style.color = 'black';
  nextQuestionBtn.style.display = 'none';

  optionsContainer.innerHTML = `
    <button onclick="submitAnswer('CPU')">CPU</button>
    <button onclick="submitAnswer('GPU')">GPU</button>
  `;
}

function submitAnswer(selected) {
  const q = quizQuestions[currentQuizIndex];
  if (selected === q.correct) {
    feedbackDiv.style.color = 'green';
    feedbackDiv.innerHTML = `🎉 Correct! ${q.explanation}`;
  } else {
    feedbackDiv.style.color = 'red';
    feedbackDiv.innerHTML = `❌ Incorrect. The right answer is <strong>${q.correct}</strong>. ${q.explanation}`;
  }
  // Disable buttons after answer
  [...optionsContainer.children].forEach(btn => btn.disabled = true);
  nextQuestionBtn.style.display = 'inline-block';
}

nextQuestionBtn.addEventListener('click', () => {
  currentQuizIndex++;
  if (currentQuizIndex < quizQuestions.length) {
    loadQuizQuestion();
  } else {
    // Quiz finished
    questionText.textContent = "🎉 Great job! You finished the quiz.";
    optionsContainer.innerHTML = '';
    feedbackDiv.textContent = '';
    nextQuestionBtn.style.display = 'none';
  }
});

// Start activities button click
startActivitiesBtn.addEventListener('click', () => {
  warpActivities.style.display = 'block';
  startActivitiesBtn.style.display = 'none';
  currentQuizIndex = 0;
  loadQuizQuestion();
});
