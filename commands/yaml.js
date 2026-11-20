const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, bold, italic, codeBlock, inlineCode } = require('discord.js');

const featsDirectory = path.join(__dirname, '../rules/feats');

function loadFeats() {
	const feats = {};

	for (const filename of fs.readdirSync(featsDirectory)) {
		if (!filename.endsWith('.md')) continue;

		const filePath = path.join(featsDirectory, filename);
		const { data, content } = matter.read(filePath);
		const id = path.basename(filename, '.md');

		feats[id] = {
			...data,
			name: data.name,
			description: content.trim(),
		};
	}

	return feats;
}

const libraryFile = loadFeats();
const costIcons = [':zero:', ':one:', ':two:', ':three:', ':four:', ':five:', ':six:', ':seven:', ':eight:', ':nine:', ':one::zero:', ':one::one:', ':one::two:'];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('yaml')
		.setDescription('Replies with feat definition.')
		.addStringOption(option =>
			option.setName('feat_name')
				.setDescription('The feat to search for.')
				.setAutocomplete(true)
				.setRequired(true)),

	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();

		if (!focusedValue) {
			await interaction.respond([]);
			return;
		}

		const choices = Object.values(libraryFile)
		.map(rule => rule.name)
		.filter(name => name.toLowerCase().startsWith(focusedValue))
		.slice(0, 25)
		.map(name => ({ name, value: name }));

		await interaction.respond(choices);
	},

	async execute(interaction) {

		const getInput = interaction.options.getString('feat_name');

		// prompt user to use the command correctly; later I may add a pop-up modal when the input is empty
		if (!getInput) {
			await interaction.reply({ content: 'Error: no feat provided.\nPlease type "/feat *feat name*" to request the feat definition.', ephemeral: true });
			return;
		}

		const ruleId = getInput;
		const rule = libraryFile[ruleId];

		if (!rule) {
			console.log(`err: no match found for "${getInput}"`);
			await interaction.reply({
				content: `Error: no feat matching "${getInput}" found.\nPlease use the autocomplete to find a valid feat.`,
				ephemeral: true,
			});
			return;
		}

		console.log(`${interaction.user.username} used /feat to search for ${getInput}`);

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

		function customEmoji(name) {
			const emoji = interaction.guild?.emojis.cache.find(item => item.name === name);
			return emoji ? `<:${emoji.name}:${emoji.id}>` : '';
		}

		const iconCost = Number.isInteger(ruleCost) ? (costIcons[ruleCost] ?? String(ruleCost)) : String(ruleCost ?? '');

		const iconTiming = customEmoji(`type${String(ruleTiming ?? '').toLowerCase()}`);
		const iconSubject = customEmoji(`subject${String(ruleSubject ?? '').toLowerCase()}`);

		let ruleStats = [iconCost, iconTiming, iconSubject].filter(Boolean).join(' ');

		if (ruleRange) {
			ruleStats += Number.isInteger(ruleRange) ? ` ${ruleRange}"` : ` ${ruleRange}`;
		}

		if (ruleOpp) {
			ruleStats += ' Opp.Ki';
		}

		if (Array.isArray(ruleLimits)) {
			for (const limit of ruleLimits) {
				if (limit === 'noWalk') ruleStats += ` ${customEmoji('nowalk')}`;
				else if (limit === 'noBtB') ruleStats += ` ${customEmoji('nobtb')}`;
				else if (limit === 'OpG') ruleStats += ` ${customEmoji('oncepergame')}`;
				else if (limit === 'OpT') ruleStats += ` ${customEmoji('onceperturn')}`;
				else if (limit === 'OpA') ruleStats += ' OpA ';
			}
		}

		const ruleDetails = ruleRev == null ? '' : ruleRev === 0 ? `R${ruleRev}` : `R${ruleRev} (updated ${ruleUpdated ?? 'unknown'})`;

		const ruleDefinition = bold(ruleName) + '\n' + ruleStats + codeBlock(ruleDesc) + italic(ruleDetails);

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('rule_share')
					.setLabel('share here')
					.setStyle(ButtonStyle.Primary)
					.setDisabled(false),
			);

		await interaction.reply({ content: ruleDefinition, components: [row], ephemeral: true, fetchReply: true });

		const filter = i => i.customId === 'rule_share';
		const componentCollector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

		componentCollector.on('collect', async i => {
		//	not using ruleDefinition so can insert command helper
			await interaction.channel.send(bold(ruleName) + italic('\tvia /feat') + '\n' + ruleStats + codeBlock(ruleDesc) + inlineCode(ruleDetails));
			await i.update({ content: 'shared to channel', components: [] });
			console.log(`${interaction.user.username} shared ${ruleName} definition to ` + `${interaction.guild.name}/${interaction.channel.name}`);
			componentCollector.stop();
		});

		componentCollector.on('end', async collected => {
			console.log(`Collected ${collected.size} interactions.`);
			if (!collected.size) {
				await row.components[0].setDisabled(true).setLabel('60s timeout');
				await interaction.editReply({ content: ruleDefinition, components: [row] });
			}
		});
	},

};
