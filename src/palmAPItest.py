import google.generativeai as palm

API_KEY = "AIzaSyAWmsOlr3vW52tb7UDKySHcdSHgtU00t3Q"
##Not a good key anymore :D

palm.configure(api_key=API_KEY)

# Chat Generation

examples = [
    ("Hello", "Hi there! How can I help you out?"),
    ("How are you doing", "I am doing well! How can I help you out today?"),
]

prompt = input("Welcome to the customer chatbot! Please enter your inquiry: \n")


response = palm.chat(
    messages=prompt,
    temperature=0.2,
    context="Speak like customer support",
    examples=examples,
)
for message in response.messages:
    print(message["author"], message["content"])

while True:
    s = input()
    response = response.reply(s)
    print(response.last)
