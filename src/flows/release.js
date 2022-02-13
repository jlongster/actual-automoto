const getGithubClient = require('automoto/clients/github');

module.exports = config => async app => {
  const github = await getGithubClient(config.botAuth);

  app.post('/release/:version', async (req, res) => {
    let token = req.header('x-release-token');

    if (token !== config.headerToken) {
      res.status(403).send();
      return;
    }

    let version = req.params.version;
    if (version == null || version == '') {
      res.status(400).send('bad');
    }

    let issues = await github.rest.issues.listForRepo({
      owner: 'actualbudget',
      repo: 'releases',
      labels: version + '-next'
    });

    for (let issue of issues.data) {
      await github.rest.issues.update({
        owner: 'actualbudget',
        repo: 'releases',
        issue_number: issue.number,
        state: 'closed'
      });
    }

    await github.rest.issues.updateLabel({
      owner: 'actualbudget',
      repo: 'releases',
      name: version + '-next',
      new_name: version
    });

    res.send('ok');
  });
};
