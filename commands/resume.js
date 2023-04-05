const { SlashCommandBuilder } = require('discord.js');
const music = require('../utils/music');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resume')
		.setDescription('恢復播放'),
	execute(interaction) {
		music.resume(interaction);
	},
};