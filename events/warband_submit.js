const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, userMention } = require('discord.js');
const { bold, italic, underscore, codeBlock, blockQuote } = require('discord.js');
const { commaLists } = require('common-tags');
const factionIcons = require('../factionicons.json');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {

		if (!interaction.isModalSubmit()) return;
		if (interaction.customId === 'slashWarbandModal') {
			const getwarbandTags = interaction.fields.getTextInputValue('slashWarbandTags').toLowerCase();
			let warbandEdit = interaction.fields.getTextInputValue('slashWarbandText');
			let warbandFaction, warbandIcon, warbandTheme, warbandTitle, warbandIntro, checkShare, checkDM, checkMarkup;

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
			// check for Faction prior to removing major headers
			const isFaction = warbandEdit.match(fFaction);

			if (isFaction) {
				// get Faction name from array
				warbandFaction = isFaction[1];
				warbandTitle = warbandFaction;
				// get Faction icon from Faction name; catch errors
				try {
					warbandIcon = factionIcons[warbandFaction];
				}
				catch {
					console.log('Could not parse icon string');
				}
			}
			else {
				// very basic check - all warbands have a Faction
				await interaction.reply({ content: 'Invalid text pasted.', ephemeral: true });
				console.log('invalid text');
				return;
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

			// introductory text, tag user
			if (warbandTotal) {
				warbandIntro = userMention(interaction.user.id) + ' used /warband to share this ' + warbandTotal[1] + ' Rice Battlescribe list:';
			}
			else {
				warbandIntro = userMention(interaction.user.id) + ' used /warband to share this Battlescribe list:';
			}

			if (warbandTags) {
				const listwarbandTags = [];
				for (const match of warbandTags) {
					listwarbandTags.push(underscore(match));
				}
				warbandEdit = warbandEdit + '\nTags: ' + commaLists`${listwarbandTags}`;
			}

			// build the buttons
			const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('warband_share')
						.setLabel('share here')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('warband_dm')
						.setLabel('send in DM')
						.setStyle(ButtonStyle.Secondary),
					new ButtonBuilder()
						.setCustomId('warband_markup')
						.setLabel('as markup')
						.setStyle(ButtonStyle.Success),
				);

			const jwarbotTip = '\n\n' + blockQuote(':ninja: JwarBot Tip! :ninja:\n' + italic('**"share here":** I\'ll send this message to this channel - you won\'t be able to edit it. **"send DM:** I\'ll send this message as a DM. Copy & paste will lose text decoration, but not the layout.\n**"as markup":** I\'ll expose the markup formatting so you can copy & paste into your own editable message. You will also be sent it by DM.\nThis may seem clunky, but it\'s probably a good thing that I can\'t impersonate you!\nThis message will self-destruct in 60 seconds!'));

			// send initial response, including buttons
			await interaction.reply({ content: warbandEdit + jwarbotTip, components: [row], fetchReply: true, ephemeral: true });

			// listen for button presses
			const filterShare = i => i.customId === 'warband_share' || i.customId === 'warband_dm' || i.customId === 'warband_markup';
			const componentCollector = interaction.channel.createMessageComponentCollector({ filterShare, time: 60000 });

			componentCollector.on('collect', async i => {
				if (i.customId === 'warband_share') {
					checkShare = true;
					const warbandOutput = await interaction.channel.send(italic(warbandIntro) + '\n' + warbandEdit);
					await row.components[0].setDisabled(true).setLabel('shared');
					await i.update({ content: 'shared to channel' + jwarbotTip, components: [row] });
					console.log(interaction.user.name + ' shared warband to ' + interaction.channel.name);

					// react to message with Faction icon or eyes if no Faction found
					try {
						const warbandReaction = interaction.guild.emojis.cache.find(emoji => emoji.name === warbandIcon);
						await warbandOutput.react(warbandReaction);
					}
					catch {
						await warbandOutput.react('👀');
					}
				}
				else if (i.customId === 'warband_dm') {
					checkDM = true;
					await interaction.user.send(warbandEdit);
					await row.components[1].setDisabled(true).setLabel('DM sent');
					await i.update({ content: warbandEdit, components: [row] });
					console.log('sent warband DM to ' + interaction.user.name);
				}
				else if (i.customId === 'warband_markup') {
					checkMarkup = true;
					await interaction.user.send(codeBlock(warbandEdit));
					await row.components[2].setDisabled(true).setLabel('done');
					await i.update({ content: codeBlock(warbandEdit), components: [] });
					componentCollector.stop();
				}
				if (checkShare && checkDM) {
					componentCollector.stop();
				}
			});

			componentCollector.on('end', async collected => {
				console.log(`collected ${collected.size} interactions before 60s timeout.`);
				if (!checkShare) {
					await row.components[0].setDisabled(true).setLabel('60s timeout');
				}
				if (!checkDM) {
					await row.components[1].setDisabled(true).setLabel('60s timeout');
				}
				if (!checkMarkup) {
					await row.components[2].setDisabled(true).setLabel('60s timeout');
				}

				if (checkShare && checkDM) {
					await interaction.editReply({ content: 'Thank you for using /warband :shinto_shrine:', components: [] });
				}
				else if (checkMarkup) {
					console.log('sent as markup');
				}
				else {
					await interaction.editReply({ content: 'Thank you for using /warband :shinto_shrine:', components: [row] });
				}
			});
		}
	},
};
