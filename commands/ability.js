const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, userMention } = require('discord.js');
// const wait = require('node:timers/promises').setTimeout;
// eslint-disable-next-line no-unused-vars
const { bold, italic, underscore, blockQuote, codeBlock } = require('discord.js');
const libraryFile = require('../rules/abilities.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ability')
		.setDescription('Replies with ability definition.')
		.addStringOption(option =>
			option.setName('ability_name')
				.setDescription('The ability to search for.')
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

		let getInput = interaction.options.getString('ability_name');

		// prompt user to use the command correctly; later I may add a pop-up modal when the input is empty
		if (!getInput) {
			await interaction.reply({ content: 'Error: no ability provided.\nPlease type "/ability *ability name*" to request the ability definition.', ephemeral: true });
			return;
		}
		else {
			getInput = getInput.toLowerCase();
			console.log(getInput);
		}

		// prepend "ability-", and replace spaces with underscores
		const ruleId = 'ability-' + getInput.replace(/ /g, '_');
		let ruleName;

		try {
			ruleName = libraryFile[ruleId]['name'];
		}
		catch (err) {
			console.log('err: no match found for "' + ruleId + '"');
			await interaction.reply({ content: 'Error: no ability matching "' + getInput + '" found.\nPlease the autoprediction to find a valid ability.', ephemeral: true });
			return;
		}

		const ruleDesc = libraryFile[ruleId]['description'];
		// const ruleBSID = libraryFile[ruleId]['bsid'];
		// const ruleRefs = [];
		const ruleRB = libraryFile[ruleId]['rulebook'];
		const ruleRBr1 = libraryFile[ruleId]['rulebookr1'];
		const ruleRev = libraryFile[ruleId]['revision'];
		const ruleUpdated = libraryFile[ruleId]['updated'];
		var ruleDetails = '';

		if (ruleRev == 0) {
			ruleDetails = 'R' + ruleRev + '\tRisen Sun: p.' + ruleRB + '\t2022 reprint: p.' + ruleRBr1;
		} else {
			ruleDetails = 'R' + ruleRev + ' (updated ' + ruleUpdated + ')\tRisen Sun: p.' + ruleRB + '\t2022 reprint: p.' + ruleRBr1;
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
			await interaction.channel.send(userMention(interaction.user.id) + ' used /ability:\n' + ruleDefinition);
			await i.update({ content: 'Shared definition of ' + ruleName + ' to channel.', components: [] });
			console.log(ruleName + ' definition shared to ' + interaction.channel);
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