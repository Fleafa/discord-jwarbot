const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, inlineCode } = require('discord.js');
const { bold, italic, codeBlock } = require('discord.js');
const libraryFile = require('../rules/traits.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('trait')
		.setDescription('Replies with trait definition.')
		.addStringOption(option =>
			option.setName('rule_name')
				.setDescription('The trait to search for.')
				.setAutocomplete(true)
				.setRequired(true)),

	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused().toLowerCase();
		const ruleList = [];

		for (const rule in libraryFile) {
			ruleList.push(libraryFile[rule]['name'].toLowerCase());
		}

		const filtered = ruleList.filter(choice => choice.startsWith(focusedValue));
		if (focusedValue.length >>> 1) {
			await interaction.respond(
				filtered.map(choice => ({ name: choice, value: choice })),
			);
		}
	},

	async execute(interaction) {

		let getInput = interaction.options.getString('rule_name');
		let ruleName, ruleArgs;
		let ruleID = 'trait-';

		// prompt user to use the command correctly; later I may add a pop-up modal when the input is empty
		if (!getInput) {
			await interaction.reply({ content: 'Error: no trait provided.\nPlease type "/trait *trait name*" to request the trait definition.', ephemeral: true });
			return;
		}
		else {
			getInput = getInput.toLowerCase();
			// append input to 'trait-', and replace spaces with underscores
			ruleID += getInput.replace(/ /g, '_');
			console.log(interaction.user.username + ' used /trait to search for ' + getInput);
		}

		try {
			ruleName = libraryFile[ruleID]['name'];
		}
		catch (err) {
			console.log('err: no match found for "' + getInput + '"');
			await interaction.reply({ content: 'Error: no rule matching "' + getInput + '" found.\nPlease use the autoprediction to find a valid rule.', ephemeral: true });
			return;
		}

		try {
			ruleArgs = libraryFile[ruleID]['arguments'].replace(/\]\(/g, '] (');
		}
		catch (err) {
			console.log('no arguments');
		}

		const ruleDesc = libraryFile[ruleID]['description'];
		// const ruleBSID = libraryFile[ruleID]['bsid'];
		// const ruleRefs = [];
		const ruleRB = libraryFile[ruleID]['rulebook'];
		const ruleRBr1 = libraryFile[ruleID]['rulebookr1'];
		const ruleRev = libraryFile[ruleID]['revision'];
		const ruleUpdated = libraryFile[ruleID]['updated'];
		var ruleDetails = '';

		if (ruleRev = 0) {
			ruleDetails = 'R' + ruleRev + '\tRisen Sun: p.' + ruleRB + '\t2022 reprint: p.' + ruleRBr1;
		} else {
			ruleDetails = 'R' + ruleRev + ' ( Updated:' + ruleUpdated + ')\tRisen Sun: p.' + ruleRB + '\t2022 reprint: p.' + ruleRBr1;
		}

		if (ruleArgs) { ruleName += ' ' + ruleArgs; }

		const ruleDefinition = bold(ruleName) + codeBlock(ruleDesc) + italic(ruleDetails);

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('rule_share')
					.setLabel('share here')
					.setStyle(ButtonStyle.Primary),
			);

		await interaction.reply({ content: ruleDefinition, components: [row], ephemeral: true, fetchReply: true });

		const filter = i => i.customId === 'rule_share';
		const componentCollector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

		componentCollector.on('collect', async i => {
			//	not using ruleDefinition so can insert command helper
			await interaction.channel.send(bold(ruleName) + italic('\tvia /trait') + codeBlock(ruleDesc) + inlineCode(ruleDetails));
			await i.update({ content: 'shared to channel', components: [] });
			console.log(interaction.user.username + ' shared ' + ruleName + ' definition shared to ' + interaction.guild.name + '/' + interaction.channel.name);
			componentCollector.stop();
		});

		componentCollector.on('end', async collected => {
			console.log(`Collected ${collected.size} interactions.`);
			if (!collected.size) {
				await row.components[0].setDisabled(true).setLabel('60s timeout');
				await interaction.editReply({ content: ruleDefinition, components: [row] });
			}
		});
	},

};