const fetch = require('node-fetch');
const Discord = require('discord.js');
const { clientName, profilePicture, githubLink } = require('../config.json');
const gameModes = require('../assets/gameModes');
const lobbyTypes = require('../assets/lobbyTypes');
const User = require('../database/user')

module.exports = {
  name: 'steamid',
  description: 'Link your current Discord ID to your Steam ID',
  information: 'Stores or updates your steam ID (it should consist of only numbers and be the number that you see as your steam friend id or in your steam URL, or the number at the end of your dotabuff/ opendota URL). Once your steam ID is saved, you do not need to type your steamID the next time you use the opendota command. If you would like to remove your steamID info from the database, you can use `steamid 0`',
  aliases: false,
  args: true,
  usage: '[Steam32 ID]',
  example: '193480093',
  cooldown: 1,
  category: 'dota',
  execute (message, args) {
    const discordID = message.author.id;
    const steamID = args[0];

    const query = { discordID: discordID };
    const update = { steamID: steamID };
    const options = { returnNewDocument: true };

    // Remove steamID from the database
    if (steamID === '0') {
      User.remove(query)
        .then(() => {
          message.channel.send('Successfully removed steamID from database.');
        })
        .catch(err => message.channel.send(`${message.author} Failed to find and remove steamID ${err}`));
      return;
    }

    // Basic check if the steamID is valid
    if (isNaN(steamID) || isNaN(parseInt(steamID))) {
      message.channel.send(`${message.author} Invalid steamID. It should only consist of numbers`);
      return;
    }



    // Update the steamID in the database
    User.findOneAndUpdate(query, update, options).then(updatedDocument => {
        if (updatedDocument) {
          message.channel.send(`${message.author} Successfully updated Steam ID to be **${steamID}**`).then(() => {
            profile(steamID, message);
          })
        } else {
          const newUser = new User({ discordID, steamID });
          newUser.save()
            .then(() => {
              message.channel.send(`${message.author} Added Steam ID to be **${steamID}**`);
            }).then(() => {
              profile(steamID, message);
            })
            .catch(err => message.channel.send('Error: ' + err));
        }}).catch(err => message.channel.send(`${message.author} Failed to find and add/ update ID. ${err}`));
  }
};

async function profile (steamID, message) {
  const url = 'https://api.opendota.com/api/';

  Promise.all([
    fetch(`${url}players/${steamID}`),
    fetch(`${url}players/${steamID}/wl`),
    fetch(`${url}players/${steamID}/heroes`),
    fetch(`${url}heroes`),
    fetch(`${url}players/${steamID}/rankings`),
    fetch(`${url}players/${steamID}/recentMatches`)
  ])
    // Check for valid response
    .then(responses => checkAPIResponse(responses))

    // Convert data to .json
    .then(responses => Promise.all(responses.map(response => response.json())))

    // Extract and format data
    .then(data => formatData(data))

    // Add data onto embed
    .then(playerData => sendEmbed(playerData))
    .then(medal => {
      var role = message.guild.roles.cache.find(role => role.name === medal);
      let member = message.member;
      member.roles.add(role.id);
    })

    // Catch errors
    .catch(error => {
      console.log(error);
    });
}

// Check the status code of the API response
function checkAPIResponse (responses) {
  // Takes a long time to loop, can be optimised
  for (let i = 0; i < responses.length; i++) {
    if (responses[i].status != 200) {
      throw Error('Invalid API response, check that the id was correct!');
    }
  }
  return responses;
}

// Collect data from opendota api and return object containing data
function formatData (data) {
  // Destructure data
  const [profile, wl, playerHeroes, heroes, rankings, recentMatches] = data;

  // Check for missing profile data
  if (!profile || !profile.profile) {
    throw Error('Unable to retrieve dota profile. Is your profile public and have you played matches?');
  }

  // Profile details
  const p = profile;
  p.w = wl.win;
  p.l = wl.lose;
  p.wr = (100 * p.w / (p.w + p.l)).toPrecision(4);
  if (!p.profile.loccountrycode) p.profile.loccountrycode = 'Unknown';

  // Top 3 heroes
  p.heroes = [];
  for (let i = 0; i < 3; i++) {
    p.heroes.push(playerHeroes[i]);
    p.heroes[i].name = idToHeroName(heroes, playerHeroes[i].hero_id);
    p.heroes[i].winAs = (100 * p.heroes[i].win / p.heroes[i].games).toPrecision(2);
    p.heroes[i].percentile = idToHeroRanking(rankings, p.heroes[i].hero_id);
  }

  // Most recent match
  p.recent = recentMatches[0];
  p.recent.time = new Date(p.recent.start_time * 1000).toString().substr(0, 15);
  p.recent.skill = ['invalid', 'normal', 'high', 'very high'][p.recent.skill];
  p.recent.hero = idToHeroName(heroes, p.recent.hero_id);

  // Find game mode and lobby
  try {
    p.recent.game_mode = gameModes[p.recent.game_mode].replace(/_/g, ' ');
  } catch {
    p.recent.game_mode = '';
  }
  try {
    p.recent.lobby_type = lobbyTypes[p.recent.lobby_type].replace(/_/g, ' ');
  } catch {
    p.recent.lobby_type = '';
  }
  if (p.recent.lobby_type == '' && p.recent.game_mode == '') {
    p.recent.lobby_type = 'match';
  }

  // Check if they've won or lost
  p.recent.outcome = 'Lost';
  if ((p.recent.player_slot < 6 && p.recent.radiant_win) ||
    (p.recent.player_slot > 5 && !p.recent.radiant_win)) {
    p.recent.outcome = 'Won';
  }

  return p;
}

// Format data and send an embed to channel with details
function sendEmbed (p) {
  return medal(p);
}

function medal (player) {
  if (player.rank_tier == null) return 'unranked';
  if (player.leader_board) return `Immortal ** | rank **${player.leaderboard_rank}`;
  if (player.rank_tier[0] == 8) return 'Immortal';
  const medalTier = player.rank_tier.toString();
  const medals = ['Lower than Herald?', 'Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine'];
  return `${medals[medalTier[0]]} ${medalTier[1]}`;
}  


// Return a hero ranking given the hero id and list of ranking details
function idToHeroRanking (rankings, heroId) {
  for (let i = 0; i < rankings.length; i++) {
    if (rankings[i].hero_id == heroId) {
      return `${+(100 * rankings[i].percent_rank).toFixed(2)}%`;
    }
  }
  return 'Unknown';
}

// Return a hero name given the hero id and list of hero details
function idToHeroName (heroes, heroId) {
  for (let i = 0; i < heroes.length; i++) {
    if (heroes[i].id == heroId) {
      return heroes[i].localized_name;
    }
  }
  return 'Unknown';
}