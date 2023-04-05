const { REST, Routes } = require('discord.js');
const { clientId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];

// 從之前創建的 commands 目錄中取出所有命令文件
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// 從每個命令的資料中取出 SlashCommandBuilder#toJSON() 的輸出以進行 deploy
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

// 創建並準備 REST 模組的一個實例
const rest = new REST({ version: '10' }).setToken(token);

// 部署 commands
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// 使用 put 方法更新 DC 群中所有 commands
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();