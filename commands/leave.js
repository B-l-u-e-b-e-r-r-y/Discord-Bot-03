const { SlashCommandBuilder } = require('discord.js');
const music = require('../utils/music');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leave')
		.setDescription('讓機器人離開語音頻道（會清空歌曲隊列）'),
	execute(interaction) {
		music.leave(interaction);
	},
};