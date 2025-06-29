// ====== Variables & DOM Elements ======
// Proctoring & general UI
const proctorBtn         = document.getElementById("proctor-btn");
const ackModal           = document.getElementById("ack-modal");
const ackAgreeBtn        = document.getElementById("ack-agree-btn");
const startActivitiesBtn = document.getElementById("start-activities-btn");
const proctorVideo       = document.getElementById("proctor-video");
const proctorStatus      = document.getElementById("proctor-status");

// Initial CPU vs GPU quiz UI
const warpActivities      = document.getElementById("warp-activities");
const questionText        = document.getElementById("question-text");
const optionsContainer    = document.getElementById("options-container");
const feedbackDiv         = document.getElementById("feedback");
const nextQuestionBtn     = document.getElementById("next-question-btn");

// Level‐complete screen
const levelCompleteScreen = document.getElementById("level-complete-screen");
const userLevelDisplay    = document.getElementById("user-level-display");
const toWordProblemsBtn   = document.getElementById("to-word-problems-btn");
const toCodeQuestionsBtn  = document.getElementById("to-code-questions-btn");

// Word problems UI
const wordProblemsContainer = document.getElementById("word-problems-container");
const wordQuestionText      = document.getElementById("word-question-text");
const wordOptionsContainer  = document.getElementById("word-options-container");
const wordFeedback          = document.getElementById("word-feedback");
const wordNextQuestionBtn   = document.getElementById("word-next-question-btn");

// Code-question UI
const codeQuestionsContainer = document.getElementById("code-questions-container");
const runCodeBtn             = document.getElementById("run-code-btn");
const runOnButtons           = document.getElementById("run-on-buttons");
const runCpuBtn              = document.getElementById("run-cpu-btn");
const runGpuBtn              = document.getElementById("run-gpu-btn");
const cpuStatus              = document.getElementById("cpu-status");
const benchmarkControls      = document.getElementById("benchmark-controls");
const matrixSizeInput        = document.getElementById("matrix-size-input");
const runBenchmarkBtn        = document.getElementById("run-benchmark-btn");
const benchmarkOutput        = document.getElementById("benchmark-output");
const benchmarkBars          = document.getElementById("benchmark-bars");
const cpuBarFill             = document.getElementById("cpu-bar-fill");
const gpuBarFill             = document.getElementById("gpu-bar-fill");
const finishBtn              = document.getElementById("finish-btn");

// Congrats / Try Again screens
const congratsScreen  = document.getElementById("congrats-screen");
const restartBtn      = document.getElementById("restart-btn");
const tryAgainScreen  = document.getElementById("try-again-screen");
const tryAgainBtn     = document.getElementById("try-again-btn");

// ====== State ======
let proctoringEnabled = false;
let acknowledged      = false;

let currentIndex      = 0;
let score             = 0;

let wordCurrentIndex  = 0;
let wordScore         = 0;
let userLevel         = null;

// ====== Proctoring & Webcam ======
async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    proctorVideo.srcObject = stream;
    proctorVideo.style.display = "block";
    proctorStatus.style.display = "block";
    proctorStatus.innerText = "Proctoring enabled: Face detected";
  } catch {
    proctorStatus.style.display = "block";
    proctorStatus.innerText = "Proctoring enabled: Face not detected";
  }
}

function stopWebcam() {
  if (proctorVideo.srcObject) {
    proctorVideo.srcObject.getTracks().forEach(t => t.stop());
  }
  proctorVideo.style.display = "none";
  proctorStatus.style.display = "none";
}

function toggleProctoring() {
  if (!proctoringEnabled) {
    if (!acknowledged) {
      ackModal.style.display = "flex";
      return;
    }
    proctoringEnabled = true;
    proctorBtn.innerText = "Disable Proctoring";
    startWebcam();
    startActivitiesBtn.style.display = "inline-block";
  } else {
    proctoringEnabled = false;
    acknowledged      = false;
    proctorBtn.innerText = "Enable Proctoring";
    stopWebcam();
    startActivitiesBtn.style.display      = "none";
    warpActivities.style.display          = "none";
    levelCompleteScreen.style.display     = "none";
    wordProblemsContainer.style.display   = "none";
    codeQuestionsContainer.style.display  = "none";
    congratsScreen.style.display          = "none";
    tryAgainScreen.style.display          = "none";
  }
}

ackAgreeBtn.onclick = e => {
  e.preventDefault();
  acknowledged = true;
  ackModal.style.display = "none";
  proctoringEnabled = true;
  proctorBtn.innerText = "Disable Proctoring";
  startWebcam();
  startActivitiesBtn.style.display = "inline-block";
};

proctorBtn.onclick = toggleProctoring;

// ====== Initial CPU vs GPU Quiz ======
const initialQuizQuestions = [
  {
    question:
      "When performing many small matrix multiplications (e.g., 64×64) with minimal reuse and high frequency, which processor typically offers better overall performance due to lower overhead?",
    options: { A: "CPU", B: "GPU" },
    correct: "A",
    explanation:
      "CPUs handle small, frequent operations with low overhead better than GPUs, which benefit more from larger workloads."
  },
  {
    question:
      "Which processor typically benefits more from using asynchronous execution mechanisms like streams to overlap computation and data transfer?",
    options: { A: "CPU", B: "GPU" },
    correct: "B",
    explanation:
      "GPUs are designed to maximize throughput using streams and async execution to hide memory latency."
  },
  {
    question:
      "In tasks involving complex control flow, conditional branching, or sequential logic (e.g., recursive algorithms or data-dependent loops), which processor is generally better suited for efficient execution?",
    options: { A: "CPU", B: "GPU" },
    correct: "A",
    explanation:
      "CPUs excel at tasks with branching and sequential logic due to their complex instruction handling and caching mechanisms."
  },
  {
    question:
      "For executing thousands of independent small matrix operations, which processor architecture is typically better suited?",
    options: { A: "CPU", B: "GPU" },
    correct: "B",
    explanation:
      "GPUs can execute many independent tasks in parallel using thousands of cores, making them ideal for bulk operations."
  },
  {
    question:
      "In scenarios where the problem size is too small to saturate GPU cores like computations on small datasets or minimal parallelism, which processor is likely to be more efficient?",
    options: { A: "CPU", B: "GPU" },
    correct: "A",
    explanation:
      "GPUs require large parallel workloads to amortize kernel launch overhead and memory latency."
  }
];

function renderQuestion() {
  const q = initialQuizQuestions[currentIndex];
  questionText.textContent = q.question;
  optionsContainer.innerHTML = "";
  feedbackDiv.textContent = "";
  nextQuestionBtn.style.display = "none";

  Object.entries(q.options).forEach(([key, val]) => {
    const btn = document.createElement("button");
    btn.textContent = `${key}: ${val}`;
    btn.onclick = () => handleInitialAnswer(key, btn);
    optionsContainer.appendChild(btn);
  });
}

function handleInitialAnswer(selected, btn) {
  const q = initialQuizQuestions[currentIndex];
  Array.from(optionsContainer.children).forEach(b => (b.disabled = true));
  const correctBtn = Array.from(optionsContainer.children).find(b =>
    b.textContent.startsWith(q.correct + ":")
  );
  if (correctBtn) correctBtn.classList.add("correct");

  if (selected === q.correct) {
    score++;
    feedbackDiv.style.color = "green";
    feedbackDiv.textContent = "Correct! " + q.explanation;
    btn.classList.add("correct");
  } else {
    feedbackDiv.style.color = "red";
    feedbackDiv.textContent = `Wrong. Correct: ${q.correct}: ${
      q.options[q.correct]
    }. ${q.explanation}`;
    btn.classList.add("wrong");
  }

  nextQuestionBtn.style.display = "inline-block";
}

nextQuestionBtn.onclick = () => {
  currentIndex++;
  if (currentIndex < initialQuizQuestions.length) {
    renderQuestion();
  } else {
    warpActivities.style.display        = "none";
    levelCompleteScreen.style.display   = "block";

    if (score <= 2)       userLevel = "beginner";
    else if (score <= 4)  userLevel = "intermediate";
    else                  userLevel = "advanced";

    userLevelDisplay.textContent =
      `Your level: ${userLevel.toUpperCase()} (Score: ${score}/5)`;
  }
};

// ====== Word Problems ======
const wordProblemsByLevel = {
  beginner: [
    {
      question:
        "When using CuPy for GPU acceleration, which of the following scenarios is most likely to result in poor performance, even though the computation is offloaded to the GPU?",
      options: {
        A: "Performing large matrix multiplications entirely on the GPU",
        B: "Minimizing data transfer between host (CPU) and device (GPU)",
        C: "Repeatedly transferring small arrays between CPU and GPU in a loop",
        D: "Using streams to overlap computation and memory transfers"
      },
      correct: "C",
      explanation:
        "Frequent small data transfers between the host and device introduce significant overhead that negates GPU acceleration benefits."
    }
  ],
  intermediate: [
    {
      question:
        "Which scenario is best suited for execution on the CPU?",
      options: {
        A: "Performing thousands of small, sequential operations with complex branching",
        B: "Running a large batch of matrix multiplications in parallel",
        C: "Applying the same arithmetic operation on millions of data points simultaneously",
        D: "Overlapping data transfers and computation on device streams"
      },
      correct: "A",
      explanation:
        "CPUs handle complex branching and sequential logic better than GPUs."
    },
    {
      question:
        "You want to optimize a program involving frequent small data updates and low-latency access to scattered memory. Which approach works best?",
      options: {
        A: "Execute on GPU with frequent host-device data transfers",
        B: "Execute on CPU to avoid data transfer overhead and benefit from fast random access",
        C: "Use GPU streams for asynchronous execution",
        D: "Batch computations on GPU kernels for parallelism"
      },
      correct: "B",
      explanation:
        "CPU avoids transfer overhead and benefits from fast random memory access."
    },
    {
      question:
        "A task involves recursive algorithms with heavy branching and pointer chasing. Which scenario is most efficient?",
      options: {
        A: "Implement on CPU, which handles complex control flow well",
        B: "Implement on GPU for parallelism across threads",
        C: "Use GPU streams for concurrency",
        D: "Batch the recursion on GPU kernels"
      },
      correct: "A",
      explanation:
        "CPUs excel at tasks with branching and complex control flow."
    },
    {
      question:
        "For a single small matrix inversion (64×64) performed occasionally, which approach is optimal?",
      options: {
        A: "Run it on CPU to avoid GPU launch overhead",
        B: "Offload it to GPU to utilize parallel cores",
        C: "Batch multiple small inversions and run on GPU",
        D: "Use GPU streams to overlap with data transfer"
      },
      correct: "A",
      explanation:
        "CPU avoids the overhead of launching a GPU kernel for a one-off small task."
    },
    {
      question:
        "You are working with a program that requires low-latency access and complex sequential logic. Which scenario is most suitable?",
      options: {
        A: "CPU execution for minimal latency and flexible control flow",
        B: "GPU execution for massive parallelism",
        C: "Use CUDA Python for low-level kernel launches",
        D: "Use Warp for simulation acceleration"
      },
      correct: "A",
      explanation:
        "CPU offers lower latency and better support for complex sequential code."
    }
  ],
  advanced: [
    {
      question:
        "Which scenario best utilizes the GPU’s strengths?",
      options: {
        A: "Performing very large matrix multiplications (e.g., 10,000×10,000)",
        B: "Running a few small sequential tasks with branching",
        C: "Frequent small data transfers inside a loop",
        D: "Single small matrix inversion occasionally"
      },
      correct: "A",
      explanation:
        "GPUs excel at large, data-parallel workloads that saturate many cores."
    },
    {
      question:
        "For applying an elementwise operation across millions of elements, which scenario is ideal?",
      options: {
        A: "Run on GPU to leverage massive parallelism",
        B: "Run on CPU to avoid kernel launch overhead",
        C: "Run small sequential tasks on GPU streams",
        D: "Transfer data frequently between host and device"
      },
      correct: "A",
      explanation:
        "GPUs can handle huge numbers of independent operations simultaneously."
    },
    {
      question:
        "Which approach makes best use of GPU streams?",
      options: {
        A: "Overlapping data transfer and kernel execution on the GPU",
        B: "Running recursive code with heavy branching on CPU",
        C: "Performing sequential small matrix inversions on CPU",
        D: "Frequent data transfer between host and device without batching"
      },
      correct: "A",
      explanation:
        "Streams let you hide data transfer latency by overlapping it with computation."
    },
    {
      question:
        "You need to process thousands of small matrix multiplications efficiently. Which scenario fits best?",
      options: {
        A: "Batch all small multiplications and run on GPU in parallel",
        B: "Run each small multiplication individually on CPU",
        C: "Transfer data back and forth for each small multiplication on GPU",
        D: "Run on CPU streams with sequential execution"
      },
      correct: "A",
      explanation:
        "Batching on the GPU amortizes kernel launch costs and uses parallel cores."
    },
    {
      question:
        "Which scenario benefits most from kernel fusion?",
      options: {
        A: "Combining multiple GPU operations into a single kernel to reduce launch overhead",
        B: "Executing many small CPU operations sequentially",
        C: "Running heavy branching code on CPU cores",
        D: "Frequently copying small data chunks between CPU and GPU"
      },
      correct: "A",
      explanation:
        "Fusing kernels reduces the number of launches and intermediate data transfers."
    }
  ]
};

function renderWordQuestion() {
  const q = wordProblemsByLevel[userLevel][wordCurrentIndex];
  wordQuestionText.textContent = q.question;
  wordOptionsContainer.innerHTML = "";
  wordFeedback.textContent = "";
  wordNextQuestionBtn.style.display = "none";

  Object.entries(q.options).forEach(([key, val]) => {
    const btn = document.createElement("button");
    btn.textContent = `${key}: ${val}`;
    btn.onclick = () => handleWordAnswer(key, btn);
    wordOptionsContainer.appendChild(btn);
  });
}

function handleWordAnswer(selected, btn) {
  const q = wordProblemsByLevel[userLevel][wordCurrentIndex];
  Array.from(wordOptionsContainer.children).forEach(b => (b.disabled = true));
  const correctBtn = Array.from(wordOptionsContainer.children).find(b =>
    b.textContent.startsWith(q.correct + ":")
  );
  if (correctBtn) correctBtn.classList.add("correct");

  if (selected === q.correct) {
    wordScore++;
    wordFeedback.style.color = "green";
    wordFeedback.textContent = "Correct! " + q.explanation;
    btn.classList.add("correct");
  } else {
    wordFeedback.style.color = "red";
    wordFeedback.textContent = `Wrong. Correct: ${q.correct}: ${
      q.options[q.correct]
    }. ${q.explanation}`;
    btn.classList.add("wrong");
  }

  wordNextQuestionBtn.style.display = "inline-block";
}

wordNextQuestionBtn.onclick = () => {
  wordCurrentIndex++;
  if (wordCurrentIndex < wordProblemsByLevel[userLevel].length) {
    renderWordQuestion();
  } else {
    wordProblemsContainer.style.display = "none";
    congratsScreen.style.display        = "block";
  }
};

// ====== Code-Question & Benchmark Flow ======
function resetCodeSection() {
  runOnButtons.style.display      = "none";
  benchmarkControls.style.display = "none";
  benchmarkOutput.style.display   = "none";
  benchmarkBars.style.display     = "none";
  finishBtn.style.display         = "none";
  cpuStatus.textContent           = "";
}

runCodeBtn.onclick = () => {
  runOnButtons.style.display      = "flex";
  benchmarkControls.style.display = "flex";
};

runCpuBtn.onclick = () => {
  cpuStatus.textContent = "CPU simulation complete.";
};

runGpuBtn.onclick = () => {
  cpuStatus.textContent = "GPU simulation complete.";
};

const singleTimings = {
  "64":   { numpy: 0.000151, cupy: 0.000430 },
  "128":  { numpy: 0.000674, cupy: 0.001060 },
  "256":  { numpy: 0.003471, cupy: 0.001306 },
  "512":  { numpy: 0.022671, cupy: 0.005155 },
  "1024": { numpy: 0.138702, cupy: 0.012531 },
  "2048": { numpy: 1.035299, cupy: 0.032249 }
};

runBenchmarkBtn.onclick = () => {
  const size = matrixSizeInput.value;
  const d = singleTimings[size];

  // Show text output
  benchmarkOutput.style.display = "block";
  benchmarkOutput.textContent =
`Input Matrix size: ${size} x ${size}

NumPy Time: ${d.numpy.toFixed(6)} seconds
CuPy  Time: ${d.cupy.toFixed(6)} seconds

Note: These times are simulated for demonstration only.`;

  // Show & animate bars
  benchmarkBars.style.display = "block";
  // reset
  cpuBarFill.style.width = gpuBarFill.style.width = "0%";
  const cpuSpeed = 1 / d.numpy;
  const gpuSpeed = 1 / d.cupy;
  const total    = cpuSpeed + gpuSpeed;
  const cpuPct   = (cpuSpeed / total) * 100;
  const gpuPct   = (gpuSpeed / total) * 100;
  setTimeout(() => {
    cpuBarFill.style.width = cpuPct + "%";
    gpuBarFill.style.width = gpuPct + "%";
  }, 50);

  finishBtn.style.display = "inline-block";
};

finishBtn.onclick = () => {
  codeQuestionsContainer.style.display = "none";
  congratsScreen.style.display         = "block";
};

// ====== Navigation Buttons ======
toWordProblemsBtn.onclick = () => {
  levelCompleteScreen.style.display    = "none";
  wordProblemsContainer.style.display  = "block";
  wordCurrentIndex = wordScore = 0;
  renderWordQuestion();
};

toCodeQuestionsBtn.onclick = () => {
  levelCompleteScreen.style.display     = "none";
  codeQuestionsContainer.style.display  = "block";
  resetCodeSection();
};

// ====== Restart / Try Again ======
restartBtn.onclick = () => {
  congratsScreen.style.display = tryAgainScreen.style.display = "none";
  warpActivities.style.display = "block";
  currentIndex = score = 0;
  renderQuestion();
};

tryAgainBtn.onclick = () => {
  tryAgainScreen.style.display   = "none";
  warpActivities.style.display   = "block";
  currentIndex = score = 0;
  renderQuestion();
};

// ====== Start Activities ======
startActivitiesBtn.onclick = () => {
  warpActivities.style.display      = "block";
  startActivitiesBtn.style.display  = "none";
  renderQuestion();
};

// ====== On Page Load Setup ======
warpActivities.style.display          = "none";
levelCompleteScreen.style.display     = "none";
wordProblemsContainer.style.display   = "none";
codeQuestionsContainer.style.display  = "none";
congratsScreen.style.display          = "none";
tryAgainScreen.style.display          = "none";
startActivitiesBtn.style.display      = "none";
resetCodeSection();
