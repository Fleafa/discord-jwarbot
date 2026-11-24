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

const rulesDirectory = path.join(__dirname, '../rules/feats');

const { rulesLibrary: rulesLibrary, rulesOptions: rulesOptions } = loadRules(rulesDirectory);

const costIcons = [
	':zero:', ':one:', ':two:', ':three:', ':four:', ':five:',
':six:', ':seven:', ':eight:', ':nine:', ':one::zero:',
':one::one:', ':one::two:',
];

module.exports = {
	data: new SlashCommandBuilder()
	.setName('feat')
	.setDescription('Replies with feat definition.')
	.addStringOption(option =>
	option
	.setName('feat_name')
	.setDescription('The feat to search for.')
	.setAutocomplete(true)
	.setRequired(true),
	),

	async autocomplete(interaction) {
		await autocompleteRules(interaction, rulesOptions);
	},

	async execute(interaction) {
		await interaction.deferReply({
			flags: MessageFlags.Ephemeral,
		});

		const filenameStem = interaction.options.getString('feat_name');
		const rule = rulesLibrary[filenameStem];

		if (!rule) {
			await interaction.editReply({
				content: `${filenameStem}" not found. This may be due to case sensitivity. Please use the autocompletion suggestions.`,
			});
			return;
		}

		console.log(`${interaction.user.username} used /feat to search for ${rule.name}`);

		const {
			name: ruleName,
			description: ruleDesc,
			cost: ruleCost,
			timing: ruleTiming,
			subject: ruleSubject,
			opposed: ruleOpp,
			range: ruleRange,
			limitations: ruleLimits,
			revision: ruleRev,
			updated: ruleUpdated,
		} = rule;

		const iconCost = Number.isInteger(ruleCost)
		? (costIcons[ruleCost] ?? String(ruleCost))
		: String(ruleCost ?? '');

		const iconTiming = getCustomEmoji(
			interaction,
			`type${String(ruleTiming ?? '').toLowerCase()}`,
		);
		const iconSubject = getCustomEmoji(
			interaction,
			`subject${String(ruleSubject ?? '').toLowerCase()}`,
		);

		let ruleStats = [iconCost, iconTiming, iconSubject]
		.filter(Boolean)
		.join(' ');

		if (ruleRange != null) {
			ruleStats += Number.isInteger(ruleRange)
			? ` ${ruleRange}"`
			: ` ${ruleRange}`;
		}

		if (ruleOpp) ruleStats += ' Opp.Ki';

		for (const limit of ruleLimits ?? []) {
			const limitEmojis = {
				noWalk: 'nowalk',
				noBtB: 'nobtb',
				OpG: 'oncepergame',
				OpT: 'onceperturn',
			};

			if (limitEmojis[limit]) {
				ruleStats += ` ${getCustomEmoji(interaction, limitEmojis[limit])}`;
			}
			else if (limit === 'OpA') {
				ruleStats += ' OpA';
			}
		}

		const detailRevision = ruleRev == null ? `` : `R${ruleRev}`;
		const detailUpdated = ruleUpdated == null ? `` : `(${ruleUpdated})`;

		const ruleDetails = [detailRevision, detailUpdated]
		.filter(Boolean)
		.join('\t');

		const ruleDefinition =
		`${bold(ruleName)}\n${ruleStats}${codeBlock(ruleDesc)}${italic(ruleDetails)}`;

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
			.setCustomId(`rule_share:${interaction.id}`)
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
				`${bold(ruleName)}${italic('\tvia /feat')}\n` +
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
