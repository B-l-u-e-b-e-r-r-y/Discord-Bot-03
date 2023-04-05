// 引入需要的模組
const fs = require("node:fs"); // 用於讀寫檔案
const path = require("node:path"); // 用於處理路徑
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js"); // 引入 Discord.js 模組
const { token } = require("./config.json"); // 從 config.json 讀取 token

// 創建一個 Discord.js client
const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

// 創建一個 Collection 來存放指令
client.commands = new Collection();

// 用來存放 commands
const commands = [];

// 讀取 commands 資料夾下的 js 檔案
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

// 將指令加入 Collection
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);

	// 在 Collection 中以指令名稱作為 key，指令模組作為 value 加入
	if ("data" in command && "execute" in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[警告] ${filePath} 中的指令缺少必要的 "data" 或 "execute" 屬性。`);
	}

	// 存進 commands array
	commands.push(command.data.toJSON());
}

// 當收到互動事件時，檢查是否為指令，若是則執行該指令
client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`找不到指令 ${interaction.commandName}。`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: "執行指令時發生錯誤！",
				ephemeral: true,
			});
		} else {
			await interaction.reply({
				content: "執行指令時發生錯誤！",
				ephemeral: true,
			});
		}
	}
});

// 註冊指令
const registerCommands = async (client) => {
	try {
		if (client.application) {
			console.log(`Started refreshing ${commands.length} application (/) commands.`);
			const data = await client.application.commands.set(commands);
			console.log(`Successfully reloaded ${data.size} application (/) commands.`);
		}
	} catch(e) {
		console.error(e);
	}
}

// 當 client 就緒時顯示訊息
client.once(Events.ClientReady, async (client) => {
	console.log(`已就緒！已登入帳號：${client.user.tag}`);
	await registerCommands(client);
});

// 使用 token 進行登入
client.login(token);
