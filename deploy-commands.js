const { REST, Routes } = require('discord.js');
const { clientId, guildDevId, guildBushidoId, token } = require('./config.json');
const fs = require('node:fs');

const commands = [];
const devcommands = [];

// Get command files from the commands directory, excluding dev commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js') && !file.endsWith('-dev.js'));
// Get dev command files from the commands directory
const devcommandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each global command's data for deployment
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

for (const file of devcommandFiles) {
	const command = require(`./commands/${file}`);
	devcommands.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

// Deploy commands
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method fully refreshes all commands
		const data = await rest.put(
			// only non-dev commands are deployed to the live guild (GCT Studios Bushido)
			Routes.applicationGuildCommands(clientId, guildBushidoId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	}
	catch (error) {
		console.error(error);
	}


	try {
		console.log(`Started refreshing ${devcommands.length} application (/) commands.`);

		const data = await rest.put(
			// all commands, including those in-development, are deployed to the dev guild
			Routes.applicationGuildCommands(clientId, guildDevId),
			{ body: devcommands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	}
	catch (error) {
		console.error(error);
	}
})();