const { SlashCommandBuilder } = require('discord.js');
const libraryFile = require('../rules/traits.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('trait')
		.setDescription('Replies with Trait definition.')
		.addStringOption(option =>
			option.setName('trait_name')
				.setDescription('The trait to search for.')
				.setAutocomplete(true)),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		const choices = [];
		for (const trait in libraryFile) {
			choices.push(libraryFile[trait].name);
		}
		const filtered = choices.filter(choice => choice.startsWith(focusedValue));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
	},

	// eslint-disable-next-line no-empty-function, no-unused-vars
	async execute(interaction) {

	},

};