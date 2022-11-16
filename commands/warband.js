const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder } = require('discord.js');

// module.exports is how you export data in Node.js so that you can require() it in other files.
module.exports = {
	data: new SlashCommandBuilder()
		.setName('warband')
		.setDescription('Reformats BattleScribe Bushido Warbands shared text in a more compact form.'),
	async execute(interaction) {

		const modal = new ModalBuilder()
			.setCustomId('warbandModal')
			.setTitle('Reformat BS Warband');

		const warbandInput = new TextInputBuilder()
			.setCustomId('warbandInput')
			.setLabel('Please paste Battlescribe Warband text here:')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true)
			;

		const warbandTags = new TextInputBuilder()
			.setCustomId('warbandTags')
			.setLabel('Comma-separated tags for searches:')
			.setStyle(TextInputStyle.Short)
			.setPlaceholder('e.g. Tengu, zones, grand masters, UKGE, Bushido Cast')
			.setRequired(false)
			;

		// An action row only holds one text input, so you need one action row per text input.
		const warbandInputActionRow = new ActionRowBuilder().addComponents(warbandInput);
		const warbandTagsActionRow = new ActionRowBuilder().addComponents(warbandTags);

		// Add inputs to the modal
		modal.addComponents(warbandInputActionRow);
		modal.addComponents(warbandTagsActionRow);

		// Show the modal to the user
		await interaction.showModal(modal);

	},
};