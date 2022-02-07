const roamTodo = require('../sources/roam-todo');
const getGithubClient = require('../clients/github');

module.exports = config => async app => {
  let github = await getGithubClient(config.github);

  for await (let data of await roamTodo(app, config.roamPush)) {
    let { issue, fields } = data;

    if (issue != null && issue !== '') {
      console.log('Updating', issue, fields);
      try {
        await github.rest.issues.update({
          owner: 'actualbudget',
          repo: 'releases',
          issue_number: issue,
          ...fields
        });
      } catch (err) {
        console.log('Updating issue failed: ' + err.message);
      }
    } else {
      console.log('Creating', fields);
      try {
        await github.rest.issues.create({
          owner: 'actualbudget',
          repo: 'releases',
          title: fields.title,
          body:
            '_This issue was automatically created by a bot from an internal issue. It may not follow the standard template for these reasons. It is an acknowledgement of a bug and more details are to come if needed._'
        });
      } catch (err) {
        console.log('Creating issue failed: ' + err.message);
      }
    }
  }
};
