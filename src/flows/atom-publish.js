const getDiscordClient = require('automoto/clients/discord');
const writeDiscordEmbed = require('automoto/actions/write-discord-embed');
const atomFeed = require('automoto/sources/atom-feed');
const AtomFeedEntry = require('automoto/entities/atom-feed-entry');

module.exports = config => async app => {
  let discord = await getDiscordClient(config.discord);
  let channel = await discord.channels.fetch(config.channel);

  for await (let post of await atomFeed(config.url)) {
    await writeDiscordEmbed(channel, new AtomFeedEntry(post).toDiscordEmbed());
  }
};
