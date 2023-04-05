const { SlashCommandBuilder } = require('discord.js');
const music = require('../utils/music');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('查看目前歌曲隊列'),
	execute(interaction) {
		music.nowQueue(interaction);
	},
};