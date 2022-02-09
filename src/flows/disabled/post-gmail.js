const getDiscordClient = require('../clients/discord');
const gmailNewEmail = require('../sources/gmail-new-email');
const writeDiscordEmbed = require('../util/write-discord-embed');

function maskEmail(email) {
  let parts = email.split('@');
  return parts
    .map(part => {
      let chars = part.split('');
      let maskPoint;
      switch (chars.length) {
        case 0:
        case 1:
        case 2:
          maskPoint = 0;
          break;
        case 3:
        case 4:
          maskPoint = 1;
          break;
        case 5:
        case 6:
          maskPoint = 2;
          break;
        default:
          maskPoint = 3;
      }

      return chars
        .map((c, i) => {
          return i >= maskPoint ? 'X' : c;
        })
        .join('');
    })
    .join('@');
}

function maskEmails(str) {
  return str.replace(/([\w]* <)?[^ ]*@[^ ]*>?/g, x => {
    let m = x.match(/(.*) <(.*)>/);
    if (m) {
      return (
        Array.from({ length: m[1].length })
          // eslint-disable-next-line no-unused-vars
          .map(_ => 'X')
          .join('') +
        ' <' +
        maskEmail(m[2]) +
        '>'
      );
    }
    return maskEmail(x);
  });
}

module.exports = config => async app => {
  let discord = await getDiscordClient(config.discord);
  let channel = await discord.channels.fetch(config.channelId);

  for await (let { email, threadId } of await gmailNewEmail(
    app,
    config.gmail,
    config.labelName
  )) {
    if (
      !email.from.includes(config.gmail.email) ||
      (email.subject && email.subject.includes('Update for'))
    ) {
      let from = maskEmails(email.from);
      let subject = email.subject;
      let url = `https://mail.google.com/mail/u/0/#inbox/${threadId}`;

      let mobileText = `_[Open in mobile](https://mail.google.com/mail/mu/mp/0/#cv/Inbox/${threadId})_`;

      writeDiscordEmbed(
        channel,
        {
          title: subject && subject.toString(),
          author: maskEmails(from),
          url,
          desc: mobileText + '\n\n' + maskEmails(email.text).slice(0, 700),
          date: email.date
        },
        { threadId, messageId: email.messageId }
      );
    } else {
      // The email is from our account, mark any emails as followed up
      if (email.references && email.references.length > 0) {
        let messages = await channel.messages.fetch({ limit: 100 });
        // eslint-disable-next-line no-unused-vars
        for (let [_, msg] of messages) {
          if (msg.embeds && msg.embeds.length > 0) {
            let embed = msg.embeds[0];
            let messageId = embed.fields.find(f => f.name === 'messageId');
            if (
              messageId &&
              email.references.find(ref => ref === messageId.value)
            ) {
              // This email
              msg.react('📝');
            }
          }
        }
      }
    }
  }
};
