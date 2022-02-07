const express = require('express');
const { getApp } = require('automoto');
const getDiscordClient = require('automoto/clients/discord');
const writeDiscordMessage = require('automoto/actions/write-discord-message');
const config = require('../config.json');

async function setupHandlers() {
  let discord = await getDiscordClient(config.discordActual);
  let channel = await discord.channels.fetch('940104435982565406');

  process.on('SIGTERM', () => {
    setTimeout(() => {
      console.log('[SIGTERM] Shutdown');
      // Sadly, the discord client doesn't seem to like to clean up properly.
      // We let things clean up for 3s and then we force this process to exit.
      // Not ideal, and will try to remove this later with a new version of
      // discord.js
      process.exit(0);
    }, 3000);
  });

  process.on('unhandledRejection', async err => {
    console.log('UNHANDLED REJECTION:', err);
    writeDiscordMessage(channel, 'ERROR: ' + err.message);

    // To avoid fatal errors that might stall out all the workflows, we kill the process
    // setTimeout(() => {
    //   process.exit(1);
    // }, 1000);
  });
}

let actualRoamAuth = {
  graph: process.env.ACTUAL_ROAM_API_GRAPH,
  email: process.env.ACTUAL_ROAM_API_EMAIL,
  password: process.env.ACTUAL_ROAM_API_PASSWORD
};

const flows = {
  'Discord Actual reactions': require('./flows/discord-reaction-roam')({
    discord: config.discordActual,
    roamAuth: actualRoamAuth
  }),
  'Feeds to discord (release)': require('./flows/atom-publish')({
    discord: config.discordActual,
    channel: '938087368399925318',
    url: 'https://actualbudget.com/blog/feed.xml?filter=release'
  }),
  'Feeds to discord (all)': require('./flows/atom-publish')({
    discord: config.discordActual,
    channel: '937901803608096831',
    url: 'https://actualbudget.com/blog/feed.xml'
  }),
  'Reddit Actual posts to discord': require('./flows/reddit-posts-post')({
    discord: config.discordActual
  }),
  'Actual issues->roam/discord': require('./flows/actual-issues-publish')({
    github: config['github-actual'],
    roam: actualRoamAuth,
    discord: config.discordActual
  }),
  'Actual discussions->discord': require('./flows/actual-discussions-publish')({
    github: config['github-actual'],
    discord: config.discordActual
  }),
  'Roam export (actual)': require('./flows/roam-export')({
    roamAuth: actualRoamAuth,
    key: 'actual',
    exportToken: config['actual-roam-export'].token
  })
};

async function run() {
  await setupHandlers();

  let app = getApp(flows);
  app.use(express.static(__dirname + '/../static'));

  console.log('Listening on ' + config.server.port + '...');
  app.listen(config.server.port);
}

run();
