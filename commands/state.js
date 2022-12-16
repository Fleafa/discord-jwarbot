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
		const stateList = [];

		for (const state in libraryFile) {
			stateList.push(libraryFile[state]['name'].toLowerCase());
		}

		const filtered = stateList.filter(choice => choice.startsWith(focusedValue));
		if (focusedValue) {
			await interaction.respond(
				filtered.map(choice => ({ name: choice, value: choice })),
			);
		}
	},

	async execute(interaction) {

		let getInput = interaction.options.getString('state_name');
		let stateName;
		let stateId = 'state-';

		// prompt user to use the command correctly; later I may add a pop-up modal when the input is empty
		if (!getInput) {
			await interaction.reply({ content: 'Error: no state provided.\nPlease type "/state *state name*" to request the state definition.', ephemeral: true });
			return;
		}
		else {
			getInput = getInput.toLowerCase();
			// append input to 'state-', and replace spaces with underscores
			stateId += getInput.replace(/ /g, '_');
			console.log(interaction.user.username + ' used /state to search for ' + getInput);
		}

		try {
			stateName = libraryFile[stateId]['name'];
		}
		catch (err) {
			console.log('err: no match found for "' + getInput + '"');
			await interaction.reply({ content: 'Error: no state matching "' + getInput + '" found.\nPlease use the autoprediction to find a valid state.', ephemeral: true });
			return;
		}
		/*
		let stateArgs;

		try {
			stateArgs = libraryFile[stateId]['arguments'].replace(/\]\(/g, '] (');
		}
		catch (err) {
			console.log('no arguments');
		}
*/
		const stateDesc = libraryFile[stateId]['description'];
		// const stateBSID = libraryFile[stateId]['bsid'];
		// const stateRefs = [];
		const stateRB = libraryFile[stateId]['rulebook'];
		const stateRBr1 = libraryFile[stateId]['rulebookr1'];
		const stateRev = libraryFile[stateId]['revision'];
		const stateStatus = libraryFile[stateId]['status'];
		const stateDetails = 'Revision: ' + stateRev + ' (' + stateStatus + ')\tRisen Sun: p.' + stateRB + '\t2022 reprint: p.' + stateRBr1;

		const stateDefinition = bold(stateName) + codeBlock(stateDesc) + inlineCode(stateDetails);

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('state_share')
					.setLabel('share here')
					.setStyle(ButtonStyle.Primary),
			);

		await interaction.reply({ content: stateDefinition, components: [row], ephemeral: true, fetchReply: true });

		const filter = i => i.customId === 'state_share';
		const componentCollector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

		componentCollector.on('collect', async i => {
		//	not using stateDefinition so can insert command helper
			await interaction.channel.send(bold(stateName) + italic('\tvia /state') + codeBlock(stateDesc) + inlineCode(stateDetails));
			await i.update({ content: 'shared to channel', components: [] });
			console.log(interaction.user.username + ' shared ' + stateName + ' definition shared to ' + interaction.guild.name + '/' + interaction.channel.name);
			componentCollector.stop();
		});

		componentCollector.on('end', async collected => {
			console.log(`Collected ${collected.size} interactions.`);
			if (!collected.size) {
				await row.components[0].setDisabled(true).setLabel('60s timeout');
				await interaction.editReply({ content: stateDefinition, components: [row] });
			}
		});
	},

};