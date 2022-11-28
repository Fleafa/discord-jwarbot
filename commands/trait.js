const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, userMention } = require('discord.js');
// const wait = require('node:timers/promises').setTimeout;
// eslint-disable-next-line no-unused-vars
const { bold, italic, underscore, blockQuote, codeBlock } = require('discord.js');
const libraryFile = require('../rules/traits.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('trait')
		.setDescription('Replies with Trait definition.')
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
		if (focusedValue) {
			await interaction.respond(
				filtered.map(choice => ({ name: choice, value: choice })),
			);
		}
	},

	async execute(interaction) {

		let getInput = interaction.options.getString('trait_name');

		// prompt user to use the command correctly; later I may add a pop-up modal when the input is empty
		if (!getInput) {
			await interaction.reply({ content: 'Error: no trait provided.\nPlease type "/trait *trait name*" to request the trait definition.', ephemeral: true });
			return;
		}
		else {
			getInput = getInput.toLowerCase();
			console.log(getInput);
		}

		// prepend "traits-", and replace spaces with underscores
		const traitId = 'trait-' + getInput.replace(/ /g, '_');
		let traitName;

		try {
			traitName = libraryFile[traitId]['name'];
		}
		catch (err) {
			console.log('err: no match found for "' + traitId + '"');
			await interaction.reply({ content: 'Error: no trait matching "' + getInput + '" found.\nPlease the autoprediction to find a valid trait.', ephemeral: true });
			return;
		}

		let traitArgs;

		try {
			traitArgs = libraryFile[traitId]['arguments'].replace(/\]\(/g, '] (');
		}
		catch (err) {
			console.log('no arguments');
		}

		const traitDesc = libraryFile[traitId]['description'];
		// const traitBSID = libraryFile[traitId]['bsid'];
		// const traitRefs = [];
		const traitRB = libraryFile[traitId]['rulebook'];
		const traitRBr1 = libraryFile[traitId]['rulebookr1'];
		const traitRev = libraryFile[traitId]['revision'];
		const traitStatus = libraryFile[traitId]['status'];

		let traitDefinition = '';

		if (traitArgs) {
			traitDefinition = bold(traitName + ' ' + traitArgs) + codeBlock(traitDesc) + italic('**Revision:** ' + traitRev + ' (' + traitStatus + ')\t**Risen Sun:** p.' + traitRB + '\t**2022 reprint:** p.' + traitRBr1);
		}
		else {
			traitDefinition = bold(traitName) + codeBlock(traitDesc) + italic('**Revision:** ' + traitRev + ' (' + traitStatus + ')\t**Risen Sun:** p.' + traitRB + '\t**2022 reprint:** p.' + traitRBr1);
		}

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('share')
					.setLabel('share in this channel')
					.setStyle(ButtonStyle.Primary),
			);

		await interaction.reply({ content: traitDefinition, components: [row], ephemeral: true, fetchReply: true });

		const filter = i => i.customId === 'share';
		const componentCollector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

		componentCollector.on('collect', async i => {
			await interaction.channel.send(userMention(interaction.user.id) + ' used /trait:\n' + traitDefinition);
			await i.update({ content: 'Shared definition of ' + traitName + ' to channel.', components: [] });
			console.log(traitName + ' definition shared to ' + interaction.channel);
			componentCollector.stop();
		});

		componentCollector.on('end', async collected => {
			console.log(`Collected ${collected.size} interactions.`);
			await row.components[0].setDisabled(true).setLabel('timeout');
			await interaction.editReply({ content: traitDefinition, components: [row] });
		});
	},

};