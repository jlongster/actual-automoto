const getDiscordClient = require('automoto/clients/discord');
const writeDiscordEmbed = require('automoto/actions/write-discord-embed');
const redditPosts = require('automoto/sources/reddit-posts');
const RedditPost = require('automoto/entities/RedditPost');

module.exports = config => async app => {
  let discord = await getDiscordClient(config.discord);
  let channel = await discord.channels.fetch('939022701811601519');

  for await (let post of await redditPosts('actualbudget')) {
    await writeDiscordEmbed(channel, new RedditPost(post).toDiscordEmbed());
  }
};
