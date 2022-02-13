const getGithubClient = require('automoto/clients/github');
const githubWebhook = require('automoto/sources/github-webhook');

module.exports = config => async app => {
  const github = await getGithubClient(config.botAuth);

  for await (let data of await githubWebhook(app, config.githubCode)) {
    if (
      data.commits &&
      data.ref === `refs/heads/${data.repository.master_branch}`
    ) {
      for (let commit of data.commits) {
        let re = /ref https:\/\/github.com\/actualbudget\/releases\/issues\/(\d+)/g;
        let m;
        while ((m = re.exec(commit.message))) {
          let num = parseInt(m[1]);

          await github.rest.issues.addLabels({
            owner: 'actualbudget',
            repo: 'releases',
            issue_number: num,
            labels: ['fixed']
          });
        }
      }
    }
  }
};
