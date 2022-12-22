const { Events } = require('discord.js');
const { clientId } = require('../config.json');

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		const fbotID = new RegExp('(<@!?' + clientId + '>)(?: |)');
		const botIDmatch = message.content.match(fbotID);
		const jwarbotTip = ':ninja: Hi there! I\'m JwarBot. I currently support the following commands :ninja:\n**/warband** will prompt you to paste a Battlescribe Warband you\'ve copied using Share > Chat. It will then send it back to you in a prettier format.\n**/trait *trait_name***, **/state *state_name*** **/ability *ability_name***, & **/feat *feat_name*** will try to autocomplete the corresponding rule name. When you send the command, I\'ll reply with that rule\'s current definition.\n*Coming soon(ish): /concept*';
		if (botIDmatch) {
			return message.channel.send(jwarbotTip);
		}
	},
};