//import { invoke } from "@tauri-apps/api/tauri";
import { DiscordAPILink } from "./url"

enum ChannelType {
    GUILD_TEXT = 0,
    DM = 1,
    GUILD_VOICE = 2,
    GROUP_DM = 3,
    GUILD_CATEGORY = 4,
    GUILD_ANNOUNCEMENT = 5,
    ANNOUNCEMENT_THREAD = 10,
    PUBLIC_THREAD = 11,
    PRIVATE_THREAD = 12,
    GUILD_STAGE_VOICE = 13,
    GUILD_DIRECTORY = 14,
    GUILD_FORUM = 15,
}

const IconBasedOnChannelType: { [key in string]: string } = {
    "0": "./src/assets/chat.svg",
    "2": "./src/assets/volume.svg",
    "5": "./src/assets/announcement.svg",
    "13": "./src/assets/broadcast.svg",
    "15": "./src/assets/forum.svg"
}

const UnsupportedChannelType = [
    ChannelType.DM,
    ChannelType.GUILD_VOICE,
    ChannelType.GROUP_DM,
    ChannelType.ANNOUNCEMENT_THREAD,
    ChannelType.PUBLIC_THREAD,
    ChannelType.PRIVATE_THREAD,
    ChannelType.GUILD_DIRECTORY,
    ChannelType.GUILD_STAGE_VOICE,
    ChannelType.GUILD_FORUM
]

const MessageFormatting = {
    USER_MENTION: /<@(\d+)>/g,
    ANOTHER_USER_MENTION: /<@!(\d+)>/g,
    CHANNEL_MENTION: /<#(\d+)>/g,
    ROLE_MENTION: /<@&(\d+)>/g,
    CUSTOM_EMOJI: /<:(.+):(\d+)>/g,
    ANIMATED_CUSTOM_EMOJI: /<a:(.+):(\d+)>/g,
    TIMESTAMP: /<t:(\d+)>/g,
    STYLED_TIMESTAMP: /<t:(\d+)>:(t|T|d|D|f|F|R)/g
}

let token = ""
const qSel = <T extends Element>(selector: string): T | null =>
    document.querySelector(selector)
const qSelAll = <T extends Element>(selector: string): NodeListOf<T> | null =>
    document.querySelectorAll(selector)
const wait = (ms: number) =>
    new Promise<void>((res, _1) => { setInterval(res, ms) })

HTMLElement.prototype.replace = function (data: Template, prefix: string = "$_") {
    const alternate_prefix = "id_dlr_";
    const _this: () => HTMLElement = () => this;
    for (const i in data) {
        const old = _this().innerHTML;
        const span: () => HTMLElement | null = () => _this().querySelector(`span.reactive#${alternate_prefix}${i}`)
        if (span() == null) _this().innerHTML = old.replace(`${prefix}${i}`, `<span class="reactive" id="${alternate_prefix}${i}"></span>`)
        span()!!.innerText = data[i]
    }
}

const LOGIN_BUTTON = qSel<HTMLButtonElement>("#login")
const API_HEADER = (token: string) => new Headers({
    'Accept': 'application/json',
    'Authorization': token
})

//? test$<alphabet> (data: {alphabet: "abc"}) -> testabc
function templateStr(base: string, data: { [x in string]: string }) {
    var result = base
    for (let i in data) result = result.replace(`$<${i}>`, data[i])
    return result
}

// Display error based on the given response of the API
async function showError(res: Response) {
    console.log(res.headers)
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

// Delete all child of a node
function clearChild(parent: Node, excludedNode: (Node | string)[] = []) {
    while (parent.childNodes.length > 0 + excludedNode.length) {
        var eN: Node[] = []
        if (typeof excludedNode[0] == "string") {
            for (let i of excludedNode) {
                const elm = qSel(i.toString())
                if (elm == null) continue
                eN.push(elm)
            }
        } else {
            eN = excludedNode as Node[]
        }
        if (parent.lastChild == null || eN.includes(parent.lastChild)) continue
        parent.removeChild(parent.lastChild)
    }
}

// Show pages given a page ID
function showPage(id: string) {
    console.log("closed")
    qSelAll(`.nice_dialog`)?.forEach(async v => {
        await toggleDialog(v.getAttribute("data-dialog-id") || "", false)
    })
    let sel = qSel(`.page[data-pageid='${id}']`)
    if (sel == null) return
    qSelAll(`.page`)?.forEach(e => e.setAttribute("data-show", "false"))
    sel.setAttribute("data-show", "true")
}

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
function switchChannel(channelId: string) {
    let selChannel = qSel(`div#channel_list a[data-id="${channelId}"]`)
    if (
        selChannel == null ||
        selChannel.getAttribute("data-notallowedtoview") == "true" ||
        selChannel.getAttribute("data-unsupported") == "true") return

    qSelAll(`div#channel_list a[data-id]`)
        ?.forEach(e => e.setAttribute("data-selected", "false"))

    selChannel.setAttribute("data-selected", "true")
    displayMessage(channelId)
}
window.switchChannel = switchChannel

// Handle the showing of hidden channel
function changeChannelVisibility(show = false) {
    console.log("called")
    const serverChannelList = qSelAll(`div#channel_list a[data-id]`)
    if (serverChannelList == null) return
    serverChannelList.forEach(v => {
        if (v.getAttribute("data-notallowedtoview") == "false") return
        v.setAttribute("data-hiddenfromview", show ? "true" : "false")
    })
}

// Just like it said, contact the Discord API
async function contactWithAPI(api: DiscordAPILink | string, key: string) {
    const result = await fetch(api, {
        headers: API_HEADER(key)
    });
    await showError(result)
    if (result.status != 200) return false
    return await result.json()
}

async function displayMessage(channelId: string, beforeId: string = "-1") {
    const template = `
        <div class="chat_msg">
            <div class="chat_replyto" data-hasReply="$<has_reply>">
                <div class="display"></div>
                <div class="smol_chat_usericon">
                    <img src="$<url_reply_usericon>" alt="">
                </div>
                <div class="smol_chat_username">
                    <p>$<reply_username></p>
                </div>
                <div class="smol_chat_content">
                    <p>$<reply_content></p>
                </div>
            </div>
            <div class="chat_normal">
                <div class="chat_usericon">
                    <img src="$<url_usericon>" alt="">
                </div>
                <div class="chat_username">
                    <p>$<username></p>
                    <p class="chat_timestamp">$<timestamp></p>
                </div>
                <div class="chat_content">
                    <p>$<content></p>
                </div>
            </div>
        </div>
    `

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

    for (const msg of result) {
        var msg_content = msg.content;

        qSel(`div#backup_chat_content.chat_display`)
            ?.insertAdjacentHTML('beforeend',
                templateStr(template, {
                    has_reply: "referenced_message" in msg ? "true" : "false",
                    url_reply_usericon: templateStr(
                        DiscordAPILink.ACCOUNT_AVATAR,
                        {
                            user_id: msg.referenced_message?.author.id || "",
                            image_hash: msg.referenced_message?.author.avatar || "about:blank",
                            size: "64"
                        }),
                    reply_username: msg.referenced_message?.author.username || "",
                    reply_content: msg.referenced_message?.content || "",
                    url_usericon: templateStr(
                        DiscordAPILink.ACCOUNT_AVATAR,
                        {
                            user_id: msg.author.id,
                            image_hash: msg.author.avatar || "about:blank",
                            size: "64"
                        }),
                    username: msg.author.username,
                    timestamp: msg.timestamp,
                    content: msg.content,
                }))
    }
    console.log(result)
}

// Handle the server selecting
async function selectServer(id: string) {
    await toggleDialog("loading_dialog")
    let selServer = qSel(`div#server_list a[data-id="${id}"]`),
        serverChannelList = qSel(`div#channel_list`)

    // Template for displaying the channel so user can select a channel to view the chat
    const channel = `
        <a
            href="#"
            data-selected="false"
            data-id="$<channel_id>"
            data-notallowedtoview="$<no_viewing>"
            data-hiddenfromview="false"
            data-unsupported="$<unsupported>"
            title="$<name>"
            onclick="switchChannel('$<channel_id_0>')"
            class="noselect"
        >
            <img src="$<type_indicator>" alt="$<channel_type_indicator>">
            <span>$<channel_name></span>
        </a>
    `

    // Template for grouping the channels
    const category = `
        <details class="channel_details noselect" data-category-id="$<category_id>" open>
            <summary title="$<name>">$<category_name></summary>
            <div>
            </div>
        </details>
    `

    if (selServer == null || serverChannelList == null) return

    // Remove all channel element when a user change the selected server
    clearChild(serverChannelList, ["#show_hidden_channel"])

    // Mark the channel element as selected
    qSelAll(`div#server_list a[data-id]`)?.forEach(e => e.setAttribute("data-selected", "false"))
    selServer.setAttribute("data-selected", "true")

    // List of channel in the guild
    const channel_list: GuildChannel[] = await contactWithAPI(
        templateStr(
            DiscordAPILink.GUILD_CHANNEL_LIST,
            { guild_id: id }
        ), token
    )
    const my_info_in_guild: GuildMember = await contactWithAPI(
        templateStr(
            DiscordAPILink.GUILD_MY_INFO,
            { guild_id: id }
        ), token
    )
    const role_in_guilds: Role[] = await contactWithAPI(
        templateStr(
            DiscordAPILink.GUILD_ROLE,
            { guild_id: id }
        ), token
    )

    if (!channel_list || !my_info_in_guild || !role_in_guilds) return

    const roles_list = my_info_in_guild.roles
    roles_list.push(role_in_guilds.find(v => v.name == "@everyone")?.id || "")

    // Group list sorted by the order
    const group_list = channel_list
        .filter(v => v.type == ChannelType.GUILD_CATEGORY)
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
        return (perm.length == 0) || perm.reduce((a, b) => a || b)
    }

    // Run through each group data
    for (let i of group_list) {
        if (i.id == "notexist" || !channel_data[i.id]) continue
        const cn = (channel_list.find(v => v.id == i.id)?.name || "").toLocaleUpperCase()

        // Add the group (category) template to the server list
        serverChannelList?.insertAdjacentHTML('beforeend', templateStr(category, {
            category_id: i.id,
            category_name: cn,
            name: cn,
        }))

        // Add channel that is a child of the current selected group into the selected group template
        channel_data[i.id] = channel_data[i.id].sort((a, b) => (a.position || 0) - (b.position || 0))
        console.log(roles_list)
        for (let j of channel_data[i.id]) {
            console.log(j)
            qSel(`details[data-category-id="${i.id}"] div`)
                ?.insertAdjacentHTML('beforeend',
                    templateStr(channel, {
                        channel_id: j.id,
                        channel_id_0: j.id,
                        name: j.name || "",
                        channel_name: j.name || "",
                        no_viewing: allowToView(j) ? "false" : "true",
                        type_indicator: IconBasedOnChannelType[String(j.type)],
                        unsupported: UnsupportedChannelType.find(v => v == j.type) ? "true" : "false"
                    })
                )
        }
    }

    await toggleDialog("loading_dialog", false)
}
window.selectServer = selectServer

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
            const template = `
                <a
                    href="#"
                    data-selected="false"
                    data-id="$<id_0>"
                    onclick="selectServer('$<id_1>')"
                    title="$<name>"
                >
                    <img src="$<url>" alt="$<alt>">
                </name>
            `

            if (list == null || serverChannelList == null) return

            clearChild(list)
            clearChild(serverChannelList, ["#show_hidden_channel"])

            const data = await fetch(DiscordAPILink.GUILD_LIST, { headers: API_HEADER(token) })
            await showError(data)

            const serverList: GuildList = await data.json()
            console.log(serverList)
            for (let i of serverList) {
                list.insertAdjacentHTML('beforeend', templateStr(template, {
                    id_0: i.id,
                    id_1: i.id,
                    name: i.name,
                    url: i.icon != null ? templateStr(DiscordAPILink.GUILD_AVATAR, {
                        server_id: i.id,
                        image_hash: i.icon,
                        size: "80"
                    }) : "./src/assets/server.svg",
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
