const { SlashCommandBuilder } = require('discord.js');
const music = require('../utils/music');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pause')
		.setDescription('暫停音樂'),
	execute(interaction) {
		music.pause(interaction);
	},
};