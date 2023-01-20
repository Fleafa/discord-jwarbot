const { Events } = require('discord.js');
const { clientId } = require('../config.json');

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		const fbotID = new RegExp('(<@!?' + clientId + '>)(?: |)');
		const botIDmatch = message.content.match(fbotID);
		const jwarbotTip = ':ninja: Hi there! I\'m JwarBot v0.5 :ninja:\nI currently support the following commands:\n**/trait** *trait_name*\n**/state** *state_name*\n**/ability** *ability_name*\n**/feat** *feat_name*\nTry to autocomplete the corresponding rule name. When you send the command, I\'ll reply with that rule\'s current definition.\n**/warband**\nPrompts you to paste a Battlescribe Warband copied using Share > Chat. It will then send it back to you in a prettier format.\n*Coming soon(ish): /concept*';
		if (botIDmatch) {
			return message.channel.send(jwarbotTip);
		}
	},
};