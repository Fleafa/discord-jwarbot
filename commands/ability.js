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
		const abilityList = [];

		for (const ability in libraryFile) {
			abilityList.push(libraryFile[ability]['name'].toLowerCase());
		}

		const filtered = abilityList.filter(choice => choice.startsWith(focusedValue));
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

		// prepend "abilitys-", and replace spaces with underscores
		const abilityId = 'ability-' + getInput.replace(/ /g, '_');
		let abilityName;

		try {
			abilityName = libraryFile[abilityId]['name'];
		}
		catch (err) {
			console.log('err: no match found for "' + abilityId + '"');
			await interaction.reply({ content: 'Error: no ability matching "' + getInput + '" found.\nPlease the autoprediction to find a valid ability.', ephemeral: true });
			return;
		}

		const abilityDesc = libraryFile[abilityId]['description'];
		// const abilityBSID = libraryFile[abilityId]['bsid'];
		// const abilityRefs = [];
		const abilityRB = libraryFile[abilityId]['rulebook'];
		const abilityRBr1 = libraryFile[abilityId]['rulebookr1'];
		const abilityRev = libraryFile[abilityId]['revision'];
		const abilityUpdated = libraryFile[abilityId]['updated'];

		if (abilityRev = 0) {
			const abilityDetails = 'R' + abilityRev + '\tRisen Sun: p.' + traitRB + '\t2022 reprint: p.' + traitRBr1;
		} else {
			const abilityDetails = 'R' + abilityRev + ' ( Updated:' + abilityUpdated + ')\tRisen Sun: p.' + traitRB + '\t2022 reprint: p.' + traitRBr1;
		}

		const abilityDefinition = bold(abilityName) + codeBlock(abilityDesc) + italic(abilityDetails);

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('ability_share')
					.setLabel('share here')
					.setStyle(ButtonStyle.Primary),
			);

		await interaction.reply({ content: abilityDefinition, components: [row], ephemeral: true, fetchReply: true });

		const filter = i => i.customId === 'ability_share';
		const componentCollector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

		componentCollector.on('collect', async i => {
			await interaction.channel.send(userMention(interaction.user.id) + ' used /ability:\n' + abilityDefinition);
			await i.update({ content: 'Shared definition of ' + abilityName + ' to channel.', components: [] });
			console.log(abilityName + ' definition shared to ' + interaction.channel);
			componentCollector.stop();
		});

		componentCollector.on('end', async collected => {
			console.log(`Collected ${collected.size} interactions.`);
			if (!collected.size) {
				await row.components[0].setDisabled(true).setLabel('60s timeout');
				await interaction.editReply({ content: abilityDefinition, components: [row] });
			}
		});
	},

};