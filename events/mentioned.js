const { Events } = require('discord.js');

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		const fbotID = /(<@!?1040666080605126766>)(?: |)/;
		const botIDmatch = message.content.match(fbotID);
		const jwarbotTip = ':ninja: Hi there! I\'m JwarBot. I currently support the following commands. Just type the bold text to invoke them! :ninja:\n**/warband** will prompt you to paste a Battlescribe Warband you\'ve copied using Share > Chat. It will then send it back to you in a prettier format.\n**/trait *trait_name*** will try to autocomplete a trait name. When you send the command, that trait\'s current definition will be shared with you.\n*Coming soon(ish): /help /ability /state /concept*';
		if (botIDmatch) {
			return message.channel.send(jwarbotTip);
		}
	},
};