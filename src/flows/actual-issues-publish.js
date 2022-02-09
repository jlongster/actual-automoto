const getRoamClient = require('automoto/clients/roam');
const getDiscordClient = require('automoto/clients/discord');
const githubWebhook = require('automoto/sources/github-webhook');
const githubIssueToDiscord = require('automoto/actions/github-issue-to-discord');
const GithubIssue = require('automoto/entities/github-issue');

let issuePageId = '8cE1fsMHq';

async function findIssueBlock(roam, id) {
  let query = `
      [:find ?uid :where
        [?b :block/string ?string]
        [(clojure.string/includes? ?string "[issue: ${id}]")]
        [?b :block/uid ?uid]
      ]`;

  let res = await roam.runQuery(query);
  return res.length === 0 ? null : res[0][0];
}

module.exports = config => async app => {
  let roam = await getRoamClient(config.roam);
  let discord = await getDiscordClient(config.discord);
  let channel = await discord.channels.fetch('939018411458068481');

  console.log('Listening to github webhook for Actual (issues)...');

  for await (let data of await githubWebhook(app, config.github)) {
    console.log('Github webhook fired (discussions)', data.action);

    if (data.issue) {
      console.log('actual-issues-publish is handling github webhook event');
      let issue = new GithubIssue(data.issue);

      // Update roam
      if (data.action === 'opened') {
        await roam.createBlock(issue.toRoamBlock(), issuePageId, 0);
      } else if (
        data.action === 'closed' ||
        data.action === 'reopened' ||
        (data.action === 'edited' && data.changes.title) ||
        data.action === 'labeled'
      ) {
        let uid = await findIssueBlock(roam, issue.number);
        if (uid) {
          await roam.updateBlock(issue.toRoamBlock(), uid);
        } else {
          await roam.createBlock(issue.toRoamBlock(), issuePageId, 0);
        }
      }

      await githubIssueToDiscord(channel, data);
    }
  }
};
