const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, inlineCode } = require('discord.js');
const { bold, italic, codeBlock } = require('discord.js');
const libraryFile = require('../rules/traits.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('trait')
		.setDescription('Replies with trait definition.')
		.addStringOption(option =>
			option.setName('trait_name')
				.setDescription('The trait to search for.')
				.setAutocomplete(true)
				.setRequired(true)),

	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused().toLowerCase();
		const traitList = [];

		for (const trait in libraryFile) {
			traitList.push(libraryFile[trait]['name'].toLowerCase());
		}

		const filtered = traitList.filter(choice => choice.startsWith(focusedValue));
		if (focusedValue.length >>> 1) {
			await interaction.respond(
				filtered.map(choice => ({ name: choice, value: choice })),
			);
		}
	},

	async execute(interaction) {

		let getInput = interaction.options.getString('trait_name');
		let traitName, traitArgs;
		let traitID = 'trait-';

		// prompt user to use the command correctly; later I may add a pop-up modal when the input is empty
		if (!getInput) {
			await interaction.reply({ content: 'Error: no trait provided.\nPlease type "/trait *trait name*" to request the trait definition.', ephemeral: true });
			return;
		}
		else {
			getInput = getInput.toLowerCase();
			// append input to 'trait-', and replace spaces with underscores
			traitID += getInput.replace(/ /g, '_');
			console.log(interaction.user.username + ' used /trait to search for ' + getInput);
		}

		try {
			traitName = libraryFile[traitID]['name'];
		}
		catch (err) {
			console.log('err: no match found for "' + getInput + '"');
			await interaction.reply({ content: 'Error: no trait matching "' + getInput + '" found.\nPlease use the autoprediction to find a valid trait.', ephemeral: true });
			return;
		}

		try {
			traitArgs = libraryFile[traitID]['arguments'].replace(/\]\(/g, '] (');
		}
		catch (err) {
			console.log('no arguments');
		}

		const traitDesc = libraryFile[traitID]['description'];
		// const traitBSID = libraryFile[traitID]['bsid'];
		// const traitRefs = [];
		const traitRB = libraryFile[traitID]['rulebook'];
		const traitRBr1 = libraryFile[traitID]['rulebookr1'];
		const traitRev = libraryFile[traitID]['revision'];
		const traitUpdated = libraryFile[traitID]['updated'];

		if (stateRev = 0) {
			const stateDetails = 'R' + stateRev + '\tRisen Sun: p.' + traitRB + '\t2022 reprint: p.' + traitRBr1;
		} else {
			const stateDetails = 'R' + stateRev + ' ( Updated:' + stateUpdated + ')\tRisen Sun: p.' + traitRB + '\t2022 reprint: p.' + traitRBr1;
		}

		if (traitArgs) { traitName += ' ' + traitArgs; }

		const traitDefinition = bold(traitName) + codeBlock(traitDesc) + italic(traitDetails);

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('trait_share')
					.setLabel('share here')
					.setStyle(ButtonStyle.Primary),
			);

		await interaction.reply({ content: traitDefinition, components: [row], ephemeral: true, fetchReply: true });

		const filter = i => i.customId === 'trait_share';
		const componentCollector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

		componentCollector.on('collect', async i => {
			//	not using traitDefinition so can insert command helper
			await interaction.channel.send(bold(traitName) + italic('\tvia /trait') + codeBlock(traitDesc) + inlineCode(traitDetails));
			await i.update({ content: 'shared to channel', components: [] });
			console.log(interaction.user.username + ' shared ' + traitName + ' definition shared to ' + interaction.guild.name + '/' + interaction.channel.name);
			componentCollector.stop();
		});

		componentCollector.on('end', async collected => {
			console.log(`Collected ${collected.size} interactions.`);
			if (!collected.size) {
				await row.components[0].setDisabled(true).setLabel('60s timeout');
				await interaction.editReply({ content: traitDefinition, components: [row] });
			}
		});
	},

};