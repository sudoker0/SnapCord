//import { invoke } from "@tauri-apps/api/tauri";
import { DiscordAPILink } from "./url"
import * as ConstData from "./const"
import {
    qSel,
    qSelAll,
    wait,
    templateStr,
    any,
    clearChild,
    escapeHTML,
    string2Hex,
    hex2String
} from "./function"
import highlightjs from "highlight.js"

let token = ""
let currentServerData: Guild | null = null
let currentChannelList: GuildChannel[] | null = null
let currentChannel: string | null = ""

HTMLElement.prototype.replace = function (data: Template, prefix: string = "$_") {
    const alternate_prefix = "id_dlr_"
    const _this: () => HTMLElement = () => this

    for (const i in data) {
        const old = _this().innerHTML
        const span: () => HTMLElement | null = () =>
            _this().querySelector(`span.reactive#${alternate_prefix}${i}`)
        if (span() == null) _this().innerHTML =
            old.replace(
                `${prefix}${i}`,
                `<spanclass="reactive" id="${alternate_prefix}${i}"></spanclass=>`)

        span()!!.innerText = data[i]
    }
}

String.prototype.replaceAllAsync = async function (
    regex: RegExp,
    asyncFn: (match: string, ...args: string[]) => Promise<string>) {
        const _this: () => String = () => this
        const promises: Promise<any>[] = []
        _this().replaceAll(regex, (match, ...args) => {
            const promise = asyncFn(match, ...args)
            promises.push(promise)
            return match
        })
        const data = await Promise.all(promises)
        return _this().replaceAll(regex, () => data.shift())
    }

const LOGIN_BUTTON = qSel<HTMLButtonElement>("#login")
const API_HEADER = (token: string) => new Headers({
    'Accept': 'application/json',
    'Authorization': token
})
const MessageObserver = new IntersectionObserver(async (entries, _observer) => {
    for (const v of entries) {
        if (v.isIntersecting) {
            var last_msg = qSel("div#actual_chat_content")?.children[0]
            await displayMessage(
                currentServerData?.id || "",
                currentChannel || "",
                last_msg?.getAttribute("data-chatid") || "")
            last_msg?.scrollIntoView()
        }
    }
})

// Switch tab given a tab ID
async function switchTab(tabid: string) {
    let selTab = qSel(`.tab_layout .sidebar button[data-tab=${tabid}]`),
        selContent = qSel(`.tab_layout .content div[data-tabcontent=${tabid}]`)
    if (selTab == null || selContent == null) return

    qSelAll(`.tab_layout .sidebar button[data-tab]`)
        ?.forEach(e => e.setAttribute("data-selected", "false"))
    qSelAll(`.tab_layout .content div[data-tabcontent]`)
        ?.forEach(e => e.setAttribute("data-tabselected", "false"))

    selTab.setAttribute("data-selected", "true")
    selContent.setAttribute("data-tabselected", "true")

    await init(tabid)
}
window.switchTab = switchTab

// Switch from different channel in a guild
async function switchChannel(guildId: string, channelId: string) {
    let selChannel = qSel(`div#channel_list a[data-id="${channelId}"]`)
    const load_more = qSel("#load_more")
    const chatCnt = qSel("#backup_chat_content")
    const actualChatCnt = qSel("#actual_chat_content")

    if (
        selChannel == null || load_more == null || chatCnt == null ||
        actualChatCnt == null ||
        selChannel.getAttribute("data-notallowedtoview") == "true" ||
        selChannel.getAttribute("data-unsupported") == "true") return

    qSelAll(`div#channel_list a[data-id]`)
        ?.forEach(e => e.setAttribute("data-selected", "false"))

    selChannel.setAttribute("data-selected", "true")
    currentChannel = channelId
    clearChild(actualChatCnt)
    qSel<HTMLElement>("#load_more")?.setAttribute("data-show", "false")

    await displayMessage(guildId, channelId)
    chatCnt.scrollTo(0, chatCnt.scrollHeight)
    MessageObserver.observe(load_more)
}
window.switchChannel = switchChannel

// Handle the server selecting
async function selectServer(id: string) {
    await toggleDialog("loading_dialog")
    const selServer = qSel(`div#server_list a[data-id="${id}"]`),
        serverChannelList = qSel("div#channel_list"),
        actualChatCnt = qSel("div#actual_chat_content"),
        load_more = qSel("#load_more")

    // Template for displaying the channel so user can select a channel to view the chat
    const channel = ConstData.ChannelElementTemplate

    // Template for grouping the channels
    const category = ConstData.ChannelGroupElementTemplate

    if (
        selServer == null ||
        serverChannelList == null ||
        actualChatCnt == null ||
        load_more == null) return

    // Hide the load more element
    qSel<HTMLElement>("#load_more")?.setAttribute("data-show", "false")

    // Remove all channel element and chat element when a user change the selected server
    clearChild(serverChannelList, ["#show_hidden_channel"])
    clearChild(actualChatCnt)

    // Mark the channel element as selected
    qSelAll(`div#server_list a[data-id]`)
        ?.forEach(e => e.setAttribute("data-selected", "false"))
    selServer.setAttribute("data-selected", "true")

    // List of channel in the guild
    const channel_list: GuildChannel[] = await contactWithAPI(
        templateStr(
            DiscordAPILink.GUILD_CHANNEL_LIST,
            { guild_id: id }
        ), token)
    const my_info_in_guild: GuildMember = await contactWithAPI(
        templateStr(
            DiscordAPILink.GUILD_MY_INFO,
            { guild_id: id }
        ), token)
    const role_in_guilds: Role[] = await contactWithAPI(
        templateStr(
            DiscordAPILink.GUILD_ROLE,
            { guild_id: id }
        ), token)
    const guild_data: Guild = await contactWithAPI(
        templateStr(
            DiscordAPILink.GUILD_DATA,
            { guild_id: id }
        ), token)

    if (!channel_list || !my_info_in_guild || !role_in_guilds || !guild_data) return

    currentChannelList = channel_list
    currentServerData = guild_data
    const roles_list = my_info_in_guild.roles
    roles_list.push(role_in_guilds.find(v => v.name == "@everyone")?.id || "")

    // Group list sorted by the order
    const group_list = channel_list
        .filter(v => v.type == ConstData.ChannelType.GUILD_CATEGORY)
        .sort((a, b) => (a.position || 0) - (b.position || 0))

    //? Format: `id of group`: `array of channel in the group`
    let channel_data: { [key in string]: GuildChannel[] } = {}

    // Fill in data (if a channel doesn't belong in a group, it will be in the "notexist" group)
    channel_list.forEach(v => {
        var current = channel_data[v.parent_id || "notexist"]
        if (!current) current = []
        current.push(v)
        channel_data[v.parent_id || "notexist"] = current
    })

    // Checking if the current user have the permission to view the given channel
    const allowToView = (guild_data_to_check: GuildChannel) => {
        var perm: boolean[] = []
        for (let k of (guild_data_to_check.permission_overwrites || [])) {
            if (!(roles_list.includes(k.id))) continue
            //? This basically check if you have permission to view the channel
            //? const VIEW_CHANNEL = 1024
            //? https://discord.com/developers/docs/topics/permissions#permissions
            if ((Number(k.deny) & 1024) == 1024) {
                perm.push(false)
            } else if ((Number(k.allow) & 1024) == 1024) {
                perm.push(true)
            }
        }
        return (perm.length == 0) || any(...perm)
    }

    // Run through each group data
    for (let i of group_list) {
        if (i.id == "notexist" || !channel_data[i.id]) continue
        const cn = (channel_list.find(v => v.id == i.id)?.name || "")
            .toLocaleUpperCase()

        // Add the group (category) template to the server list
        serverChannelList?.insertAdjacentHTML('beforeend',
            templateStr(category, {
                category_id: i.id,
                category_name: cn,
                name: cn,
            }))

        // Add channel that is a child of the current selected group into the selected group template
        channel_data[i.id] = channel_data[i.id]
            .sort((a, b) => (a.position || 0) - (b.position || 0))
        for (let j of channel_data[i.id]) {
            qSel(`details[data-category-id="${i.id}"] div`)
                ?.insertAdjacentHTML('beforeend',
                    templateStr(channel, {
                        guild_id: id,
                        channel_id: j.id,
                        channel_id_0: j.id,
                        name: j.name || "",
                        channel_name: j.name || "",
                        no_viewing: allowToView(j) ? "false" : "true",
                        type_indicator: ConstData.IconBasedOnChannelType[String(j.type)],
                        unsupported: ConstData.UnsupportedChannelType
                            .find(v => v == j.type)
                                ? "true"
                                : "false"
                    })
                )
        }
    }

    await toggleDialog("loading_dialog", false)
}
window.selectServer = selectServer

function doShowMoreInfo(data: HTMLElement, show: boolean) {
    qSel(`div.multimedia_item[data-imageVideoId="${data.getAttribute("data-showId")}"]`)
        ?.setAttribute("data-simpleView", show ? "true" : "false")
}
window.showMoreInfo = function(data: HTMLElement) { doShowMoreInfo(data, false) }
window.showLessInfo = function(data: HTMLElement) { doShowMoreInfo(data, true) }

// Display error based on the given response of the API
async function showError(res: Response) {
    switch (res.status) {
        case 401:
            await toggleDialog("401_error_dialog")
            return 401
        case 429:
            qSel<HTMLElement>(".nice_dialog[data-dialog-id='429_error_dialog'] p.special")
                ?.replace({
                    time: String(Math.round((await res.json())["retry_after"] / 1000)) || ""
                })
            await toggleDialog("429_error_dialog")
            return 429
    }
    return 200
}

// Turn on/off dialog in the app given a certain dialog id
async function toggleDialog(id: string, show = true) {
    let dialog = qSel<HTMLElement>(`.nice_dialog[data-dialog-id='${id}']`)
    let content = dialog?.querySelector<HTMLElement>(`.content`)
    if (dialog == null || content == null) return

    if (show) {
        dialog.style.display = "flex"
        await wait(50)
    }

    content.style.transform = show ? "scale(1)" : "scale(0.75)"
    dialog.style.opacity = show ? "1" : "0"

    if (!show) {
        await wait(200)
        dialog.style.display = "none"
    }
}

// Show pages given a page ID
function showPage(id: string) {
    qSelAll(`.nice_dialog`)?.forEach(async v => {
        await toggleDialog(v.getAttribute("data-dialog-id") || "", false)
    })
    let sel = qSel(`.page[data-pageid='${id}']`)
    if (sel == null) return
    qSelAll(`.page`)?.forEach(e => e.setAttribute("data-show", "false"))
    sel.setAttribute("data-show", "true")
}

// Handle the showing of hidden channel
function changeChannelVisibility(show = false) {
    const serverChannelList = qSelAll(`div#channel_list a[data-id]`)
    if (serverChannelList == null) return
    serverChannelList.forEach(v => {
        if (v.getAttribute("data-notallowedtoview") == "false") return
        v.setAttribute("data-hiddenfromview", show ? "true" : "false")
    })
}

// Just like it said, contact the Discord API
async function contactWithAPI(api: DiscordAPILink | string, key: string) {
    await wait(250)
    const result = await fetch(api, {
        headers: API_HEADER(key)
    })
    await showError(result)
    if (result.status != 200) return false
    return await result.json()
}

async function displayMessage(guildId: string, channelId: string, beforeId: string = "-1") {
    if (beforeId == "-1") await toggleDialog("loading_dialog")
    const template = ConstData.ChatElementTemplate

    const result: Message[] = await contactWithAPI(
        templateStr(
            beforeId == "-1"
                ? DiscordAPILink.GUILD_GET_LAST_CHANNEL_MSG
                : DiscordAPILink.GUILD_GET_CHANNEL_MSG,
            {
                limit: "100",
                channel_id: channelId,
                last_msg_id: beforeId,
            }
        ), token)

    const resolveEscapeChar = () => {
        qSelAll("span.internal_data[data-charCode]")
            ?.forEach(v => {
                const char = String.fromCharCode(Number(v.getAttribute("data-charCode")))
                v.replaceWith(
                    templateStr(
                        ConstData.MessageFormatting.MARKDOWN_RESULT.ACTUAL_ESCAPE,
                        {
                            data: char
                        }
                    )
                )
            })
    }

    const resolveCodeBlock = () => {
        const codeBlock = qSelAll("span.internal_data[data-codeBlock]")
        if (codeBlock == null) return
        codeBlock.forEach(v => {
            const code = hex2String(v.getAttribute("data-codeBlock") || "")
            const language = v.getAttribute("data-language") || ""
            const element = new DOMParser().parseFromString(
                templateStr(
                    ConstData.MessageFormatting.MARKDOWN_RESULT.ACTUAL_FULL_CODE,
                    {
                        data: code,
                        language_highlight: language,
                    }
                ), "text/html"
            ).body.children[0] as HTMLElement
            if (element == null) return
            v.replaceWith(element)
            highlightjs.highlightElement(element)
        })
    }

    const resolveSmallCode = () => {
        qSelAll("span.internal_data[data-smallCode]")
            ?.forEach(v => {
                const code = hex2String(v.getAttribute("data-smallCode") || "")
                const element = new DOMParser().parseFromString(
                    templateStr(
                        ConstData.MessageFormatting.MARKDOWN_RESULT.ACTUAL_SMALL_CODE,
                        {
                            data: code
                        }
                    ), "text/html"
                ).body.children[0]
                if (element == null) return
                v.replaceWith(element)
            })
    }

    const resolveLookup = [
        resolveEscapeChar,
        resolveCodeBlock,
        resolveSmallCode
    ]

    var _buffer: string = ""

    for (const msg of result.reverse()) {
        let msg_content = msg.content
        let reply_msg_content = msg.referenced_message?.content || ""
        let reaction_content = ""
        let attachment_content = ""

        const reaction = msg.reactions
        const attachments = msg.attachments

        const user_mention = async (_: string, ...args: string[]) => {
            var userinfo: GuildMember = await contactWithAPI(
                templateStr(
                    DiscordAPILink.GUILD_USER_INFO,
                    {
                        guild_id: guildId,
                        user_id: args[0]
                    }
                ),
                token)

            return templateStr(
                ConstData.MessageFormatting.FORMAT_RESULT.USER_MENTION,
                {
                    user_mention: (userinfo.user?.username || "")
                })
        }

        const custom_emoji = (_: string, ...args: string[]) =>
            templateStr(
                ConstData.MessageFormatting.FORMAT_RESULT.CUSTOM_EMOJI,
                {
                    emoji_name: args[0],
                    emoji_url: templateStr(
                        DiscordAPILink.EMOJI,
                        {
                            emoji_id: args[1]
                        })
                })

        const animated_custom_emoji = (_: string, ...args: string[]) =>
            templateStr(
                ConstData.MessageFormatting.FORMAT_RESULT.ANIMATED_CUSTOM_EMOJI,
                {
                    emoji_name: args[0],
                    emoji_url: templateStr(
                        DiscordAPILink.ANIMATED_EMOJI,
                        {
                            emoji_id: args[1]
                        })
                })

        const channel_mention = (_: string, ...args: string[]) =>
            templateStr(
                ConstData.MessageFormatting.FORMAT_RESULT.CHANNEL_MENTION,
                {
                    channel_name: currentChannelList
                        ?.find(v => v.id == args[0])
                        ?.name || ""
                })

        const role_mention = (_: string, ...args: string[]) => {
            const roleData = currentServerData?.roles.find(v => v.id == args[0])
            const colorValue = roleData?.color.toString(16)
            return templateStr(
                ConstData.MessageFormatting.FORMAT_RESULT.ROLE_MENTION,
                {
                    style_data: colorValue !== "0"
                        ? `background-color: #${colorValue}1A; color: #${colorValue}`
                        : "",
                    role_name: roleData?.name || ""
                })
        }

        const escapeChar = (_: string, ...args: string[]) =>
            templateStr(
                ConstData.MessageFormatting.MARKDOWN_RESULT.ESCAPE,
                {
                    code: args[0].charCodeAt(0).toString()
                })

        const codeBlock = (_: string, ...args: string[]) =>
            templateStr(
                ConstData.MessageFormatting.MARKDOWN_RESULT.FULL_CODE,
                {
                    language: args[0] || "",
                    codeBlock: string2Hex(args[1])
                })

        const smallCodeText = (_: string, ...args: string[]) =>
            templateStr(
                ConstData.MessageFormatting.MARKDOWN_RESULT.SMALL_CODE,
                { small_code: string2Hex(args[0]) })

        const boldText = (_: string, ...args: string[]) =>
            templateStr(
                ConstData.MessageFormatting.MARKDOWN_RESULT.BOLD,
                { text: args[0] }, true, ["text"])

        const italicText = (_: string, ...args: string[]) =>
            templateStr(
                ConstData.MessageFormatting.MARKDOWN_RESULT.ITALIC,
                { text: args[0] }, true, ["text"])

        const underlineText = (_: string, ...args: string[]) =>
            templateStr(
                ConstData.MessageFormatting.MARKDOWN_RESULT.UNDERLINE,
                { text: args[0] }, true, ["text"])

        const strikeText = (_: string, ...args: string[]) =>
            templateStr(
                ConstData.MessageFormatting.MARKDOWN_RESULT.STRIKE,
                { text: args[0] }, true, ["text"])

        const quoteText = (_: string, ...args: string[]) =>
            templateStr(
                ConstData.MessageFormatting.MARKDOWN_RESULT.QUOTE,
                { text: args[0]} , true, ["text"])

        const urlText = (_: string, ...args: string[]) => {
            const _tmp = document.createElement("textarea")
            _tmp.innerHTML = args[0]
            console.log(_tmp.value)
            return templateStr(
                ConstData.MessageFormatting.MARKDOWN_RESULT.URL,
                {
                    url_0: _tmp.value,
                    url_1: _tmp.value
                }, true, ["url_0", "url_1"])
        }

        const lookup: [
            RegExp,
            (_: string, ...args: string[]) => (Promise<string> | string),
            boolean?][] = [
                //! The order in which they are searched and replaced is very important
                [ConstData.MessageFormatting.MARKDOWN.FULL_CODE, codeBlock],
                [ConstData.MessageFormatting.MARKDOWN.SMALL_CODE, smallCodeText],
                [ConstData.MessageFormatting.MARKDOWN.ESCAPE, escapeChar],
                [ConstData.MessageFormatting.MARKDOWN.BOLD, boldText],
                [ConstData.MessageFormatting.MARKDOWN.ITALIC, italicText],
                [ConstData.MessageFormatting.MARKDOWN.UNDERLINE, underlineText],
                [ConstData.MessageFormatting.MARKDOWN.STRIKE, strikeText],
                [ConstData.MessageFormatting.MARKDOWN.URL, urlText],
                [ConstData.MessageFormatting.MARKDOWN.QUOTE, quoteText],
                [ConstData.MessageFormatting.FORMAT.USER_MENTION, user_mention, true],
                [ConstData.MessageFormatting.FORMAT.ANOTHER_USER_MENTION, user_mention, true],
                [ConstData.MessageFormatting.FORMAT.CUSTOM_EMOJI, custom_emoji],
                [ConstData.MessageFormatting.FORMAT.ANIMATED_CUSTOM_EMOJI, animated_custom_emoji],
                [ConstData.MessageFormatting.FORMAT.ROLE_MENTION, role_mention],
                [ConstData.MessageFormatting.FORMAT.CHANNEL_MENTION, channel_mention],
            ]

        const process_msg = async (msg: string) => {
            for (const i of lookup) {
                if (!!i[2]) {
                    var b1 = i[1] as (_: string, ...args: string[]) => Promise<string>
                    msg = await msg.replaceAllAsync(i[0], b1)
                } else {
                    var b2 = i[1] as (_: string, ...args: string[]) => string
                    msg = msg.replaceAll(i[0], b2)
                }
            }
            console.log(msg)

            return msg
        }

        msg_content = await process_msg(escapeHTML(msg_content))
        reply_msg_content = await process_msg(escapeHTML(reply_msg_content))

        // Add reaction
        for (const r of (reaction || []).sort((a, b) => b.count - a.count)) {
            const emoji_id = r.emoji.id
            reaction_content += templateStr(
                ConstData.ReactionTemplate,
                {
                    icon: emoji_id === null
                        ? r.emoji.name
                        : `<img src="${
                            templateStr(
                                DiscordAPILink.EMOJI,
                                {
                                    emoji_id: emoji_id
                                })
                            }" alt="${r.emoji.name}">`,
                    count: r.count.toString(),
                    contain_me: r.me ? "true" : "false"
                }, true, ["icon"])
        }

        // Add attachments
        for (const a of attachments) {
            console.log(a)
            const type = a.content_type
            var content = "";
            if (type?.startsWith("image/")) {
                content = templateStr(
                    ConstData.ImageTemplate,
                    {
                        url: a.proxy_url,
                        alt: a.description || "",
                    }
                )
            }
            else if (type?.startsWith("video/")) {
                content = templateStr(
                    ConstData.VideoTemplate,
                    {
                        url: a.proxy_url,
                        type: a.content_type || ""
                    }
                )
            }
            else if (type?.startsWith("audio/")) {
                content = templateStr(
                    ConstData.AudioTemplate,
                    {
                        url: a.proxy_url,
                        type: a.content_type || ""
                    }
                )
            }
            attachment_content += templateStr(
                ConstData.MediaFileTemplate,
                {
                    id: a.id,
                    show_id: a.id,
                    hide_id: a.id,
                    name: a.filename,
                    size: a.size.toString(),
                    download_link: a.url,
                    content: content
                }, true, ["content"])

            if (content != "") continue
            attachment_content += templateStr(
                ConstData.FileUploadTemplate,
                {
                    icon: "",
                    name: a.filename,
                    size: a.size.toString(),
                    download_link: a.url,
                })
        }

        _buffer += templateStr(template, {
            chat_id: msg.id,
            has_reply: "referenced_message" in msg ? "true" : "false",
            url_reply_usericon: templateStr(
                DiscordAPILink.ACCOUNT_AVATAR,
                {
                    user_id: msg.referenced_message?.author.id || "",
                    image_hash: msg.referenced_message?.author.avatar || "about:blank",
                    size: "64"
                }),
            reply_username: msg.referenced_message?.author.username || "",
            reply_content: reply_msg_content,
            url_usericon: templateStr(
                DiscordAPILink.ACCOUNT_AVATAR,
                {
                    user_id: msg.author.id,
                    image_hash: msg.author.avatar || "about:blank",
                    size: "64"
                }),
            username: msg.author.username,
            timestamp: msg.timestamp,
            content: msg_content,
            reaction: reaction_content,
            attachment: attachment_content,
        }, true, ["content", "reply_content", "reaction", "attachment"])
    }

    const chat_content_element =
        qSel(`div#backup_chat_content.chat_display #actual_chat_content`)
    if (chat_content_element == null) return
    chat_content_element.insertAdjacentHTML('afterbegin', _buffer)

    for (const i of resolveLookup) i()

    await wait(100)
    if (beforeId == "-1") await toggleDialog("loading_dialog", false)
    if (result.length >= 100) {
        qSel<HTMLElement>("#load_more")?.setAttribute("data-show", "true")
    }

}

async function checkValidToken() {
    let tokenInput = qSel<HTMLInputElement>("#discord_token")
    const result = await fetch(DiscordAPILink.ACCOUNT_INFO, {
        headers: API_HEADER(tokenInput?.value || "")
    })

    if (tokenInput != null) {
        token = tokenInput.value || ""
        tokenInput.value = ""
    }

    return result
}

async function logout() {
    await toggleDialog("login_out_dialog")
    await wait(500)
    token = ""
    showPage("login_page")
    await toggleDialog("login_out_dialog", false)
}
window.logout = logout

// When a tab changes, init the tab with required data while also cleaning up old data
async function init(tabId: string) {
    switch (tabId) {
        case "backup":
            await toggleDialog("init_backup_dialog")
            const serverChannelList = qSel(`div#channel_list`)
            const list = qSel(`div#server_list`)
            const actualChatCnt = qSel("div#actual_chat_content")
            const template = ConstData.ServerElementTemplate

            if (list == null || serverChannelList == null || actualChatCnt == null) return

            clearChild(list)
            clearChild(serverChannelList, ["#show_hidden_channel"])
            clearChild(actualChatCnt)

            const data = await fetch(
                DiscordAPILink.GUILD_LIST,
                { headers: API_HEADER(token) })
            await showError(data)

            const serverList: GuildList = await data.json()
            for (let i of serverList) {
                list.insertAdjacentHTML('beforeend',
                    templateStr(template, {
                        id_0: i.id,
                        id_1: i.id,
                        name: i.name,
                        url: i.icon != null
                            ? templateStr(
                                DiscordAPILink.GUILD_AVATAR, {
                                    server_id: i.id,
                                    image_hash: i.icon,
                                    size: "80"
                                })
                            : "./src/assets/server.svg",
                        alt: i.name
                    }))
            }

            await toggleDialog("init_backup_dialog", false)
    }
}

LOGIN_BUTTON?.addEventListener("click", async () => {
    await toggleDialog("waiting_authorize_dialog")
    const data = await checkValidToken(),
        avatar = qSel<HTMLImageElement>(`img#discord_avatar`),
        username = qSel<HTMLImageElement>(`p#lam_username`)

    if (data.status != 200) {
        await toggleDialog("waiting_authorize_dialog", false)
        await showError(data)
        return
    }

    showPage("main")
    await toggleDialog("waiting_authorize_dialog", false)

    await toggleDialog("loading_dialog")
    await wait(200)
    const user_data: User = await data.json()
    if (avatar == null || username == null) return

    avatar.src = templateStr(DiscordAPILink.ACCOUNT_AVATAR, {
        user_id: user_data.id,
        image_hash: user_data.avatar || "",
        size: "40"
    })
    username.innerText = user_data.username

    await toggleDialog("loading_dialog", false)
    await init("backup")
})

qSel<HTMLButtonElement>(".nice_dialog button[data-dialog-button-id='error_401_ok']")
    ?.addEventListener("click", async () => {
        await toggleDialog("401_error_dialog", false)
        showPage("login_page")
    })

qSel<HTMLButtonElement>(".nice_dialog button[data-dialog-button-id='error_429_ok']")
    ?.addEventListener("click", async () => {
        await toggleDialog("429_error_dialog", false)
        showPage("login_page")
    })

qSel<HTMLLabelElement>("label#nice_checkbox_show_hidden_channel_checkbox")
    ?.addEventListener("click", (ev) => {
        const checkbox = ev.target
        if (checkbox == null || !("checked" in checkbox)) return
        changeChannelVisibility(!(checkbox as HTMLInputElement).checked)
    })

const ERROR_UNKNOW_OK
    = qSel<HTMLButtonElement>(".nice_dialog button[data-dialog-button-id='error_shgw_ok']")
ERROR_UNKNOW_OK?.addEventListener("click", async() => {
    await toggleDialog("something_has_gone_wrong_dialog", false)
    showPage("login_page")
})

qSel<HTMLButtonElement>("#channel_list button#color_highlight_meaning")
    ?.addEventListener("click", async () => {
        await toggleDialog("color_highlight_meaning_dialog")
    })

qSel<HTMLButtonElement>(".nice_dialog button[data-dialog-button-id='info_moch_ok']")
    ?.addEventListener("click", async() => {
        await toggleDialog("color_highlight_meaning_dialog", false)
    })

// let greetInputEl: HTMLInputElement | null;
// let greetMsgEl: HTMLElement | null;

// window.addEventListener("DOMContentLoaded", () => {
//   greetInputEl = document.querySelector("#greet-input");
//   greetMsgEl = document.querySelector("#greet-msg");
// });

// async function greet() {
//   if (greetMsgEl && greetInputEl) {
//     // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
//     greetMsgEl.textContent = await invoke("greet", {
//       name: greetInputEl.value,
//     });
//   }
// }

// window.greet = greet;
