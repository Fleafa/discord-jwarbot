const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('warband')
		.setDescription('Launches a form where you can paste a BattleScribe Warband (use Share > Chat) for reformatting.'),
	async execute(interaction) {

		console.log(interaction.user.username + ' used /warband in ' + interaction.guild.name + ' > ' + interaction.channel.name);

		const modal = new ModalBuilder()
			.setCustomId('slashWarbandModal')
			.setTitle('Reformat Battlescribe Warband');

		const modalWarband = new TextInputBuilder()
			.setCustomId('slashWarbandText')
			.setLabel('Please paste Battlescribe Warband text here:')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true);

		const modalTags = new TextInputBuilder()
			.setCustomId('slashWarbandTags')
			.setLabel('Comma-separated tags for searches:')
			.setStyle(TextInputStyle.Short)
			.setPlaceholder('e.g. Tengu, zones, grand masters, UKGE, Bushido Cast')
			.setRequired(false);

		const actionrowWarband = new ActionRowBuilder().addComponents(modalWarband);
		const actionrowTags = new ActionRowBuilder().addComponents(modalTags);

		modal.addComponents(actionrowWarband);
		modal.addComponents(actionrowTags);

		await interaction.showModal(modal);

	},
};