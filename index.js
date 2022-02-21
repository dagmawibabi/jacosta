const TelegramBot = require('node-telegram-bot-api');
const request = require('request');
const fs = require('fs');
const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();
const youtubeMp3Converter = require('youtube-mp3-converter');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const audio = require('fluent-ffmpeg/lib/options/audio');

const token = '5208477658:AAHz6MzRo-5wKstgpJcYMLO3O5EeesMGT2Q';
const bot = new TelegramBot(token, {polling: true});

//
bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"
  bot.sendMessage(chatId, resp);
});

// Commands
let commands = {
    "reply_markup": {
        "keyboard": [
            ["Hello"],
            ["About Me"],
            ["Analyze Music File"],
            ["Save Song", "Send Songs"], 
            ["Send Photo","Download Images"],
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

let albumArtTemp = "";
function getTempFiles(){
    fs.readdirSync("assets/temp").forEach(file => {
        albumArtTemp = file;
    });   
}

// 
let analyzeFile = false;
bot.on("audio", async (msg) => {
    if(analyzeFile == true){
        try {
            // Duration
            let duration = msg.audio.duration;
            let minutes = Math.floor(duration / 60);
            let seconds = duration - minutes * 60;
            let hours = Math.floor(duration / 3600);
            //console.log(msg.audio);
            let fileDetails = "Filename: " + msg.audio.file_name + "\nTitle: " + msg.audio.title + "\nPerformer: " + msg.audio.performer + "\nDuration: " + hours.toString() + ":" + minutes.toString() + ":" + seconds.toString() + "\nFile Size: " + Math.floor(Math.ceil(msg.audio.file_size / 1024)/1024).toString() + "mbs" + "\nMime Type: " + msg.audio.mime_type;
    
            await bot.downloadFile(msg.audio.thumb.file_id, "assets/temp");
            await getTempFiles();
    
            await bot.sendMessage(msg.chat.id, "Here are the file details...");        
            await bot.sendPhoto(msg.chat.id, "assets/temp/" + albumArtTemp, {caption: fileDetails});
            //await bot.sendPhoto(msg.chat.id, "assets/picture/musicIcon.jpg", {caption: fileDetails});
            bot.sendMessage(msg.chat.id, "Done!");        
    
            await fs.rmSync("assets/temp/" + albumArtTemp);
        } catch (error) {
            bot.sendMessage(msg.chat.id, "Sorry,\nSong Can't Be Analyzed.\nTry another song!");            
        }
        analyzeFile = false;
    } else {
        if(msg.audio.title.includes("\"")){
            bot.sendMessage(msg.chat.id, "Sorry,\nSong can't contain quotes in the title! \nTry Again!");
        } else {
            bot.sendMessage(msg.chat.id, "Adding to database...");
            await bot.downloadFile(msg.audio.file_id, "assets/music");    
            await getDownloadedSongs();
            for(song of musicListArray){
                if(song.includes("file")){
                    await fs.renameSync(('assets/music/' + song), ('assets/music/' + msg.audio.title + ".mp3"), function(err) {
                        if ( err ){
                            fs.rm('assets/music/' + song);
                        };
                    });
                }
            }
            bot.sendMessage(msg.chat.id, "'" + msg.audio.title + "' has been added to database! ✅");
        }
    }
});

let musicListArray = [];
let musicList = {
    "reply_markup": {
        "keyboard": [
        ]
    }
};
function getDownloadedSongs ()  {
    musicListArray = [];
    musicList = {
        "reply_markup": {
            "keyboard": [
                ["Back"],
            ]
        }
    };
    fs.readdirSync("assets/music").forEach(file => {
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

    if(msgReceived.includes("back")){
        bot.sendMessage(chatId, "What do you wanna do?", commands);
    }

    // Hello
    let greetings = "Hello 👋 \n" +  msg.chat.first_name.toString() + ".";
    if(msgReceived.includes("hi") || msgReceived.includes("hello") || msgReceived.includes("hey")){
        bot.sendMessage(chatId, greetings, commands);
    }

    // Thank You
    if(msgReceived.includes("thank you")){
        bot.sendMessage(chatId, "You're very welcome!");
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
        try {
            const stream = fs.createReadStream("assets/music/" + msgReceived);
            await bot.sendAudio(chatId, stream);            
        } catch (error) {
            await bot.sendAudio(chatId, "assets/music/" + msgReceived);
        }
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

    // Download Video
    if(msgReceived.includes("mp4")){
        await bot.sendMessage(chatId, "Downloading...");
        await bot.downloadFile(msgReceived, "assets/video");
        bot.sendMessage(chatId, "Done!");
    }

    // Analyze Audio
    if(msgReceived.includes("analyze music file")){
        bot.sendMessage(chatId, "Send the music file...");
        analyzeFile = true;
    }

    // Youtube to mp3
    let pathToMp3 = "";
    if(msgReceived.includes("youtube")){
        bot.sendMessage(chatId, "Downloading...");
        let pathToSaveFiles = "assets/music";
        let convertLinkToMp3 = youtubeMp3Converter(pathToSaveFiles);
        console.log(pathToMp3);
        pathToMp3 = await convertLinkToMp3('https://www.youtube.com/watch?v=J_ub7Etch2U');
        console.log(pathToMp3);
    }
});




