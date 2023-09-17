const { OpenAI } = require('openai');
const fs = require('fs');

const openai = new OpenAI({
	apiKey: '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'
});

const policies = fs.readFileSync('output.txt', 'utf8');

async function main() {
	const completion = await openai.chat.completions.create({
		model: "gpt-3.5-turbo",
		messages: [
			{ "role": "system", "content": policies},
			{ "role": "user", "content": "Hi, I bought some clothes last week from H&M and would like to return them." }
		],
		stream: true,
		max_tokens: 120
	});

	const baseUrl = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM/stream?optimize_streaming_latency=0&output_format=mp3_44100_128";
	const headers = {
		"Content-Type": "application/json",
		"xi-api-key": 'f0f49aa20de302dbb2123489d06f439e',
	};
	const voiceId = '21m00Tcm4TlvDq8ikWAM'

	counter = 0
	chunkNum = 0
	text = ""
	for await (const chunk of completion) {
		content = chunk.choices[0].delta.content
		if (content == "undefined") {
			continue
		}
		text += content
		counter += 1

		if (counter == 25) { // 25 tokens per "query"
			chunkNum += 1
			console.log(`${chunkNum}: ${text}`)

			counter = 0
			text = ""
		}
		
	}


}

main();