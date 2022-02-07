const getDiscordClient = require('automoto/clients/discord');
const getRoamClient = require('automoto/clients/roam');
const discordReaction = require('automoto/sources/discord-reaction');
const discordReactToRoam = require('automoto/actions/discord-react-to-roam');

module.exports = config => async app => {
  let discord = await getDiscordClient(config.discord);
  let roam = await getRoamClient(config.roamAuth);

  console.log('Listening to discord reactions');

  for await (let reaction of await discordReaction(config.discord)) {
    discordReactToRoam(discord, roam, reaction);
  }
};
