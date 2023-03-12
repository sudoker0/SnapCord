enum DiscordAPILink {
    ACCOUNT_INFO = "https://discordapp.com/api/users/@me",
    GUILD_LIST = "https://discordapp.com/api/users/@me/guilds",
    GUILD_MY_INFO = "https://discordapp.com/api/users/@me/guilds/$<guild_id>/member",

    ACCOUNT_AVATAR = "https://cdn.discordapp.com/avatars/$<user_id>/$<image_hash>.png?size=$<size>",
    EMOJI = "https://cdn.discordapp.com/emojis/$<emoji_id>.png",
    ANIMATED_EMOJI = "https://cdn.discordapp.com/emojis/$<emoji_id>.gif",
    GUILD_AVATAR = "https://cdn.discordapp.com/icons/$<server_id>/$<image_hash>.png?size=$<size>",

    GUILD_DATA = "https://discordapp.com/api/guilds/$<guild_id>",
    GUILD_CHANNEL_LIST = "https://discordapp.com/api/v9/guilds/$<guild_id>/channels",
    GUILD_USER_INFO = "https://discordapp.com/api/v9/guilds/$<guild_id>/members/$<user_id>",
    GUILD_ROLE = "https://discordapp.com/api/v9/guilds/$<guild_id>/roles",
    GUILD_GET_LAST_CHANNEL_MSG = "https://discord.com/api/v9/channels/$<channel_id>/messages?limit=$<limit>",
    GUILD_GET_CHANNEL_MSG = "https://discord.com/api/v9/channels/$<channel_id>/messages?before=$<last_msg_id>&limit=$<limit>",
}
export { DiscordAPILink }