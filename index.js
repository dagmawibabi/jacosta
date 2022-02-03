const TelegramBot = require('node-telegram-bot-api');

const token = '5208477658:AAHL6kfn6C7v_ngn41xjIAoL9MCbBNsjhO8';
const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"
  bot.sendMessage(chatId, resp);
});

// Start
bot.on(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    let greetings = "Hello 👋 \n" +  msg.chat.first_name.toString();
    bot.sendMessage(chatId, greetings);
});


// Conbo
let bye = "Good Bye, Have a nice time!";
bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const msgReceived = msg.text.toString().toLowerCase();
    let greetings = "Hello 👋 \n" +  msg.chat.first_name.toString();
    // Hello
    if(msgReceived.includes("hi") || msgReceived.includes("hello") || msgReceived.includes("hey")){
        bot.sendMessage(chatId, greetings);
    }
    if(msgReceived.includes("bye")){
        bot.sendMessage(chatId, bye);
    }

});


