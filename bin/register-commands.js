const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const config = require("../config.json");
const fs = require("fs");

const commands = [];
const commandFiles = fs
  .readdirSync(__dirname + "/../discord-commands")
  .filter((file) => file.endsWith(".js"));

// Place your client and guild ids here
const clientId = "899759087267479572";
const guildId = "885597330382913557";

for (const file of commandFiles) {
  const command = require(__dirname + "/../discord-commands/" + file);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "9" }).setToken(config.discord.token);
(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
