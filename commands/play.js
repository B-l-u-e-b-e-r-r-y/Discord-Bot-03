const { SlashCommandBuilder } = require('discord.js');
const music = require('../utils/music');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('播放音樂')
		.addStringOption(option => option.setName('url').setDescription('提供 Youtube url 網址').setRequired(true)),
	async execute(interaction) {
		await music.play(interaction);
	},
};