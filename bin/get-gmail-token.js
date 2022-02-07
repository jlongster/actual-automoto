const fs = require("fs");
const config = require("../config.json");
const readline = require("readline");
const { google } = require("googleapis");

const oAuth2Client = new google.auth.OAuth2(
  config.gmail.clientId,
  config.gmail.clientSecret,
  "https://discord-life.jlongster.com"
);

function authorize() {
    const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
    });

    rl.question("Token name: ", (tokenName) => {
	rl.question("Full access? [y/N]", (fullAccess) => {
	    fullAccess = fullAccess.trim() === 'y';
	    let scope = fullAccess ?
		["https://www.googleapis.com/auth/gmail.readonly"] :
		["https://www.googleapis.com/auth/gmail.metadata"];
	    
	    const authUrl = oAuth2Client.generateAuthUrl({
		access_type: "offline",
		scope,
		prompt: 'consent'
	    });
	    console.log("Authorize this app by visiting this url:", authUrl);
	    rl.question("Enter the code from that page here: ", (code) => {
		rl.close();

		oAuth2Client.getToken(code, (err, token) => {
		    if (err) {
			throw new Error("Error retrieving access token1: " + err);
		    }
		    fs.writeFileSync(
			`../tokens/gmail-${tokenName}.json`,
			JSON.stringify(token),
			"utf8"
		    );
		});
	    });
	})
    });
}

authorize();
