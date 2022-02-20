const TelegramBot = require('node-telegram-bot-api');
const request = require('request');
const fs = require('fs');
const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();

const token = '5208477658:AAE4ouDcP9YSHlFD9bP2TqQ-BuUVRG_08YQ';
const bot = new TelegramBot(token, {polling: true});

//
bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"
  bot.sendMessage(chatId, resp);
});

// Start
let commands = {
    "reply_markup": {
        "keyboard": [
            ["Hello"],
            ["About Me"],
            ["Download Images"],
            ["Save Song", "Send Songs"],
            ["Send Photo"], 
            ["Covid Stats", "Crypto Prices"],
            ["Good Morning" ,"Good Night"],
            ["Bye"],
        ]
    }
};

// Start
bot.on(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    let greetings = "Hello 👋 \n" +  msg.chat.first_name.toString();
    bot.sendMessage(chatId, greetings, commands);
});

// Covid API
async function covidAPI(chatId)  {
    await request('https://corona.lmao.ninja/v2/countries/Ethiopia', function (error, response, body) {
        if (!error && response.statusCode === 200) {
            let bodyJSON = JSON.parse(body);
            let covidData = "COVID CASES \n\n" + bodyJSON["country"] + "\n\nToday: " + bodyJSON["todayCases"] + "\nTotal: " + bodyJSON["cases"];
covidData = `
COVID CASES

${bodyJSON["country"]}

Today
Deaths: ${bodyJSON["todayDeaths"]}
Cases: ${bodyJSON["todayCases"]}
Critical: ${bodyJSON["critical"]}
Recovered: ${bodyJSON["todayRecovered"]}

Total
Deaths: ${bodyJSON["deaths"]}
Active: ${bodyJSON["active"]}
Cases: ${bodyJSON["cases"]}
Tests: ${bodyJSON["tests"]}
Recovered: ${bodyJSON["recovered"]}
`;
            bot.sendPhoto(chatId, bodyJSON["countryInfo"]["flag"], {caption: covidData});
            bot.sendMessage(chatId, "Done!", commands);
        } else {
            console.log("error");
        }
    })
}


// Crypto API
async function getCryptoData(chatId) {
    let data = await CoinGeckoClient.ping();
    let data2 = await CoinGeckoClient.coins.all();
    for(var i = 0; i < 10; i++){
        let data4 = await CoinGeckoClient.coins.fetch(data2["data"][i]["id"], {});

let cryptoData = `
${data2["data"][i]["market_data"]["market_cap_rank"]}. ${data2["data"][i]["name"]} - ${data2["data"][i]["symbol"]}

Price: \$${data2["data"][i]["market_data"]["current_price"]["usd"]}
High (24hr): \$${data2["data"][i]["market_data"]["high_24h"]["usd"]}
Low (24hr): \$${data2["data"][i]["market_data"]["low_24h"]["usd"]}
Change (24hr): ${data2["data"][i]["market_data"]["price_change_percentage_24h"]}%
Total Supply: \$${data2["data"][i]["market_data"]["total_supply"]}
Circulating Supply: \$${data2["data"][i]["market_data"]["circulating_supply"]}

Description:
${data4["data"]["description"]["en"].substring(0,830)}
`;
        await bot.sendPhoto(chatId, data2["data"][i]["image"]["large"], {caption: cryptoData});
    }
    bot.sendMessage(chatId, "Done!", commands);
    //console.log(data);
}


// Covid API
async function covidAPI(chatId)  {
    await request('https://corona.lmao.ninja/v2/countries/Ethiopia', function (error, response, body) {
        if (!error && response.statusCode === 200) {
            let bodyJSON = JSON.parse(body);
            let covidData = "COVID CASES \n\n" + bodyJSON["country"] + "\n\nToday: " + bodyJSON["todayCases"] + "\nTotal: " + bodyJSON["cases"];
covidData = `
${bodyJSON["country"]}

Today
Deaths: ${bodyJSON["todayDeaths"]}
Cases: ${bodyJSON["todayCases"]}
Critical: ${bodyJSON["critical"]}
Recovered: ${bodyJSON["todayRecovered"]}

Total
Deaths: ${bodyJSON["deaths"]}
Active: ${bodyJSON["active"]}
Cases: ${bodyJSON["cases"]}
Tests: ${bodyJSON["tests"]}
Recovered: ${bodyJSON["recovered"]}
`;
            bot.sendPhoto(chatId, bodyJSON["countryInfo"]["flag"], {caption: covidData});
            bot.sendMessage(chatId, "Done!", commands);
        } else {
            console.log("error");
        }
    })
}


bot.on("audio", async (msg) => {
    console.log(msg.audio);
    bot.sendMessage(msg.chat.id, "Adding to database...");
    await bot.downloadFile(msg.audio.file_id, "assets/music");    
    await getDownloadedSongs();
    fs.rename('assets/music/' + musicListArray[musicListArray.length - 1], 'assets/music/' + msg.audio.title + ".mp3", function(err) {
        if ( err ) console.log('ERROR: ' + err);
    });
    bot.sendMessage(msg.chat.id, "'" + msg.audio.title + "' has been added to database! ✅");
});

let musicListArray = [];
let musicList = {
    "reply_markup": {
        "keyboard": [
        ]
    }
};
function getDownloadedSongs(){
    console.log("hereeeeeeee");
    musicList = {
        "reply_markup": {
            "keyboard": [
            ]
        }
    };
    fs.readdirSync("assets/music").forEach(file => {
        console.log(file);
        musicList["reply_markup"]["keyboard"].push([file]);
        musicListArray.push(file);
    });    
}

// Convo
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    let msgReceived = "";
    try {
        msgReceived = msg.text.toString().toLowerCase();
    } catch (err){
        msgReceived = "abc";
        //console.log(msg.audio.duration.toString());
        bot.sendMessage(msg.audio["file_name"].toString());
    }

    // Hello
    let greetings = "Hello 👋 \n" +  msg.chat.first_name.toString() + ".";
    if(msgReceived.includes("hi") || msgReceived.includes("hello") || msgReceived.includes("hey")){
        bot.sendMessage(chatId, greetings, commands);
    }

    // Good Morning
    let goodMorning = "Good Morning! 🔆";
    if(msgReceived.includes("good morning") || msgReceived.includes("goodmorning") || msgReceived.includes("morning") || msgReceived.includes("gm")){
        bot.sendPhoto(chatId, "assets/picture/morning3.jpg", {caption: goodMorning});
    }

    // Good Night
    let goodNight = "Good night 🌙";
    if(msgReceived.includes("good night") || msgReceived.includes("goodnight") || msgReceived.includes("night") || msgReceived.includes("gn")){
        bot.sendPhoto(chatId, "assets/picture/moon3.jpg", {caption: goodNight});
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
    if(msgReceived.includes("save song")){
        bot.sendMessage(chatId, "Send me a song to save to the cloud...");
    }
    if(msgReceived.includes("send songs")){
        await getDownloadedSongs();
        bot.sendMessage(chatId, "Choose Song...", musicList);
    }
    if(msgReceived.includes("mp3")){
        bot.sendMessage(chatId, "Sending Song...");
        await bot.sendAudio(chatId, "assets/music/" + msgReceived);
        bot.sendMessage(chatId, "Done!", commands);
    }

    // Covid Stats
    if(msgReceived.includes("covid")){
        bot.sendMessage(chatId, "Sending Covid Stats...");
        await covidAPI(chatId);
    }

    // Crypto Prices
    if(msgReceived.includes("crypto")){
        bot.sendMessage(chatId, "Getting Crypto Prices...");
        await getCryptoData(chatId);
    }

    // About Me
    if(msgReceived.includes("about me")){
        let userProfile = "\nIs Bot: " + msg.from.is_bot + "\nType: " + msg.chat.type + "\nID: " + msg.chat.id + "\nFirst Name: " + msg.chat.first_name + "\nUsername: @" + msg.chat.username; 
        bot.sendMessage(chatId, "Your Profile...");
        bot.sendMessage(chatId, userProfile);
    }

    // Pinterest Downloader
    //Pinterest
    if(msgReceived.includes("download images")){
        bot.sendMessage(chatId, "Send me the image link...");
    }

    if((msgReceived.includes("jpg") == true) || (msgReceived.includes("png") == true) || (msgReceived.includes("gif") == true)){
        await bot.sendMessage(chatId, "Downloading...");
        await bot.sendPhoto(chatId, msgReceived);
        bot.sendMessage(chatId, "Done!");
    }
    if(msgReceived.includes("mp4")){
        await bot.sendMessage(chatId, "Downloading...");
        await bot.downloadFile(msgReceived, "assets/video");
        bot.sendMessage(chatId, "Done!");
    }


    
    
});





