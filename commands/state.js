const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { bold, italic, codeBlock, inlineCode } = require('discord.js');
const libraryFile = require('../rules/states.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('state')
		.setDescription('Replies with state definition.')
		.addStringOption(option =>
			option.setName('state_name')
				.setDescription('The state to search for.')
				.setAutocomplete(true)
				.setRequired(true)),

	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused().toLowerCase();
		const ruleList = [];

		for (const rule in libraryFile) {
			ruleList.push(libraryFile[rule]['name'].toLowerCase());
		}

		const filtered = ruleList.filter(choice => choice.startsWith(focusedValue));
		if (focusedValue) {
			await interaction.respond(
				filtered.map(choice => ({ name: choice, value: choice })),
			);
		}
	},

	async execute(interaction) {

		let getInput = interaction.options.getString('state_name');
		let ruleName;
		let ruleId = 'state-';

		// prompt user to use the command correctly; later I may add a pop-up modal when the input is empty
		if (!getInput) {
			await interaction.reply({ content: 'Error: no state provided.\nPlease type "/state *state name*" to request the state definition.', ephemeral: true });
			return;
		}
		else {
			getInput = getInput.toLowerCase();
			// append input to 'state-', and replace spaces with underscores
			ruleId += getInput.replace(/ /g, '_');
			console.log(interaction.user.username + ' used /state to search for ' + getInput);
		}

		try {
			ruleName = libraryFile[ruleId]['name'];
		}
		catch (err) {
			console.log('err: no match found for "' + getInput + '"');
			await interaction.reply({ content: 'Error: no state matching "' + getInput + '" found.\nPlease use the autoprediction to find a valid state.', ephemeral: true });
			return;
		}
		/*
		let ruleArgs;

		try {
			ruleArgs = libraryFile[ruleId]['arguments'].replace(/\]\(/g, '] (');
		}
		catch (err) {
			console.log('no arguments');
		}
*/
		const ruleDesc = libraryFile[ruleId]['description'];
		// const ruleBSID = libraryFile[ruleId]['bsid'];
		// const ruleRefs = [];
		const ruleRB = libraryFile[ruleId]['rulebook'];
		const ruleRBr1 = libraryFile[ruleId]['rulebookr1'];
		const ruleRev = libraryFile[ruleId]['revision'];
		const ruleUpdated = libraryFile[ruleId]['updated'];
		var ruleDetails = '';

		if (ruleRev != null) {
			if (ruleRev == 0) {
				ruleDetails = 'R' + ruleRev + '\tRisen Sun: p.' + ruleRB + '\t2022 reprint: p.' + ruleRBr1;
			} else {
				ruleDetails = 'R' + ruleRev + ' (updated ' + ruleUpdated + ')\tRisen Sun: p.' + ruleRB + '\t2022 reprint: p.' + ruleRBr1;
			}
		}

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
			await interaction.channel.send(bold(ruleName) + italic('\tvia /state') + codeBlock(ruleDesc) + inlineCode(ruleDetails));
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