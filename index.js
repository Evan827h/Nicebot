const Discord = require('discord.js');
const fs = require('fs');
const fetch = require('node-fetch');
require('dotenv').config();

const client = new Discord.Client();
const botName = 'NiceBot#3174';
const file = 'marked.json';
var json;


//on ready
client.on('ready', () => {
    console.log("I'm online");
    client.user.setPresence({
        status: 'online',
        activity: {
            name: "Love and Kindness",
            type: "PLAYING"
        }
    });
});


//getting json marked object
try {
    var data = fs.readFileSync(file, 'utf8');
    json = JSON.parse(data);
  } catch (err) {
    console.error(err)
  }

  //on join add server data to json
client.on("guildCreate", guild => {
    json.servers.forEach(element => {
        if(element.id === guild.id){
            return;
        }
    });
    var guildID = guild.id.toString();
    var guild = {id: guildID, marked: [], owner: "", prefix: "!"};
    json.servers.push(guild);
    fs.writeFile(file, JSON.stringify(json), (err) => {
        if (err) {
          console.error(err)
          return
        }
    });
});


//on leave remove server data from json
client.on("guildDelete", guild => {
    var guildID = guild.id.toString();
    var arr = [];
    for(var i = 0; i < json.servers.length; i++){
        if(json.servers[i].id == guildID) {
            arr.push(i)
        }
    }
    for(var i = 0; i < arr.length; i++){
        json.servers.splice(arr[i],1);
    }
    fs.writeFile(file, JSON.stringify(json), (err) => {
        if (err) {
          console.error(err)
          return
        }
    });
});

//on message send
client.on('message', message => {

    //set Guild reference, owner reference, and prefix to know what server to look in the json
    var guildIndex;
    var ownerID
    var prefix;
    for(var i = 0; i < json.servers.length; i++) {
        if(json.servers[i].id == message.guild.id) {
            guildIndex = i;
            ownerID = json.servers[i].owner;
            prefix = json.servers[i].prefix;
            break;
        }
    }

    //if a marked user sends a message bot replies with a compliemt
    for(var i = 0; i < json.servers[guildIndex].marked.length; i++){
        if(message.author.tag == json.servers[guildIndex].marked[i]) {
            try{
                fetch('https://complimentr.com/api')
                    .then(res => res.json())
                    .then(json => {
                        message.channel.send('<@' + message.author.id +'> ' + json.compliment);
                });
            }catch(e){
                console.error(e);
            }
        }
    }

    //check if a message starts with the prefix
    if(!message.content.startsWith(prefix) || message.author.bot) return;

    //get args
    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    //Adds a user to the marked list
    if(command === 'mark' && message.author.id == ownerID && args[0] != botName){

        //checks if user is a member of current guild
        var exists = false;
        message.guild.members.cache.each(cache => {
            if(args[0] == cache.user.tag) {
                exists = true;
            }
        });
        if(!exists) {
            message.channel.send("User is not in this Server!");
            return;
        }

        for(var i = 0; i < json.servers[guildIndex].marked.length; i++){
            //check if already added
            if(args[0] == json.servers[guildIndex].marked[i]) {
                message.channel.send("I Already Love them.")
                return;
            }
        }

        json.servers[guildIndex].marked.push(args[0].toString());
        message.channel.send("I'm Their #1 Fan!");

        fs.writeFile(file, JSON.stringify(json), (err) => {
            if (err) {
              console.error(err)
              return
            }
        });
    }

    //removes user from marked list
    else if(command === 'stop' && message.author.id == ownerID){
        for(var i = 0; i < json.servers[guildIndex].marked.length; i++){
            if(args[0] == json.servers[guildIndex].marked[i])
            {
                json.servers[guildIndex].marked.splice(i,1);
                message.channel.send("Sorry, I'll stop");
                fs.writeFile(file, JSON.stringify(json), (err) => {
                    if (err) {
                      console.error(err)
                      return
                    }
                });
                return;
            }
        }
        message.channel.send("I Couldn't find them.");
    }
    
    //sets the owner of the bot can only be set once
    else if(command === 'owner' && json.servers[guildIndex].owner == ""){
        var exists = false;
        var id;
        message.guild.members.cache.each(cache => {
            if(args[0] == cache.user.tag) {
                id = cache.user.id;
                exists = true;
            }
        });
        if(!exists) {
            message.channel.send("User is not found! \nType: !owner [User tag] to set an owner.\n EX: !Owner user#1234");
            return;
        }
        json.servers[guildIndex].owner = id;
        fs.writeFile(file, JSON.stringify(json), (err) => {
            if (err) {
              console.error(err)
              return
            }
        });
        message.channel.send("I only Listen to you (this cannot be changed ever!)");
    }

    //prefix command
    else if(command === 'prefix' && message.author.id == ownerID){
        if(args.length > 1 || args.length < 1){
            message.channel.send("One word only try again!");
            return;
        } else if(args[0].length > 1){
            message.channel.send("One character only! try again.");
            return;
        } else {
            prefix = args[0];
            json.servers[guildIndex].prefix = prefix;
            fs.writeFile(file, JSON.stringify(json), (err) => {
                if (err) {
                  console.error(err)
                  return
                }
            });
            message.channel.send("Changed the server prefix to " + prefix);

        }
    }

    //help command
    else if(command === 'help'){
        message.channel.send("Welcome to NiceBot the bot designed to somother someone in love and kindess.\n-\n-Start by setting an owner, I will only listen to whoever the owner is and this cannot be changed until I leave your server!\n-\n-" + prefix + "owner [tag] - Sets the owner of the server, use full discord name including numbers (user#1234) \n-\n-" + prefix + "prefix [prefix]- change the prefix command\n-\n-" + prefix + "mark [tag]- Add a user to be marked by me so I compliment them whenever they send a message! Multiple users can be added. (!mark user#1234)\n-\n-" + prefix + "stop [tag]- removes a user from the marked list");
    }
})
client.login(process.env.DISCORD_TOKEN);
