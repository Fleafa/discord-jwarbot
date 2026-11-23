const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');
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

const featsDirectory = path.join(__dirname, '../rules/feats');
const costIcons = [
	':zero:', ':one:', ':two:', ':three:', ':four:', ':five:',
':six:', ':seven:', ':eight:', ':nine:', ':one::zero:',
':one::one:', ':one::two:',
];

function loadFeats() {
	const feats = {};
	const choices = [];

	for (const filename of fs.readdirSync(featsDirectory)) {
		if (!filename.endsWith('.md')) continue;

		const filePath = path.join(featsDirectory, filename);
		const { data, content } = matter.read(filePath);
		const filenameStem = path.basename(filename, '.md');
		const name = String(data.title ?? data.name ?? filenameStem);
		const description = removeWikiLinks(content.trim());

		feats[filenameStem] = {
			...data,
			name,
			description,
		};

		choices.push({
			name,
			value: filenameStem,
			filenameStem,
		});
	}

	return { feats, choices };
}

function removeWikiLinks(markdown) {
	return markdown
	// [[Target|Display]] → Display
	.replace(/\[\[([^[\]|]+)\|([^[\]]+)\]\]/g, '$2')
	// [[Target]] → Target
	.replace(/\[\[([^[\]]+)\]\]/g, '$1')
	// [[Target#Section|Display]] / [[Target#Section]] → display/target
	.replace(/\[\[([^[\]|#]+)(?:#[^[\]|]+)?(?:\|([^[\]]+))?\]\]/g,
			 (_match, target, display) => display ?? target);
}

const { feats: libraryFile, choices: featChoices } = loadFeats();

function getCustomEmoji(interaction, name) {
	const emoji = interaction.guild?.emojis.cache.find(item => item.name === name);
	return emoji ? `<:${emoji.name}:${emoji.id}>` : '';
}

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
		try {
			const focusedValue = interaction.options
			.getFocused()
			.toLowerCase();

			const choices = featChoices
			.filter(choice =>
			choice.name.toLowerCase().includes(focusedValue) ||
			choice.filenameStem.toLowerCase().includes(focusedValue)
			)
			.slice(0, 25)
			.map(choice => ({
				name: choice.name,
				value: choice.value,
			}));

			if (!interaction.responded) {
				await interaction.respond(choices);
			}
		}
		catch (error) {
			console.error('Autocomplete error:', error);
		}
	},

	async execute(interaction) {
		await interaction.deferReply({
			flags: MessageFlags.Ephemeral,
		});

		const filenameStem = interaction.options.getString('feat_name');
		const rule = libraryFile[filenameStem];

		if (!rule) {
			await interaction.editReply({
				content: `No feat matching "${filenameStem}" found. Please use autocomplete to select a feat.`,
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

		let ruleDetails = '';
		if (ruleRev != null) {
			ruleDetails = ruleRev === 0
			? `R${ruleRev}`
			: `R${ruleRev} (updated ${ruleUpdated ?? 'unknown'})`;
		}

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
			console.log('button collect', i.id, i.deferred, i.replied);
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
