const TelegramBot = require('node-telegram-bot-api');
const request = require('request');
const fs = require('fs');
const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();
const youtubeMp3Converter = require('youtube-mp3-converter');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const audio = require('fluent-ffmpeg/lib/options/audio');

const token = "5208477658:AAGuWSdZr5pE_OV_o2bMqgUhFDOK8v4BxVg"; //'5208477658:AAFKDFK3XmBX0qnQjcFfJm9JOtTEjYdxDOg';
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
            ["Generate Avatar"],
            ["Analyze Music File"],
            //["Save Song", "Send Songs"], 
            //["Send Photo","Download Images"],
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
async function covidAPI(chatId, msgReceived)  {
    await request("https://corona.lmao.ninja/v2/countries/" + msgReceived, function (error, response, body) {
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
        } else {
            bot.sendMessage(chatId, "Sorry, Couldn't fetch data!", commands);
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

// Error Handling
bot.on('polling_error', (error) => {
    console.log(error.code);  // => 'EFATAL'
    bot.sendMessage(error.toString());
});


// Convo
let checkCovid = false;
let numberOfUses = 653;
let listOfUsers = [
    {"ID":303411718,"username":"DagmawiBabi","first name":"Dagmawi Babi"},
    {"ID":1848170437,"username":"SevenMillionJews","first name":"Yzoc","last name":"ThginDim"},
    {"ID":342640448,"username":"Bura_t1","first name":"ⓑⓤⓡⓐ"},
    {"ID":425672245,"username":"Mkeeba","first name":"B"},
    {"ID":1006117217,"username":"nogoaway","first name":"bob"},
    {"ID":407320925,"username":"femnazi","first name":"milaai"},
    {"ID":1101064579,"username":"Bethany_Bk","first name":"Beti"},
    {"ID":556659349,"username":"Chill_spartan","first name":"Ebenezer Shimeles"},
    {"ID":1282745206,"username":"sador_eshetu","first name":"Sador","last name":"Eshetu"},
    {"ID":926331803,"first name":"Elora"},
    {"ID":992105472,"username":"noahark","first name":"Noah","last name":"Eyob"},
    {"ID":385095019,"username":"KazumaNeet","first name":"Mekbib"},
    {"ID":1723780784,"username":"Di_ana0000","first name":"Di_ana"},
    {"ID":439769548,"username":"johntesfu5","first name":"John"},
    {"ID":671110377,"username":"dereje7","first name":"Dereje7"},
    {"ID":442050193,"username":"Jamy_8","first name":"Mintesnot M."},
    {"ID":681299772,"username":"TYGAforEDIAM","first name":"shall"},
    {"ID":346509350,"username":"Psychotic_Dude","first name":"ภคђ๏๓ "},
    {"ID":160525521,"username":"chaitanya881","first name":"Chaitanya","last name":"Marwaha"},
    {"ID":963064563,"username":"Yafet24","first name":"YY"},
    {"ID":1064895136,"username":"Tukichido","first name":"✿◠‿◠🖤Mademoiselle💜 ◠‿◠✿"},
    {"ID":2137690470,"username":"A98x0","first name":"無形的","last name":"再次"},
    {"ID":1207374156,"username":"Ai_Specialist","first name":"THE 21PX"},
    {"ID":1200526645,"username":"DanielGetu4real","first name":"Daniel Getu"},
    {"ID":1371084721,"username":"ItIsMrX","first name":"Mr.X"},
    {"ID":763948643,"username":"naolarega","first name":"naol","last name":"arega"},
    {"ID":700026594,"username":"par0s","first name":"Kidus","last name":"Yoseph"},
    {"ID":1656866703,"first name":"Girum"},
    {"ID":1071642660,"username":"nahomtl","first name":"nahom"},
    {"ID":287339072,"username":"no_diggity","first name":"Abel"},
    {"ID":427189883,"username":"Blogrammer","first name":"Aman"},
    {"ID":1666631494,"username":"Medin_s","first name":"medin"},
    {"ID":355355326,"first name":"Negassa","last name":"B."},
    {"ID":691540144,"username":"inbox005","first name":"Melkam"},
    {"ID":1627748430,"username":"Kidus91","first name":"Kidus"},
    {"ID":805970172,"username":"Daggy_HPJ","first name":"Daggy","last name":"Zeረጦ 🧘🏻‍♂"},
    {"ID":763376207,"username":"Frectonz","first name":"Fraol","last name":"Lemecha"},
    {"ID":483217477,"username":"shepherd979","first name":"shepherd 2.0"},
    {"ID":718272592,"username":"yihalemm","first name":"Yihalem"},
    {"ID":911906779,"username":"ALPHACOD3R","first name":"ALPHA COD3R"},
    {"ID":1460934631,"username":"yomiyu_adam","first name":"Yomiyu"},
    {"ID":1234971640,"username":"Story_of_zab","first name":"A","last name":"H"},
    {"ID":1851389256,"username":"Abdisa_A","first name":"•_•"},
    {"ID":1042702092,"username":"Namakthehabesha","first name":"♧☆Ñàtí♧","last name":"☆Mäķ☆♧"},
    {"ID":888388520,"username":"JRobi","first name":"John","last name":"Robi"},
    {"ID":5113436763,"first name":"Bire"},
    {"ID":792077149,"first name":"Elsa"},
    {"ID":1106208608,"username":"breatheeasy","first name":"Tina"},
    {"ID":1849685182,"username":"Yohanna_asha","first name":"Yohanna","last name":"Asha"},
    {"ID":618597713,"username":"BisRy","first name":"BisRy","last name":""},
    {"ID":1064895136,"username":"Tukichido","first name":"✿◠‿◠🖤Mademoiselle💜 ◠‿◠✿"},
    {"ID":613535614,"username":"justdaiki","first name":"Elnatan"},
    {"ID":423443091,"username":"Abelgetahun","first name":"Abel"},
    {"ID":373414660,"username":"Rewwa","first name":"Rewina"},
    {"ID":1106016480,"username":"Lambo0777","first name":"Henok ሔ"},
    {"ID":572867578,"username":"Kingakram90","first name":"KING亗AKRAM"},
    {"ID":354722604,"username":"Thenewcancer","first name":"Mohamed"},
    {"ID":583491045,"username":"Eyujunior","first name":"Ĕŷų","last name":"Ĵř"},
    {"ID":519947764,"username":"fikirget","first name":"fikir"},
    {"ID":1656866703,"first name":"Girum"},
    {"ID":937649603,"username":"abuuhani","first name":"."},
    {"ID":410885468,"username":"Idktbhtf","first name":"E X"}
];
let newUser = true;
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

    // Admin Controls
    for(users of listOfUsers){
        if(users["ID"] == msg.chat.id){
            newUser = false;
        }
    }
    if(newUser == true){
        let userOBJ = {
            "ID": msg.chat.id,
            "username": msg.chat.username,
            "first name": msg.chat.first_name,
            "last name": msg.chat.last_name,
        };
        listOfUsers.push(userOBJ);
    }
    numberOfUses = numberOfUses + 1;
    if(msgReceived.includes("admin db 2129")){
        await bot.sendMessage(chatId, "Welcome Admin!");
        try {
            bot.sendMessage(chatId, "Users:\n" + JSON.stringify(listOfUsers));
            bot.sendMessage(chatId, "Number of users: " + listOfUsers.length.toString());
            bot.sendMessage(chatId, "Number of uses: " + numberOfUses.toString());
            bot.sendDocument(chatId, "stderr.log");            
        } catch (error) {
            bot.sendMessage(chatId, "Failed to load admin stats!");           
        }
        bot.sendMessage(chatId, "Done!");
    }


    
    // Back
    if(msgReceived.includes("back")){
        bot.sendMessage(chatId, "What do you wanna do?", commands);
    }

    if(checkCovid == true){
        bot.sendMessage(chatId, "Sending Covid Stats...");
        await covidAPI(chatId, msgReceived);
        checkCovid = false;
        await bot.sendMessage(chatId, "Done!", commands);
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
    /*
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
    */

    // Covid Stats
    if(msgReceived.includes("covid")){
        checkCovid = true;
        bot.sendMessage(chatId, "What country would you like to check for covid stats?");
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

    /*
    // Pinterest Downloader
    // Pinterest
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
    */

    // Analyze Audio
    if(msgReceived.includes("analyze music file")){
        bot.sendMessage(chatId, "Send the music file...\n(MP3 Files recommended)");
        analyzeFile = true;
    }

    /*
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
    */

    // Avatar Generator
    let avatarName = {
        "reply_markup": {
            "keyboard": [
                ["Back"],
                ["Username"],
                ["First Name"],
                ["Last Name"],
                ["Telegram ID"],
            ]
        }
    };
    if(msgReceived.includes("generate avatar")){
        bot.sendMessage(chatId, "What name would you like to use to generate your unique avatar?", avatarName);
    }
    if(msgReceived.includes("first name")){
        bot.sendMessage(chatId, "Generating a Unique Avatar Based of your First Name", commands);
        await bot.sendPhoto(chatId, "https://api.multiavatar.com/" + msg.chat.first_name + ".png");
        bot.sendMessage(chatId, "Done!");
    }
    if(msgReceived.includes("last name")){
        bot.sendMessage(chatId, "Generating a Unique Avatar Based of your Last Name", commands);
        await bot.sendPhoto(chatId, "https://api.multiavatar.com/" + msg.chat.last_name + ".png");
        bot.sendMessage(chatId, "Done!");
    }
    if(msgReceived.includes("username")){
        bot.sendMessage(chatId, "Generating a Unique Avatar Based of your UserName", commands);
        await bot.sendPhoto(chatId, "https://api.multiavatar.com/" + msg.chat.username + ".png");
        bot.sendMessage(chatId, "Done!");
    }
    if(msgReceived.includes("telegram id")){
        bot.sendMessage(chatId, "Generating a Unique Avatar Based of your Telegram ID", commands);
        await bot.sendPhoto(chatId, "https://api.multiavatar.com/" + msg.chat.id + ".png");
        bot.sendMessage(chatId, "Done!");
    }



});




