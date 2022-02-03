const TelegramBot = require('node-telegram-bot-api');
const request = require('request');

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

// Covid API
let covidData = "EMPTY COVID DATA!";
async function covidAPI()  {
    request('https://corona.lmao.ninja/v2/countries/Ethiopia', function (error, response, body) {
        if (!error && response.statusCode === 200) {
            console.log(body);
            covidData = body;
        } else {
            console.log("error");
        }
    })
}
// Convo
bot.on("message", async (msg) => {
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
        let imageLink = msgReceived.substring(10, msgReceived.length).toString();
        let imageLink2 = "Sending photo... \n" + msgReceived.substring(10, msgReceived.length);
        bot.sendMessage(chatId, imageLink2);
        //bot.sendPhoto(chatId, imageLink, {caption : imageLink.toString()} );
        await bot.sendPhoto(chatId, "assets/picture/pic1.jpg", {caption : "Picture 1"} );
        await bot.sendPhoto(chatId, "assets/picture/pic2.webp", {caption : "Picture 2"} );

    }

    // Send Music
    if(msgReceived.includes("send song")){
        //let songLink = msgReceived.substring(8, msgReceived.length);
        bot.sendMessage(chatId, "Sending Song...");
        await bot.sendAudio(chatId, "assets/music/bornSinner.mp3");
        bot.sendMessage(chatId, "Done!");
    }

    //
    if(msgReceived.includes("covid")){
        //let songLink = msgReceived.substring(8, msgReceived.length);
        bot.sendMessage(chatId, "Sending Song...");
        //await covidAPI();
        await request.get('https://corona.lmao.ninja/v2/countries/Ethiopia', function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log(body);
                let cases = body["cases"].toString();
                console.log(cases);

                covidData = body;
            } else {
                console.log("error");
            }
        })
        bot.sendMessage(chatId, covidData);
        
        
        bot.sendMessage(chatId, "Done!");
    }
    
});





