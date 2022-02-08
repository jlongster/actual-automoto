const { join } = require('path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require('../config');
const fs = require('fs');

const dir = __dirname + '/commands';
const clientId = '940463142738219018';
const guildId = '937901803608096828';

const commands = [];
const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(join(dir, file));
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(config.discordActual.token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands
    });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
