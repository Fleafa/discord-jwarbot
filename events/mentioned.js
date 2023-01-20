const { Events } = require('discord.js');
const { clientId } = require('../config.json');

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		const fbotID = new RegExp('(<@!?' + clientId + '>)(?: |)');
		const botIDmatch = message.content.match(fbotID);
		const jwarbotTip = ':ninja: Hi there! I\'m JwarBot v0.5 :ninja:\nI currently support the following commands:\n**/trait** *trait_name*\n**/state** *state_name*\n**/ability** *ability_name*\n**/feat** *feat_name*\n\t I\'ll try to autocomplete the corresponding rule name and reply with that rule\'s current definition.\n\n**/warband**\n\tI\'ll prompt you to paste your Battlescribe Warband (copied using its Share > Chat function) and send it back to you in a prettier, more legible format.';
		if (botIDmatch) {
			return message.channel.send(jwarbotTip);
		}
	},
};