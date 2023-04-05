const { SlashCommandBuilder } = require('discord.js');
const music = require('../utils/music');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('跳過這首歌'),
	execute(interaction) {
		music.skip(interaction);
	},
};