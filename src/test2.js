// import WebSocket
const WebSocket = require("ws");

const voiceId = "21m00Tcm4TlvDq8ikWAM"; // replace with your voice_id
const model = "eleven_monolingual_v1";
const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${model}`;
const socket = new WebSocket(wsUrl);

// 2. Initialize the connection by sending the BOS message

const bosMessage = {
  text: " ",
  voice_settings: {
    stability: 0.8,
    similarity_boost: true,
  },
  xi_api_key: "b01180d03826fd196b7d17840d25f1d8", // replace with your API key
};

socket.send(JSON.stringify(bosMessage));

// 3. Send the input text message ("Hello World")
const textMessage = {
  text: "hello hello hello hello hello hello  testingeiennlfislfnsilfisu ",
  try_trigger_generation: true,
};

socket.send(JSON.stringify(textMessage));

// 4. Send the EOS message with an empty string
const eosMessage = {
  text: "",
};

socket.send(JSON.stringify(eosMessage));

// 5. Handle server responses
socket.onmessage = function (event) {
  const response = JSON.parse(event.data);

  console.log("Server response:", response);

  if (response.audio) {
    // decode and handle the audio data (e.g., play it)
    const audioChunk = atob(response.audio); // decode base64
    console.log("Received audio chunk");
    // send audio to frontend here
  } else {
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
