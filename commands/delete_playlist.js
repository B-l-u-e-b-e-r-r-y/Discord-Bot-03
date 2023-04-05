const { SlashCommandBuilder } = require('discord.js');
const music = require('../utils/music');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('deleteplaylist')
		.setDescription('刪除播放清單中的所有歌曲')
		.addStringOption(option => option.setName('id').setDescription('提供播放清單的 ID 識別碼').setRequired(true)),
	execute(interaction) {
		music.deletePlayList(interaction);
	},
};