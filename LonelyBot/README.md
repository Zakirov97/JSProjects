# Discord Lonely Bot

Link to add to your server [here](https://discord.com/oauth2/authorize?client_id=647044127313362980&scope=bot&permissions=0).

## Table Of Contents
1. [Current Capabilities](#Current_Capabilties)
2. [Example usages](#Example_Usages)
3. [Setup](#Setup)
4. [Extra Information](#Extra_Information)


## Current Capabilities <a name="Current_Capabilties"></a>
- [x] Can calculate the area of the stat pentagon in dota
- [x] Can fetch data from Opendota API about a player
- [x] Use database to hold discord ID and steam32 ID
- [x] Aggregate winrates to find ideal counters/ synergies
- [x] Dank memes
- [ ] Spicy algorithm

## Example Usages <a name="Example_Usages"></a>
| Command name | Example |
|---|---|
|`help`|![help command example](https://i.imgur.com/pdmNJWq.png)|
|`steamid`|![steamid command example](https://i.imgur.com/DtaQ7dF.png)|
|`profile`|![profile command example](https://i.imgur.com/7Pjjnrk.png)|
|`counter`|![counter command example](https://i.imgur.com/wAvEkgj.png)|


## Setup <a name="Setup"></a>
First, set the following environment variables 

|Environment variable|Value|
|---|---|
| `BOT_TOKEN`| Discord bot token |
| `BOT_URI` | Mongodb connection uri | 
</br>

Ensure that you have node and npm installed, and run
```bash
# Install dependencies
npm install

# Run the bot
node index.js
```

## Extra Information <a name="Extra_Information"></a>
- The bot is named lonely bot after Lone Druid a Dota 2 hero who has a cool bear.
- Heroku runs whatever code is on the master branch - so keep that branch clean!
"# JSProjects" 
