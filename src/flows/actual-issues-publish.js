const getRoamClient = require('automoto/clients/roam');
const getDiscordClient = require('automoto/clients/discord');
const githubWebhook = require('automoto/sources/github-webhook');
const githubIssueToDiscord = require('automoto/actions/github-issue-to-discord');

module.exports = config => async app => {
  let discord = await getDiscordClient(config.discord);
  let channel = await discord.channels.fetch('939018411458068481');

  console.log(`Listening to github webhook for Actual (${config.name})...`);

  for await (let data of await githubWebhook(app, config.github)) {
    console.log('Github webhook fired (issues)', data.action);

    if (data.issue || data.pull_request) {
      console.log('actual-issues-publish is handling github webhook event');
      await githubIssueToDiscord(channel, data);
    }
  }
};
