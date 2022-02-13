const getGithubClient = require('automoto/clients/github');
const githubWebhook = require('automoto/sources/github-webhook');

function getRelease(labels) {
  for (let label of labels) {
    let m = label.name.match(/(\d+\.\d+\.\d+)/);
    if (m) {
      return {
        version: m[1],
        next: label.name.endsWith('-next'),
        fullName: label.name
      };
    }
  }
  return null;
}

function addComment(github, issueNum, content) {
  return github.rest.issues.createComment({
    owner: 'actualbudget',
    repo: 'releases',
    issue_number: issueNum,
    body: content
  });
}

module.exports = config => async app => {
  const github = await getGithubClient(config.botAuth);

  for await (let data of await githubWebhook(app, config.github)) {
    if (data.issue) {
      let issueNum = data.issue.number;

      if (data.action === 'labeled') {
        if (data.label.name === 'wontfix') {
          let release = getRelease(data.issue.labels);
          if (release) {
            await github.rest.issues.removeLabel({
              owner: 'actualbudget',
              repo: 'releases',
              issue_number: issueNum,
              name: release.fullName
            });
          }

          await github.rest.issues.update({
            owner: 'actualbudget',
            repo: 'releases',
            issue_number: issueNum,
            state: 'closed'
          });
        } else if (data.label.name === 'fixed') {
          let release = getRelease([data.label]);
          let text;
          if (release) {
            text =
              "The fix will be deployed in version ${release.version} and we'll close this issue when that happens.";
          } else {
            text =
              "The fix will go out in the next version and we'll close this issue when that happens.";
          }
          await addComment(
            github,
            issueNum,
            `This issue has been fixed, but it hasn't been deployed yet. ${text}`
          );
        } else {
          let release = getRelease([data.label]);
          if (release && release.next) {
            // Queued for the next release
            await addComment(
              github,
              issueNum,
              `This issue is planned to be fixed in the next release \`${release.version}\`. We'll notify when the fix is implemented, and this issue will be closed when the new release is available.`
            );
          }
        }
      } else if (data.action === 'unlabeled') {
        let wontfix = data.issue.labels.find(l => l.name === 'wontfix');
        if (!wontfix) {
          let release = getRelease([data.label]);
          if (release && release.next) {
            // Taken out of next release
            await addComment(
              github,
              issueNum,
              "This issue has been taken out of the next release unfortunately so we can focus on other issues. We'll try to triage it into another release soon."
            );
          }
        }
      } else if (data.action === 'closed') {
        let wontfix = data.issue.labels.find(l => l.name === 'wontfix');
        if (wontfix) {
          // not gonna fix
          await addComment(
            github,
            issueNum,
            "This issue has been closed as \"wontfix\". This could be because another fix is already in works, this part of the app is about to change a lot, or we aren't going to move forward with this ask. If there isn't sufficient reason and you want to to know more, please ask and we'll explain more!"
          );
        } else {
          let release = getRelease(data.issue.labels);
          if (release) {
            // fixed, available in specific release
            await addComment(
              github,
              issueNum,
              `The fix for this issue has been deployed in version \`${release.version}\`. Let us know if it doesn't work!`
            );
          }
        }
      }
    }
  }
};
