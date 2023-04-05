const play = require('play-dl');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior, AudioPlayerStatus } = require('@discordjs/voice');

class Music {

    constructor() {
        /**
         * 下面的物件都是以 Discord guild id 當 key，例如：
         * this.isPlaying = {
         *     724145832802385970: false
         * }
         */

        /**
         * 機器人是否正在播放音樂
         * this.isPlaying = {
         *     724145832802385970: false
         * }
         */
        this.isPlaying = {};

        /**
         * 等待播放的音樂隊列，例如：
         * this.queue = {
         *     724145832802385970: [{
         *         name: 'G.E.M.鄧紫棋【好想好想你 Missing You】Official Music Video',
         *         url: 'https://www.youtube.com/watch?v=P6QXo88IG2c&ab_channel=GEM%E9%84%A7%E7%B4%AB%E6%A3%8B'
         *     }]
         * }
         */
        this.queue = {};

        // https://discord.js.org/#/docs/voice/main/class/VoiceConnection
        this.connection = {};

        // https://discord.js.org/#/docs/voice/main/class/AudioPlayer
        this.dispatcher = {};
    }

    // 取得指令列表
    command(interaction) {
        interaction.reply({ content: `【播放音樂】/play url:音樂網址\n【暫停播放】/pause\n【恢復播放】/resume\n【跳過這首歌曲】/skip\n【查看歌曲隊列】/queue\n【刪除播放清單中的所有歌曲】/deleteplaylist id:id\n【查看機器人指令】/command\n【讓機器人離開語音頻道（會清空歌曲隊列）】/leave` });
    }

    // 判斷網址是否為播放清單
    isPlayList(url) {
        if (url.indexOf('&list') > -1 && url.indexOf('music.youtube') < 0) {
            return true;
        }

        return false;
    }

    // 將機器人加入語音、處理歌曲資訊
    async play(interaction) {

        // 語音群的 ID
        const guildID = interaction.guildId;

        // 如果使用者不在語音頻道中則發出警告並返回
        if (interaction.member.voice.channel === null) {
            interaction.reply({ content: '請先進入語音頻道', ephemeral: true });
            return;
        }

        // 機器人加入語音
        this.connection[guildID] = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: guildID,
            adapterCreator: interaction.guild.voiceAdapterCreator
        });

        let musicURL = interaction.options.getString('url').trim();

        try {

            // 將歌曲資訊加入隊列
            if (!this.queue[guildID]) {
                this.queue[guildID] = [];
            }

            let musicName = null;

            // 檢查是否為播放清單
            const isPlayList = this.isPlayList(musicURL);
            if (isPlayList) {

                // 取得播放清單的資訊
                const res = await play.playlist_info(musicURL);
                musicName = res.title;

                // 取得前 10 筆播放清單的列表歌曲
                const videoTitles = res.videos.map((v, i) => `[${i+1}] ${v.title}`).slice(0, 10).join('\n');
                interaction.channel.send(`**加入播放清單：${musicName}**\nID 識別碼：[${res.id}]\n==========================\n${videoTitles}\n……以及其他 ${res.videos.length - 10} 首歌 `);

                // 依序將播放清單歌曲寫入隊列資料中
                res.videos.forEach(v => {
                    this.queue[guildID].push({
                        id: res.id,
                        name: v.title,
                        url: v.url
                    });
                });

            } else {

                // 取得影片資訊
                const res = await play.video_basic_info(musicURL);
                musicName = res.video_details.title;

                // 寫入隊列資料
                this.queue[guildID].push({
                    id: res.video_details.id,
                    name: musicName,
                    url: musicURL
                });

            }

            // 如果目前正在播放歌曲就加入隊列，反之則播放歌曲
            if (this.isPlaying[guildID]) {
                interaction.reply({ content: `歌曲加入隊列：${musicName}` });
            } else {
                this.isPlaying[guildID] = true;
                interaction.reply({ content: `🎵　播放音樂：${this.queue[guildID][0].name}` });
                this.playMusic(interaction, this.queue[guildID][0], true);
            }

        } catch(e) {
            console.log(e);
            interaction.reply({ content: '發生錯誤 :('});
        }

    }

    // 播放下一首歌
    playNextMusic(interaction) {

        const guildID = interaction.guildId;

        // 如果隊列中有歌曲則播放音樂
        if (this.queue[guildID].length > 0) {
            this.playMusic(interaction, this.queue[guildID][0], false);
        } else {
            this.isPlaying[guildID] = false;
        }
    }

    async playMusic(interaction, musicInfo, isReplied) {

        // 伺服器 ID
        const guildID = interaction.guildId;

        try {

            // 提示播放音樂
            if (!isReplied) {
                const content = `🎵　播放音樂：${musicInfo.name}`;
                interaction.channel.send(content);
            }
            
            // 播放音樂
            const stream = await play.stream(musicInfo.url);
            const resource = createAudioResource(stream.stream, {
                inputType: stream.type
            });

            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Play
                }
            });

            player.play(resource);

            this.connection[guildID].subscribe(player);
            this.dispatcher[guildID] = player;

            // 移除 queue 中目前播放的歌曲
            this.queue[guildID].shift();

            // 歌曲播放結束時的事件
            player.on('stateChange', (oldState, newState) => {

                if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                    this.playNextMusic(interaction);
                }

            });
        } catch(e) {
            console.log(e);
            interaction.channel.send('歌曲發生錯誤...');

            // 移除 queue 中目前播放的歌曲
            this.queue[guildID].shift();

            // 播放下一首歌
            this.playNextMusic(interaction);
        }

    }

    // 恢復播放
    resume(interaction) {

        const guildID = interaction.guildId;
        if (this.dispatcher[guildID]) {
            this.dispatcher[guildID].unpause();
            interaction.reply({ content: '恢復播放' });
        } else {
            interaction.reply({ content: '機器人目前未加入頻道' });
        }

    }

    // 暫停播放
    pause(interaction) {

        const guildID = interaction.guildId;
        if (this.dispatcher[guildID]) {
            this.dispatcher[guildID].pause();
            interaction.reply({ content: '暫停播放' });
        } else {
            interaction.reply({ content: '機器人目前未加入頻道' });
        }

    }

    // 跳過目前歌曲
    skip(interaction) {

        const guildID = interaction.guildId;
        if (this.dispatcher[guildID]) {
            this.dispatcher[guildID].stop();
            interaction.reply({ content: '跳過目前歌曲' });
        } else {
            interaction.reply({ content: '機器人目前未加入頻道' });
        }

    }

    // 取得目前隊列中的歌曲
    nowQueue(interaction) {

        const guildID = interaction.guildId;

        // 如果隊列中有歌曲就顯示
        if (this.queue[guildID] && this.queue[guildID].length > 0) {
            let queueString = '';

            // 字串處理，將 Object 組成字串
            let queue = this.queue[guildID].map((item, index) => `[${index+1}] ${item.name}`);
            if (queue.length > 10) {
                queue = queue.slice(0, 10);
                queueString = `目前歌單：\n${queue.join('\n')}\n……與其他 ${this.queue[guildID].length - 10} 首歌`;
            } else {
                queueString = `目前歌單：\n${queue.join('\n')}`;
            }

            interaction.reply({ content: queueString });
        } else {
            interaction.reply({ content: '目前隊列中沒有歌曲' });
        }

    }

    // 刪除隊列中播放清單的所有歌曲
    deletePlayList(interaction) {
        const guildID = interaction.guildId;
        const id = interaction.options.getString('id').trim();

        // 刪除特定播放清單的所有歌曲
        this.queue[guildID] = this.queue[guildID].filter(q => q.id !== id);
        interaction.reply({ content: `刪除ID為 ${id} 的播放清單歌曲` });
    }

    // 將機器人退出語音頻道
    leave(interaction) {

        const guildID = interaction.guildId;

        // 如果機器人在頻道中
        if (this.connection[guildID]) {

            // 如果機器人有播放過歌曲
            if (this.queue.hasOwnProperty(guildID)) {

                // 清空播放列表
                delete this.queue[guildID];

                // 改變 isPlaying 狀態為 false
                this.isPlaying[guildID] = false;
            }

            // 離開頻道
            this.connection[guildID].disconnect();

            interaction.reply({ content: '離開頻道' });
        } else {
            interaction.reply({ content: '機器人未加入任何頻道' });
        }

    }
}

module.exports = new Music();