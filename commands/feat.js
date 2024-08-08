const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { bold, italic, codeBlock, inlineCode } = require('discord.js');
const libraryFile = require('../rules/feats.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('feat')
		.setDescription('Replies with feat definition.')
		.addStringOption(option =>
			option.setName('feat_name')
				.setDescription('The feat to search for.')
				.setAutocomplete(true)
				.setRequired(true)),

	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused().toLowerCase();
		const ruleList = [];

		for (const rule in libraryFile) {
			ruleList.push(libraryFile[rule]['name'].toLowerCase());
		}

		const filtered = ruleList.filter(choice => choice.startsWith(focusedValue));
		if (focusedValue.length >>> 1) {
			await interaction.respond(
				filtered.map(choice => ({ name: choice, value: choice })),
			);
		}
	},

	async execute(interaction) {

		// eslint-disable-next-line no-unused-vars
		const icon0 = ':zero:', icon1 = ':one:', icon2 = ':two:', icon3 = ':three:', icon4 = ':four:', icon5 = ':five:', icon6 = ':six:', icon7 = ':seven:', icon8 = ':eight:', icon9 = ':nine:', icon10 = ':one::zero:', icon11 = ':one::one:', icon12 = ':one::two:';

		let getInput = interaction.options.getString('feat_name');
		let ruleName;
		let ruleId = 'feat-';

		// prompt user to use the command correctly; later I may add a pop-up modal when the input is empty
		if (!getInput) {
			await interaction.reply({ content: 'Error: no feat provided.\nPlease type "/feat *feat name*" to request the feat definition.', ephemeral: true });
			return;
		}
		else {
			getInput = getInput.toLowerCase();
			getInput = getInput.replace(/'/g, '');
			// append input to 'feat-', and replace spaces with underscores
			ruleId += getInput.replace(/ /g, '_');
			console.log(interaction.user.username + ' used /feat to search for ' + getInput);
		}

		try {
			ruleName = libraryFile[ruleId]['name'];
		}
		catch (err) {
			console.log('err: no match found for "' + getInput + '"');
			await interaction.reply({ content: 'Error: no feat matching "' + getInput + '" found.\nPlease use the autoprediction to find a valid feat.', ephemeral: true });
			return;
		}

		const ruleDesc = libraryFile[ruleId]['description'];
		// const ruleBSID = libraryFile[ruleId]['bsid'];
		// const ruleRefs = [];
		const ruleCost = libraryFile[ruleId]['cost'];
		const ruleTiming = libraryFile[ruleId]['timing'];
		const ruleSubject = libraryFile[ruleId]['subject'];
		const ruleOpp = libraryFile[ruleId]['opposed'];
		const ruleRange = libraryFile[ruleId]['range'];
		const ruleLimits = libraryFile[ruleId]['limitations'];

		let iconCost;
		if (Number.isInteger(ruleCost)) { iconCost = eval('icon' + ruleCost + ';'); }

		const iconTiming = ' <:type' + ruleTiming + ':' + interaction.guild.emojis.cache.find(emoji => emoji.name === 'type' + ruleTiming.toLowerCase()) + '>';
		const iconSubject = ' <:subject' + ruleSubject + ':' + interaction.guild.emojis.cache.find(emoji => emoji.name === 'subject' + ruleSubject.toLowerCase()) + '>';

		// interaction.guild.emojis.cache.find(emoji => emoji.name === 'OppKi');
		const iconLimitBtB = '<:nobtb:' + interaction.guild.emojis.cache.find(emoji => emoji.name === 'nobtb') + '>';
		// const iconLimitOpA = '<:oncePerActivation:' + interaction.guild.emojis.cache.find(emoji => emoji.name === 'oncePerActivation') + '>';
		const iconLimitOpG = '<:oncepergame:' + interaction.guild.emojis.cache.find(emoji => emoji.name === 'oncepergame') + '>';
		const iconLimitOpT = '<:onceperturn:' + interaction.guild.emojis.cache.find(emoji => emoji.name === 'onceperturn') + '>';
		const iconLimitWalk = '<:nowalk:' + interaction.guild.emojis.cache.find(emoji => emoji.name === 'nowalk') + '>';

		let ruleStats, iconsLimits = '';
		ruleStats = iconCost + iconTiming + iconSubject;

		if (ruleRange) {
			if (Number.isInteger(ruleRange)) { ruleStats += ruleRange + '"'; }
			else { ruleStats += ' ' + ruleRange; }
		}
		if (ruleOpp) {
			ruleStats = ruleStats + ' Opp.Ki';
		}
		if (ruleLimits) {
			for (const limit of ruleLimits) {
				if (limit === 'noWalk') { iconsLimits = iconsLimits + iconLimitWalk; }
				else if (limit === 'noBtB') { iconsLimits = iconsLimits + iconLimitBtB; }
				else if (limit === 'OpG') { iconsLimits = iconsLimits + iconLimitOpG; }
				else if (limit === 'OpT') { iconsLimits = iconsLimits + iconLimitOpT; }
				else if (limit === 'OpA') { iconsLimits = iconsLimits + ' OpA '; }
			}
			ruleStats = ruleStats + iconsLimits;
		}

		const ruleRev = libraryFile[ruleId]['revision'];
		const ruleUpdated = libraryFile[ruleId]['updated'];
		var ruleDetails = '';

		if (ruleRev == 0) {
			ruleDetails = 'R' + ruleRev;
		} else {
			ruleDetails = 'R' + ruleRev + ' ( Updated:' + ruleUpdated + ')';
		}

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
			console.log(interaction.user.username + ' shared ' + ruleName + ' definition shared to ' + interaction.guild.name + '/' + interaction.channel.name);
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