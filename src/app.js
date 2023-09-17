"use strict";

const express = require("express"); // const bodyParser = require('body-parser'); // const path = require('path');
const environmentVars = require("dotenv").config();

// Google Cloud
const speech = require("@google-cloud/speech");
const speechClient = new speech.SpeechClient(); // Creates a client

const app = express();
const port = process.env.PORT || 1337;
const server = require("http").createServer(app);

const io = require("socket.io")(server);
const { OpenAI } = require("openai");
const fs = require("fs");

const openai = new OpenAI({
  apiKey: fs.readFileSync("openai-key.txt", "utf8"),
});

const policies = fs.readFileSync("output.txt", "utf8");

app.use("/assets", express.static(__dirname + "/public"));
app.use("/session/assets", express.static(__dirname + "/public"));
app.set("view engine", "ejs");

// =========================== ROUTERS ================================ //

app.get("/", function (req, res) {
  res.render("index", {});
});

app.use("/", function (req, res, next) {
  next(); // console.log(`Request Url: ${req.url}`);
});

// =========================== SOCKET.IO ================================ //
let isPlaying = false;

io.on("connection", function (client) {
  console.log("Client Connected to server");
  let recognizeStream = null;

  client.on("join", function () {
    client.emit("messages", "Socket Connected to Server");
  });

  client.on("messages", function (data) {
    client.emit("broad", data);
  });

  client.on("startGoogleCloudStream", function (data) {
    startRecognitionStream(this, data);
  });

  client.on("endGoogleCloudStream", function () {
    stopRecognitionStream();
  });

  client.on("binaryData", function (data) {
    // console.log(data); //log binary data
    if (recognizeStream !== null) {
      recognizeStream.write(data);
    }
  });

  client.on("toPlayAudio", function (message) {
    if (message === "finished") {
      console.log("finished playing audio");
      isPlaying = false;
    }
  });

  function startRecognitionStream(client) {
    recognizeStream = speechClient
      .streamingRecognize(request)
      .on("error", console.error)
      .on("data", async (data) => {
        process.stdout.write(
          data.results[0] && data.results[0].alternatives[0]
            ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
            : "\n\nReached transcription time limit, press Ctrl+C\n"
        );

        client.emit("speechData", data);

        // if final transcription, then get ai voice for that word.
        if (
          data.results[0] &&
          data.results[0].isFinal &&
          data.results[0].alternatives[0]
        ) {
          let user_question = data.results[0].alternatives[0].transcript + " ";
          // send the user question to GPT
          process.stdout.write("sending to gpt: " + user_question);

          const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: policies },
              {
                role: "user",
                content: user_question,
              },
            ],
            stream: true,
            max_tokens: 150,
          });

          let counter = 0;
          let text = "";
          for await (const chunk of completion) {
            let content = chunk.choices[0].delta.content;
            if (content == "undefined") {
              console.log("undefined");
              continue;
            }
            text += content;
            counter += 1;

            if (counter == 25) {
              // 25 tokens per "query"
              // send this to the client to play as audio file.
              while (isPlaying) {
                console.log("waiting for audio to finish");
                await new Promise((resolve) => setTimeout(resolve, 100));
              }
              console.log(text);
              text = text.replace("undefined", "");
              sendElevenLabsMessage(text + " ");
              counter = 0;
              text = "";
            }
          }

          // sendElevenLabsMessage(
          //   data.results[0].alternatives[0].transcript + " "
          // );
        }

        // if end of utterance, let's restart stream
        // this is a small hack. After 65 seconds of silence, the stream will still throw an error for speech length limit
        if (data.results[0] && data.results[0].isFinal) {
          stopRecognitionStream();
          startRecognitionStream(client);
          // console.log('restarted stream serverside');
        }
      });
  }

  function stopRecognitionStream() {
    if (recognizeStream) {
      recognizeStream.end();
    }
    recognizeStream = null;
  }

  // =========================== ELEVENLABS SOCKET.IO ================================ //

  // import WebSocket
  const WebSocket = require("ws");

  const voiceId = "jsCqWAovK2LkecY7zXl4"; // replace with your voice_id
  const model = "eleven_monolingual_v1";
  const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${model}`;

  function sendElevenLabsMessage(text) {
    isPlaying = true;
    const socket = new WebSocket(wsUrl);

    // 2. Initialize the connection by sending the BOS message
    socket.onopen = function (event) {
      const bosMessage = {
        text: " ",
        voice_settings: {
          stability: 0.5,
          similarity_boost: true,
        },
        xi_api_key: fs.readFileSync("elevenlabs-key.txt", "utf8"),
      };

      socket.send(JSON.stringify(bosMessage));

      process.stdout.write(
        "sent bos message to elevenlabs, initialized stream\n"
      );

      const textMessage = {
        text: text,
        try_trigger_generation: true,
      };

      socket.send(JSON.stringify(textMessage));

      const eosMessage = {
        text: "",
      };

      socket.send(JSON.stringify(eosMessage));
    };

    // 5. Handle server responses
    socket.onmessage = function (event) {
      const response = JSON.parse(event.data);

      console.log("Server response:", response);

      if (response.audio) {
        // decode and handle the audio data (e.g., play it)
        console.log("Received audio chunk");

        // send audio to frontend here over websockets, then frontend will play it. (if previous audio is still playing, then wait for it to finish before playing this one)
        client.emit("toPlayAudio", response.audio);
      } else {
        client.emit("toPlayAudio", response.audio);
        console.log("No audio data in the response");
      }

      if (response.isFinal) {
        // the generation is complete
      }

      if (response.normalizedAlignment) {
        // use the alignment info if needed
      }
    };

    // Handle errors
    socket.onerror = function (error) {
      console.error(`WebSocket Error: ${error}`);
    };

    // Handle socket closing
    socket.onclose = function (event) {
      if (event.wasClean) {
        console.info(
          `Connection closed cleanly, code=${event.code}, reason=${event.reason}`
        );
      } else {
        console.warn("Connection died");
      }
    };
  }
});

// =========================== GOOGLE CLOUD SETTINGS ================================ //

// The encoding of the audio file, e.g. 'LINEAR16'
// The sample rate of the audio file in hertz, e.g. 16000
// The BCP-47 language code to use, e.g. 'en-US'
const encoding = "LINEAR16";
const sampleRateHertz = 16000;
const languageCode = "en-US"; //en-US

const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
    profanityFilter: false,
    enableWordTimeOffsets: true,
    // speechContexts: [{
    //     phrases: ["hoful","shwazil"]
    //    }] // add your own speech context for better recognition
  },
  interimResults: true, // If you want interim results, set this to true
};

// =========================== START SERVER ================================ //

server.listen(port, "127.0.0.1", function () {
  //http listen, to make socket work
  // app.address = "127.0.0.1";
  console.log("Server started on port:" + port);
});
