const { REST, Routes } = require('discord.js');
const { clientId, token } = require('./config.json');

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
	try {
		// for global commands
		rest.put(Routes.applicationCommands(clientId), { body: [] })
			.then(() => console.log('Successfully deleted all application commands.'))
			.catch(console.error);
	}
	catch (error) {
		console.error(error);
	}
})();