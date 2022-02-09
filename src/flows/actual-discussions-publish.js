const getDiscordClient = require('automoto/clients/discord');
const githubWebhook = require('automoto/sources/github-webhook');
const writeDiscordEmbed = require('automoto/actions/write-discord-embed');
const GithubDiscussion = require('automoto/entities/github-discussion');
const GithubComment = require('automoto/entities/github-comment');

module.exports = config => async app => {
  let discord = await getDiscordClient(config.discord);
  let channel = await discord.channels.fetch('939018437458534461');

  console.log('Listening to github webhook for Actual (discussions)...');

  for await (let data of await githubWebhook(app, config.github)) {
    console.log('Github webhook fired (discussions)', data.action);
    if (data.action === 'created' && data.discussion) {
      console.log(
        'actual-discussions-publish is handling github webhook event'
      );

      let discussion = new GithubDiscussion(data.discussion);
      let entity;
      if (data.comment == null) {
        entity = discussion;
      } else {
        entity = new GithubComment(data.comment, discussion);
      }

      await writeDiscordEmbed(channel, entity.toDiscordEmbed());
    }
  }
};
