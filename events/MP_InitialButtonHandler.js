const { Interaction, InteractionType } = require("discord.js")
const Genaral_DatabaseManager = require("../commands_modules/general_modules/general_dbManager.js")
const MovieParser_FunctionManager = require("../commands_modules/movie_parser/mp_functionManager.js")
const MovierParser_Interaction_Components = require("../commands_modules/movie_parser/mp_component.js")
const TMDB_SessionId = require("../databaseFunction/TMDB_SessionId.js")
const client = require("../index.js")
client.on("interactionCreate", async (interaction) => {
  if (interaction.type == InteractionType.MessageComponent) {
    if (interaction.customId == "searchMovie") {
      interaction.deferUpdate()
      let custom_desc
      let custom_color
      const user_id = interaction.user.id

      const mp_InteractionComponents = new MovierParser_Interaction_Components()
      const tmdb_AuthenticationEmbed =
        mp_InteractionComponents.tmdb_AuthenticationEmbed

      const tmdb_SessionId = new TMDB_SessionId()
      const sessionId = await tmdb_SessionId.getSessionId(user_id)
      if (!sessionId) {
        custom_desc =
          "你還沒有登入! \n 請前往\n https://www.themoviedb.org/signup **註冊賬號**, \n 並且請使用 `/tmdb-登入` 指令登入"
        custom_color = "#FF0000"
        tmdb_AuthenticationEmbed.setDescription(custom_desc)
        tmdb_AuthenticationEmbed.setColor(custom_color)
        const informLoginMsg = await interaction.channel.send({
          embeds: [tmdb_AuthenticationEmbed]
        })
        setTimeout(() => {
          informLoginMsg.delete()
        }, 60000)
        return
      }
      interaction.deferUpdate()

      const informKeyInMsg = await interaction.channel.send({
        content: "请输入你要搜索的电影名字"
      })
      const mp_functionManager = new MovieParser_FunctionManager()

      const collectorFilter = (m) => m.author.id === user_id
      const msgCollector = interaction.channel.createMessageCollector({
        filter: collectorFilter,
        time: 60000,
        max: 1
      })
      msgCollector.on("collect", async (message) => {
        const channel_id = message.channel.id
        const guild_id = message.guild.id
        const user_id = message.author.id
        const channel = message.guild.channels.cache.get(channel_id)
        const user_avatar = message.author.avatarURL()
        const displayName = interaction.user.displayName

        // console.log(
        //   `Interaction_display_name: ${interaction.member.displayName}`
        // )

        let keyword = message.content
        // await informKeyInMsg.delete()
        const { media_type, media_data } =
          await mp_functionManager.handleMediaSearch(
            message,
            channel_id,
            keyword,
            null
          )
        let searchedData = {
          media_type: media_type,
          media_data: media_data
        }
        let user_info = {
          sessionId: sessionId,
          user_avatar: user_avatar,
          displayName: displayName
        }
        let interaction_params = {
          message: message,
          channel: channel
        }
        await mp_functionManager.convertEmbedSendMediaInfoAndSendRatingForm(
          searchedData,
          user_info,
          interaction_params
        )

        // await channel.send({
        //   content: `你评分${ratingScore}`
        // })
        console.log(`Collected ${message.content}`)
      })

      msgCollector.on("end", async (collected) => {
        await informKeyInMsg.delete()

        console.log(`Collected ${collected.size} items`)
      })

      //   console.log("searchMovie")
    }
  }
})