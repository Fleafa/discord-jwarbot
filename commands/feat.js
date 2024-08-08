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
		const featList = [];

		for (const feat in libraryFile) {
			featList.push(libraryFile[feat]['name'].toLowerCase());
		}

		const filtered = featList.filter(choice => choice.startsWith(focusedValue));
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
		let featName;
		let featId = 'feat-';

		// prompt user to use the command correctly; later I may add a pop-up modal when the input is empty
		if (!getInput) {
			await interaction.reply({ content: 'Error: no feat provided.\nPlease type "/feat *feat name*" to request the feat definition.', ephemeral: true });
			return;
		}
		else {
			getInput = getInput.toLowerCase();
			getInput = getInput.replace(/'/g, '');
			// append input to 'feat-', and replace spaces with underscores
			featId += getInput.replace(/ /g, '_');
			console.log(interaction.user.username + ' used /feat to search for ' + getInput);
		}

		try {
			featName = libraryFile[featId]['name'];
		}
		catch (err) {
			console.log('err: no match found for "' + getInput + '"');
			await interaction.reply({ content: 'Error: no feat matching "' + getInput + '" found.\nPlease use the autoprediction to find a valid feat.', ephemeral: true });
			return;
		}

		const featDesc = libraryFile[featId]['description'];
		// const featBSID = libraryFile[featId]['bsid'];
		// const featRefs = [];
		const featCost = libraryFile[featId]['cost'];
		const featTiming = libraryFile[featId]['timing'];
		const featSubject = libraryFile[featId]['subject'];
		const featOpp = libraryFile[featId]['opposed'];
		const featRange = libraryFile[featId]['range'];
		const featLimits = libraryFile[featId]['limitations'];

		let iconCost;
		if (Number.isInteger(featCost)) { iconCost = eval('icon' + featCost + ';'); }

		const iconTiming = ' <:type' + featTiming + ':' + interaction.guild.emojis.cache.find(emoji => emoji.name === 'type' + featTiming.toLowerCase()) + '>';
		const iconSubject = ' <:subject' + featSubject + ':' + interaction.guild.emojis.cache.find(emoji => emoji.name === 'subject' + featSubject.toLowerCase()) + '>';

		// interaction.guild.emojis.cache.find(emoji => emoji.name === 'OppKi');
		const iconLimitBtB = '<:nobtb:' + interaction.guild.emojis.cache.find(emoji => emoji.name === 'nobtb') + '>';
		// const iconLimitOpA = '<:oncePerActivation:' + interaction.guild.emojis.cache.find(emoji => emoji.name === 'oncePerActivation') + '>';
		const iconLimitOpG = '<:oncepergame:' + interaction.guild.emojis.cache.find(emoji => emoji.name === 'oncepergame') + '>';
		const iconLimitOpT = '<:onceperturn:' + interaction.guild.emojis.cache.find(emoji => emoji.name === 'onceperturn') + '>';
		const iconLimitWalk = '<:nowalk:' + interaction.guild.emojis.cache.find(emoji => emoji.name === 'nowalk') + '>';

		let featStats, iconsLimits = '';
		featStats = iconCost + iconTiming + iconSubject;

		if (featRange) {
			if (Number.isInteger(featRange)) { featStats += featRange + '"'; }
			else { featStats += ' ' + featRange; }
		}
		if (featOpp) {
			featStats = featStats + ' Opp.Ki';
		}
		if (featLimits) {
			for (const limit of featLimits) {
				if (limit === 'noWalk') { iconsLimits = iconsLimits + iconLimitWalk; }
				else if (limit === 'noBtB') { iconsLimits = iconsLimits + iconLimitBtB; }
				else if (limit === 'OpG') { iconsLimits = iconsLimits + iconLimitOpG; }
				else if (limit === 'OpT') { iconsLimits = iconsLimits + iconLimitOpT; }
				else if (limit === 'OpA') { iconsLimits = iconsLimits + ' OpA '; }
			}
			featStats = featStats + iconsLimits;
		}

		const featRev = libraryFile[featId]['revision'];
		const featUpdated = libraryFile[featId]['updated'];

		if (featRev = 0) {
			const featDetails = 'R' + featRev;
		} else {
			const featDetails = 'R' + featRev + ' ( Updated:' + featUpdated + ')';
		}

		const featDefinition = bold(featName) + '\n' + featStats + codeBlock(featDesc) + italic(featDetails);

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('feat_share')
					.setLabel('share here')
					.setStyle(ButtonStyle.Primary)
					.setDisabled(false),
			);

		await interaction.reply({ content: featDefinition, components: [row], ephemeral: true, fetchReply: true });

		const filter = i => i.customId === 'feat_share';
		const componentCollector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

		componentCollector.on('collect', async i => {
		//	not using featDefinition so can insert command helper
			await interaction.channel.send(bold(featName) + italic('\tvia /feat') + '\n' + featStats + codeBlock(featDesc) + inlineCode(featDetails));
			await i.update({ content: 'shared to channel', components: [] });
			console.log(interaction.user.username + ' shared ' + featName + ' definition shared to ' + interaction.guild.name + '/' + interaction.channel.name);
			componentCollector.stop();
		});

		componentCollector.on('end', async collected => {
			console.log(`Collected ${collected.size} interactions.`);
			if (!collected.size) {
				await row.components[0].setDisabled(true).setLabel('60s timeout');
				await interaction.editReply({ content: featDefinition, components: [row] });
			}
		});
	},

};