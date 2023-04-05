const { SlashCommandBuilder } = require('discord.js');
const music = require('../utils/music');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('command')
		.setDescription('查看機器人指令'),
	execute(interaction) {
		music.command(interaction);
	},
};