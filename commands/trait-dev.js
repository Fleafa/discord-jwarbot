const { SlashCommandBuilder } = require('discord.js');
const libraryFile = require('../rules/traits.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('trait')
		.setDescription('Replies with Trait text.')
		.addStringOption(option =>
			option.setName('lookup')
				.setDescription('The Trait to lookup.')
				.setAutocomplete(true),
		),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		const libraryTraits = libraryFile['name'];
		const choices = [];
		for (const trait in libraryTraits) {
			choices.push(libraryTraits[trait].name);
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