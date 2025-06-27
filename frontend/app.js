let proctoringEnabled = false;
let acknowledged = false;
let currentSpeech;
let isChatOpen = false;

const questions = [
  "What is a GPU?",
  "Why use Python for data science?",
  "What is overfitting?",
  "Explain neural networks.",
  "What is reinforcement learning?"
];

const video = document.getElementById('proctor-video');
const statusDiv = document.getElementById('proctor-status');

function toggleChat() {
  isChatOpen = !isChatOpen;
  const chatbot = document.getElementById("chatbot");
  chatbot.style.display = isChatOpen ? "flex" : "none";

  if (isChatOpen) showQuestionOptions();
}

function toggleProctoring() {
  if (!proctoringEnabled) {
    if (!acknowledged) {
      openAckModal();
      return;
    }
    proctoringEnabled = true;
    document.getElementById('proctor-btn').innerText = "Disable Proctoring";
    startProctoring();
  } else {
    proctoringEnabled = false;
    acknowledged = false;
    document.getElementById('proctor-btn').innerText = "Enable Proctoring";
    stopProctoring();
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
  toggleProctoring();
});

async function startProctoring() {
  video.style.display = "block";
  statusDiv.style.display = "block";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.play();

    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    runFaceDetectionLoop();
  } catch (err) {
    // Only log error; don't show alert if camera is working
    console.error("Camera access error:", err);
    statusDiv.style.display = "none";
  }
}

function stopProctoring() {
  let stream = video.srcObject;
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  video.style.display = "none";
  statusDiv.style.display = "none";
  clearInterval(faceDetectionInterval);
}

let faceDetectionInterval;

function runFaceDetectionLoop() {
  const options = new faceapi.TinyFaceDetectorOptions();

  faceDetectionInterval = setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, options);
    if (detections.length === 0) {
      statusDiv.innerText = "⚠️ No face detected! Please stay in view.";
    } else {
      statusDiv.innerText = "✅ Face detected. Good!";
    }
  }, 3000);
}

// Speech & Chatbot Functions
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

const canvas = document.getElementById('cpu-gpu-canvas');
const ctx = canvas.getContext('2d');

const ballCount = 10;
const ballRadius = 10;
const startX = 50;
const endX = 500;
const spacingY = 25;

function drawBalls(xPositions, color) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  for (let i = 0; i < ballCount; i++) {
    ctx.beginPath();
    ctx.arc(xPositions[i], 40 + i * spacingY, ballRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function runCpuAnimation() {
  let frame = 0;
  const xPositions = Array(ballCount).fill(startX);
  const interval = setInterval(() => {
    if (frame < ballCount) {
      xPositions[frame] = endX;
      drawBalls(xPositions, 'blue');
      frame++;
    } else {
      clearInterval(interval);
    }
  }, 400);
}

function runGpuAnimation() {
  let progress = 0;
  const steps = 20;
  const interval = setInterval(() => {
    if (progress <= 1) {
      const x = startX + (endX - startX) * progress;
      const xPositions = Array(ballCount).fill(x);
      drawBalls(xPositions, 'green');
      progress += 1 / steps;
    } else {
      clearInterval(interval);
    }
  }, 100);
}