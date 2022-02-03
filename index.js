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


// Convo
bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const msgReceived = msg.text.toString().toLowerCase();
    // Hello
    let greetings = "Hello 👋 \n" +  msg.chat.first_name.toString() + ".";
    if(msgReceived.includes("hi") || msgReceived.includes("hello") || msgReceived.includes("hey")){
        bot.sendMessage(chatId, greetings);
    }
    // Bye
    let bye = "Good Bye, Have a nice time!";
    if(msgReceived.includes("bye")){
        bot.sendMessage(chatId, bye);
    }

    // Send Photo
    if(msgReceived.includes("send photo")){
        bot.sendMessage(chatId, "Sending photo...");
        let imageLink = msgReceived.padStart(10);
        bot.sendPhoto(msg.chat.id,imageLink);
    }

});





