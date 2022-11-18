const { Events, userMention } = require('discord.js');
const { bold, italic, underscore } = require('discord.js');
const { commaLists } = require('common-tags');
// const { bold, italic, strikethrough, underscore, spoiler, quote, blockQuote } = require('discord.js');
const factionIcons = require('../factionicons.json');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {

		if (!interaction.isModalSubmit()) return;
		if (interaction.customId === 'warbandModal') {
			// get the warband from the modal input
			const getwarbandInput = interaction.fields.getTextInputValue('warbandInput');
			// get the warband from the modal input
			const getwarbandTags = interaction.fields.getTextInputValue('warbandTags').toLowerCase();
			// inform user
			await interaction.reply({ content: 'reformatting list...', ephemeral: true });
			const channel = interaction.channel;

			// RegEx
			const fEmptyLines = /(^\s*$\r?\n)+/gm;

			// Faction name captured into array position [1]
			const fFaction = /^\s*\+\+.*\((.*)\).*/;

			const fFooter = /^Created with.*$/gm;
			const fLastNewLine = /\n$/;
			const fMajorHeaders = /^\+\+.*\+\+$/m;
			const fMinorHeaders = /\+.*\+/g;
			const fRiceCost = / Rice]/g;

			// Total cost captured into array position [1]
			const fRiceTotal = /^\+\+.Total:.\[(.*).Rice\].*\+\+$/m;

			// Theme name captured into array position [1]
			const fTheme = /\n\+[^\n]*Theme Cards \+\n\n?([^\n]*)\n/;

			// Replace all square brackets with curved brackets
			const fBracketL = /\[/g;
			const fBracketR = /\]/g;

			// these variables will be altered
			let warbandEdit = getwarbandInput;
			let warbandFaction;
			let warbandIcon;
			let warbandTheme;
			let warbandTitle;

			// check for Faction prior to removing major headers
			const isFaction = warbandEdit.match(fFaction);

			if (isFaction) {
				warbandFaction = isFaction[1];
				warbandTitle = warbandFaction;
				console.log('Faction: ' + warbandFaction);
				// get Faction icon from Faction name; catch errors
				try {
					warbandIcon = factionIcons[warbandFaction];
					console.log('Icon: ', warbandIcon);
				}
				catch {
					console.log('Could not parse icon string');
				}
			}

			// get total cost (not budget)
			const warbandTotal = warbandEdit.match(fRiceTotal);

			// remove the major headers ++ ++
			warbandEdit = warbandEdit.replace(fMajorHeaders, '');

			// check for Theme prior to removing minor headers
			const isTheme = warbandEdit.match(fTheme);

			if (isTheme) {
				warbandTheme = isTheme[1];
				warbandEdit = warbandEdit.replace(fTheme, '');
				if (warbandTitle) {
					// append any Theme to existing Title
					warbandTitle = warbandTitle + ' - ' + warbandTheme;
				}
				else {
					// Theme added to empty Title (i.e. no Faction found)
					warbandTitle = warbandTheme;
				}
				console.log('Theme: ' + warbandTheme);
			}
			else {
				console.log('No Theme selected');
			}

			// bold any Title and prepend to warband
			if (warbandTitle) {
				warbandEdit = bold(warbandTitle) + warbandEdit;
			}
			// remove the minor headers, reformat, etc.
			warbandEdit = warbandEdit.replace(fMinorHeaders, '');
			warbandEdit = warbandEdit.replace(fFooter, '');
			warbandEdit = warbandEdit.replace(fRiceCost, ']');
			warbandEdit = warbandEdit.replace(fEmptyLines, '');
			warbandEdit = warbandEdit.replace(fLastNewLine, '');
			warbandEdit = warbandEdit.replace(fBracketL, '(');
			warbandEdit = warbandEdit.replace(fBracketR, ')');

			const warbandTags = getwarbandTags.match(/(?:|^)(\b[^,]+\b)/g);
			console.log('Tags: ' + warbandTags);

			let warbandIntro;
			// introductory text, tag user
			if (warbandTotal) {
				warbandIntro = userMention(interaction.user.id) + ' used /warband to share this ' + warbandTotal[1] + ' Rice list:';
			}
			else {
				warbandIntro = userMention(interaction.user.id) + ' used /warband to share this list:';
			}

			if (warbandTags) {
				const listwarbandTags = [];
				for (const match of warbandTags) {
					listwarbandTags.push(underscore(match));
				}
				warbandEdit = italic(warbandIntro) + '\n' + warbandEdit + '\nTags: ' + commaLists`${listwarbandTags}`;
			}
			else {
				warbandEdit = italic(warbandIntro) + '\n' + warbandEdit;
			}

			// send message
			const warbandOutput = await channel.send({ content: warbandEdit, fetchReply: true });

			// react to message with Faction icon or eyes if no Faction found
			try {
				const warbandReaction = interaction.guild.emojis.cache.find(emoji => emoji.name === warbandIcon);
				await warbandOutput.react(warbandReaction);
			}
			catch {
				await warbandOutput.react('👀');
			}
		}
	},
};
