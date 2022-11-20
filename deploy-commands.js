const { REST, Routes } = require('discord.js');
const { clientId, guildDevId, token } = require('./config.json');
const fs = require('node:fs');

const commands = [];
const devcommands = [];

// Get command files from the commands directory, excluding dev commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js') && !file.endsWith('-dev.js'));
// Get dev command files from the commands directory
const devcommandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('-dev.js'));

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

		// The put method is used to fully refresh all global commands with the current set
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	}
	catch (error) {
		console.error(error);
	}


	try {
		console.log(`Started refreshing ${devcommands.length} application (/) commands.`);

		// dev commands are only deployed to the dev guild
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildDevId),
			{ body: devcommands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	}
	catch (error) {
		console.error(error);
	}
})();