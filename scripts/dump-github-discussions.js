const getRoamClient = require('../clients/roam');
const githubQuery = require('../clients/github-graphql');
const roamAddBlock = require('../util/roam-add-block');
const GithubIssue = require('../entities/github-issue');
const { createSourceIterator } = require('../util');
const config = require('../config.json');

let issuePageId = '8cE1fsMHq';
let actualRoamAuth = {
  graph: process.env.ACTUAL_ROAM_API_GRAPH,
  email: process.env.ACTUAL_ROAM_API_EMAIL,
  password: process.env.ACTUAL_ROAM_API_PASSWORD
};

async function githubIssues() {
    let github = await githubQuery(config['github-actual']);

    let res = await github(`
      query Foo {
        repository(owner: "actualbudget", name: "releases") {
          discussions(first: 10) {
            totalCount
            nodes {
              id
              title
            }
          }
        }
      }
    `)
    console.log(res.repository.discussions.nodes)
    
    // let { iter, push } = createSourceIterator(1000);

    // let res = await github.paginate(github.rest.issues.listForRepo, { owner: 'actualbudget', repo: 'releases' })
    // res.reverse();

    // for(let issue of res) {
    // 	push(issue);
    // }
    
    // return iter;
}

async function run() {
    githubIssues();
  // let roam = await getRoamClient(actualRoamAuth);

  //   for await (let rawIssue of await githubIssues()) {
  // 	let issue = new GithubIssue(rawIssue);
  // 	await roam.createBlock(issue.toRoamBlock(), issuePageId, 0);
  //   }

  //  roam.close()
}

run()
