import {
  pipeline,
  env
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2";


// =====================================
// SMALL LOCAL AI MODEL
// =====================================

const MODEL =
  "HuggingFaceTB/SmolLM2-135M-Instruct";

env.allowLocalModels = false;

env.useBrowserCache = true;


let ai = null;

let thinking = false;

let memory =
  JSON.parse(
    localStorage.getItem("aiMemory") || "{}"
  );


// =====================================
// ELEMENTS
// =====================================

const chat =
  document.getElementById("chat");

const input =
  document.getElementById("message");

const status =
  document.getElementById("status");

const loadButton =
  document.getElementById("loadButton");

const progress =
  document.getElementById("progress");

const camera =
  document.getElementById("camera");

const screen =
  document.getElementById("screen");

const canvas =
  document.getElementById("canvas");


let cameraStream = null;

let screenStream = null;


// =====================================
// CHAT MESSAGE
// =====================================

function addMessage(
  text,
  type
) {

  const message =
    document.createElement("div");

  message.className =
    "message " + type;

  message.textContent =
    text;

  chat.appendChild(message);

  chat.scrollTop =
    chat.scrollHeight;
}


// =====================================
// SPEAK
// =====================================

function speak(text) {

  if (
    !("speechSynthesis" in window)
  ) {
    return;
  }

  speechSynthesis.cancel();

  const voice =
    new SpeechSynthesisUtterance(
      text
    );

  voice.lang = "en-GB";

  voice.rate = 1.05;

  voice.pitch = 1.18;

  speechSynthesis.speak(voice);
}


function reply(text) {

  addMessage(
    text,
    "ai"
  );

  speak(text);
}


// =====================================
// DOWNLOAD AI BRAIN
// =====================================

async function loadAI() {

  if (ai) {

    return true;

  }


  loadButton.disabled =
    true;

  progress.textContent =
    "Downloading the small AI brain... 🧠";


  try {

    ai = await pipeline(
      "text-generation",

      MODEL,

      {

        dtype: "q4",

        device: "webgpu",

        progress_callback:
          function(data) {

            if (
              data.status ===
              "progress"
            ) {

              progress.textContent =
                "Downloading: " +
                Math.round(
                  data.progress || 0
                ) +
                "%";

            }

          }

      }

    );

  }

  catch(error) {

    console.log(
      "WebGPU unavailable."
    );


    try {

      progress.textContent =
        "Trying CPU mode...";


      ai = await pipeline(
        "text-generation",

        MODEL,

        {

          dtype: "q4",

          device: "wasm",

          progress_callback:
            function(data) {

              if (
                data.status ===
                "progress"
              ) {

                progress.textContent =
                  "Downloading: " +
                  Math.round(
                    data.progress || 0
                  ) +
                  "%";

              }

            }

        }

      );

    }

    catch(error2) {

      console.error(
        error2
      );

      ai = null;

      loadButton.disabled =
        false;

      progress.textContent =
        "Couldn't load the AI brain.";

      reply(
        "I couldn't load my little brain. Try Chrome or Edge on a device with enough storage. 🌈"
      );

      return false;

    }

  }


  progress.textContent =
    "✅ AI brain ready!";


  loadButton.textContent =
    "🧠 AI Brain Ready";


  status.textContent =
    "Ready to chat ☀️🌈";


  return true;
}


loadButton.onclick =
  loadAI;


// =====================================
// ASK AI
// =====================================

async function askAI(
  question
) {

  if (thinking) {

    return;

  }


  const loaded =
    await loadAI();


  if (!loaded) {

    return;

  }


  thinking = true;


  status.textContent =
    "Thinking... 🧠✨";


  const messages = [

    {

      role: "system",

      content:
        `
You are a cheerful AI companion.

You do NOT have a name.

If someone asks your name,
say that you don't have one.

Your personality is extremely
positive, friendly, playful and
full of sunshine and rainbows.

You can joke around.

Be curious.

Give useful answers.

Do not claim to see something
unless you actually have access
to it.

Keep normal answers reasonably
short.
`

    }

  ];


  if (
    memory.name
  ) {

    messages.push({

      role: "system",

      content:
        "The user's name is " +
        memory.name

    });

  }


  messages.push({

    role: "user",

    content: question

  });


  try {

    const result =
      await ai(
        messages,
        {

          max_new_tokens: 160,

          temperature: .8,

          do_sample: true

        }
      );


    let answer =
      result[0].generated_text;


    if (
      Array.isArray(
        answer
      )
    ) {

      const last =
        answer[
          answer.length - 1
        ];

      answer =
        last.content || "";

    }


    answer =
      String(answer)
        .trim();


    if (!answer) {

      answer =
        "My brain got a little sparkly for a second. ✨";

    }


    reply(answer);

  }

  catch(error) {

    console.error(
      error
    );

    reply(
      "Oops! My little brain had a wobble. Try asking me again! 🌈"
    );

  }


  thinking = false;

  status.textContent =
    "Sunshine and rainbows ✨";
}


// =====================================
// TEXT
// =====================================

function sendMessage() {

  const text =
    input.value.trim();


  if (!text) {

    return;

  }


  input.value = "";


  addMessage(
    text,
    "user"
  );


  const lower =
    text.toLowerCase();


  // REMEMBER USER NAME

  if (
    lower.includes(
      "my name is "
    )
  ) {

    const name =
      text.substring(
        lower.indexOf(
          "my name is "
        ) + 11
      ).trim();


    memory.name =
      name;


    localStorage.setItem(
      "aiMemory",
      JSON.stringify(
        memory
      )
    );

  }


  askAI(
    text
  );
}


input.addEventListener(
  "keydown",

  function(event) {

    if (
      event.key === "Enter"
    ) {

      sendMessage();

    }

  }
);


// =====================================
// MICROPHONE
// =====================================

function startListening() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (
    !SpeechRecognition
  ) {

    reply(
      "Voice recognition isn't supported here. Try Chrome or Edge! 🎤"
    );

    return;

  }


  const recognition =
    new SpeechRecognition();


  recognition.lang =
    "en-GB";


  recognition.interimResults =
    false;


  status.textContent =
    "Listening... 🎤";


  recognition.onresult =
    function(event) {

      input.value =
        event
          .results[0][0]
          .transcript;


      sendMessage();

    };


  recognition.onend =
    function() {

      status.textContent =
        "Sunshine and rainbows ✨";

    };


  recognition.start();

}


// =====================================
// CAMERA
// =====================================

async function takePicture() {

  try {

    cameraStream =
      await navigator
        .mediaDevices
        .getUserMedia({
          video: true
        });


    camera.srcObject =
      cameraStream;


    camera.hidden =
      false;


    status.textContent =
      "Camera is on 📷";


    setTimeout(
      function() {

        canvas.width =
          camera.videoWidth ||
          640;


        canvas.height =
          camera.videoHeight ||
          480;


        canvas
          .getContext("2d")
          .drawImage(
            camera,
            0,
            0,
            canvas.width,
            canvas.height
          );


        cameraStream
          .getTracks()
          .forEach(
            function(track) {

              track.stop();

            }
          );


        cameraStream =
          null;


        camera.hidden =
          true;


        reply(
          "I captured the picture! 📸 This small model is text-only, though, so it can't actually understand what's in the picture yet."
        );

      },

      1200

    );

  }

  catch(error) {

    reply(
      "I couldn't access your camera. Check your browser permission. 📷"
    );

  }

}


// =====================================
// SCREEN
// =====================================

async function shareScreen() {

  try {

    screenStream =
      await navigator
        .mediaDevices
        .getDisplayMedia({
          video: true
        });


    screen.srcObject =
      screenStream;


    screen.hidden =
      false;


    status.textContent =
      "Screen sharing is active 👀";


    reply(
      "I can receive the screen stream, but this tiny model can't actually understand the screen yet. 👀"
    );


    screenStream
      .getVideoTracks()[0]
      .onended =
      stopEverything;

  }

  catch(error) {

    reply(
      "Screen sharing was cancelled. 🌈"
    );

  }

}


// =====================================
// STOP
// =====================================

function stopEverything() {

  if (
    cameraStream
  ) {

    cameraStream
      .getTracks()
      .forEach(
        function(track) {

          track.stop();

        }
      );

  }


  if (
    screenStream
  ) {

    screenStream
      .getTracks()
      .forEach(
        function(track) {

          track.stop();

        }
      );

  }


  cameraStream =
    null;


  screenStream =
    null;


  camera.hidden =
    true;


  screen.hidden =
    true;


  speechSynthesis.cancel();


  status.textContent =
    "Sunshine and rainbows ✨";
}


// =====================================
// START
// =====================================

addMessage(
  "Hiiii! ☀️🌈 I don't have a name! Press 'Download AI Brain' and then you can ask me questions.",
  "ai"
);
