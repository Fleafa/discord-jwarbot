const path = require('node:path');
const {
	SlashCommandBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageFlags,
	bold,
	italic,
	codeBlock,
	inlineCode,
} = require('discord.js');
const {
	loadRules,
	autocompleteRules,
	getCustomEmoji,
}= require('../functions.js');

const rulesDirectory = path.join(__dirname, '../rules/states');

const { rulesLibrary: rulesLibrary, rulesOptions: rulesOptions } = loadRules(rulesDirectory);

module.exports = {
	data: new SlashCommandBuilder()
	.setName('state')
	.setDescription('Replies with state definition.')
	.addStringOption(option =>
	option
	.setName('state_name')
	.setDescription('The state to search for.')
	.setAutocomplete(true)
	.setRequired(true)),

	async autocomplete(interaction) {
		await autocompleteRules(interaction, rulesOptions);
	},

	async execute(interaction) {
		await interaction.deferReply({
			flags: MessageFlags.Ephemeral,
		});

		const filenameStem = interaction.options.getString('state_name');
		const rule = rulesLibrary[filenameStem];

		if (!rule) {
			await interaction.editReply({
				content: `${filenameStem}" not found. This may be due to case sensitivity. Please use the autocompletion suggestions.`,
			});
			return;
		}

		console.log(`${interaction.user.username} used /state to search for ${rule.name}`);

		const {
			name: ruleName,
			description: ruleDesc,
			revision: ruleRev,
			updated: ruleUpdated,
			page:rulePage,
			pageR1:rulePageR1,
			pageR2:rulePageR2,
		} = rule;

		const detailRevision = ruleRev == null ? `` : `R${ruleRev}`;
		const detailUpdated = ruleUpdated == null ? `` : `(${ruleUpdated})`;

		const detailPages = [
			rulePage != null && `Risen Sun: p.${rulePage}`,
			rulePageR1 != null && `2022 reprint: p.${rulePageR1}`,
			rulePageR2 != null && `2026 reprint: p.${rulePageR2}`,
		].filter(Boolean).join('\t');

		const ruleDetails = [detailRevision, detailUpdated, detailPages]
		.filter(Boolean)
		.join('\t');

		const ruleDefinition =
		`${bold(ruleName)}${codeBlock(ruleDesc)}${italic(ruleDetails)}`;
		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
			.setCustomId('rule_share${interaction.id}')
			.setLabel('share here')
			.setStyle(ButtonStyle.Primary),
		);

		const reply = await interaction.editReply({
			content: ruleDefinition,
			components: [row],
		});

		const componentCollector = reply.createMessageComponentCollector({
			filter: i =>
			i.customId === `rule_share:${interaction.id}`,
			time: 60_000,
		});

		componentCollector.on('collect', async i => {
			await i.deferUpdate();

			await interaction.channel.send(
				`${bold(ruleName)}${italic('\tvia /state')}\n` +
				`${ruleStats}${codeBlock(ruleDesc)}${inlineCode(ruleDetails)}`,
			);

			await interaction.editReply({
				content: 'Shared to channel.',
				components: [],
			});

			console.log(
				`${interaction.user.username} shared ${ruleName} in ` +
				`${interaction.guild.name}/${interaction.channel.name}`,
			);

			componentCollector.stop();
		});

		componentCollector.on('end', async collected => {
			if (collected.size === 0) {
				row.components[0].setDisabled(true).setLabel('60s timeout');
				await interaction.editReply({
					content: ruleDefinition,
					components: [row],
				});
			}
		});
	},

};
