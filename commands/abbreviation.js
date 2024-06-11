const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, userMention } = require('discord.js');
// const wait = require('node:timers/promises').setTimeout;
// eslint-disable-next-line no-unused-vars
const { bold, italic, underscore, blockQuote, codeBlock } = require('discord.js');
const fs = require('fs');
const yaml = require('js-yaml');
const yamlData = yaml.load(fs.readFileSync('./rules/abbreviations.yaml', 'utf8'));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('abbreviation')
		.setDescription('Replies with abbreviation definition.')
		.addStringOption(option =>
			option.setName('abbreviation_name')
				.setDescription('The abbreviation to search for.')
				.setAutocomplete(true)
				.setRequired(true)),

	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		const abbreviationList = Object.keys(yamlData);

		const filtered = abbreviationList.filter(choice => choice.startsWith(focusedValue));
		if (focusedValue) {
			await interaction.respond(
				filtered.map(choice => ({ name: choice, value: choice })),
			);
		}
	},

	async execute(interaction) {

		const getInput = interaction.options.getString('abbreviation_name');

		// prompt user to use the command correctly; later I may add a pop-up modal when the input is empty
		if (!getInput) {
			await interaction.reply({ content: 'Error: no abbreviation provided.\nPlease type "/abbreviation *abbreviation name*" to request the abbreviation definition.', ephemeral: true });
			return;
		}
		else {
			console.log(getInput);
		}

		const abbreviationId = getInput;
		let abbreviationName;

		try {
			abbreviationName = yamlData[abbreviationId];
		}
		catch (err) {
			console.log('err: no match found for "' + abbreviationId + '"');
			await interaction.reply({ content: 'Error: no abbreviation matching "' + getInput + '" found.\nPlease the autoprediction to find a valid abbreviation.', ephemeral: true });
			return;
		}

		let abbreviationDefinition = yamlData[abbreviationId];

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('abbreviation_share')
					.setLabel('share in this channel')
					.setStyle(ButtonStyle.Primary),
			);

		const fFaction = /\*(faction.*)\*/;
		const rFactionIcon = /(\*faction.*\*)/;

		// 753678317177143316
		const faction = abbreviationDefinition.match(fFaction);
		const factionIcon = '<' + fFaction + ':' + interaction.guild.emojis.cache.find(emoji => emoji.name === faction) + '>';

		abbreviationDefinition = abbreviationDefinition.replace(rFactionIcon, factionIcon);
		console.log('find Faction = ' + faction);
		console.log('replace FactionIcon = ' + factionIcon);
		console.log('factionIcon = ' + factionIcon);

		await interaction.reply({ content: abbreviationDefinition, components: [row], ephemeral: true, fetchReply: true });

		const filter = i => i.customId === 'abbreviation_share';
		const componentCollector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

		componentCollector.on('collect', async i => {
			await interaction.channel.send(userMention(interaction.user.id) + ' used /abbreviation:\n' + abbreviationDefinition);
			await i.update({ content: 'Shared definition of ' + abbreviationName + ' to channel.', components: [] });
			console.log(abbreviationName + ' definition shared to ' + interaction.channel);
			componentCollector.stop();
		});

		componentCollector.on('end', async collected => {
			console.log(`Collected ${collected.size} interactions.`);
			if (!collected.size) {
				await row.components[0].setDisabled(true).setLabel('60s timeout');
				await interaction.editReply({ content: abbreviationDefinition, components: [row] });
			}
		});
	},

};