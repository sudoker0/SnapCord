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
    FORMAT: {
        USER_MENTION: /&lt;@(\d+?)&gt;/g,
        ANOTHER_USER_MENTION: /&lt;@!(\d+?)&gt;/g,
        CHANNEL_MENTION: /&lt;#(\d+?)&gt;/g,
        ROLE_MENTION: /&lt;@&amp;(\d+?)&gt;/g,
        CUSTOM_EMOJI: /&lt;:(.+?):(\d+?)&gt;/g,
        ANIMATED_CUSTOM_EMOJI: /&lt;a:(.+?):(\d+?)&gt;/g,
        TIMESTAMP: /&lt;t:(\d+?)&gt;/g,
        STYLED_TIMESTAMP: /&lt;t:(\d+?):(t|T|d|D|f|F|R)&gt;/g,
    },
    FORMAT_RESULT: {
        USER_MENTION: `<span
            class='user_mention mention'>$<user_mention></span>`,
        CUSTOM_EMOJI: `<img
            class="emoji"
            alt="Emoji: $<emoji_name>"
            src="$<emoji_url>" />`,
        ANIMATED_CUSTOM_EMOJI: `<img
            class="emoji"
            alt="Animated Emoji: $<emoji_name>"
            src="$<emoji_url>" />`,
        CHANNEL_MENTION: `<span
            class="channel_mention mention">$<channel_name></span>`,
        ROLE_MENTION: `<span
            class="role_mention mention"
            style="$<style_data>">$<role_name></span>`
    },
    MARKDOWN: {
        ITALIC: /\*([^\*]+?)\*/g,
        BOLD: /\*\*([^\*]+?)\*\*/g,
        UNDERLINE: /__([^\_]+?)__/g,
        STRIKE: /~~([^\~]+?)~~/g,
        QUOTE: /^&gt; (.+)/gm,
        HIDDEN: /\|\|([^\|]+?)\|\|/g,
        SMALL_CODE: /`([^\`]+?)`/g,
        FULL_CODE: /```(?:([^\`\n]*)(?=\n)\n)?(.+?)```\n?/gs,
        ESCAPE: /\\(\W)/g,
        URL: /(((http|https):\/\/)(www.)?[a-zA-Z0-9@:;%._\\+~#?&//=]+\.[a-z]+\b([-a-zA-Z0-9@:;%._\\+~#?&//=]*))/g,
    },
    MARKDOWN_RESULT: {
        FULL_CODE: `<span
            class='internal_data'
            data-language='$<language>'
            data-codeBlock='$<codeBlock>'></span>`,
        ESCAPE: `<span
            class='internal_data'
            data-charCode='$<code>'></span>`,
        SMALL_CODE: `<span
            class='internal_data'
            data-smallCode="$<small_code>"></span>`,
        ACTUAL_FULL_CODE: `<code
            class='display_code_text language-$<language_highlight>'>$<data></code>`,
        ACTUAL_ESCAPE: `$<data>`,
        ACTUAL_SMALL_CODE: `<span class='display_small_code'>$<data></span>`,
        BOLD: `<b>$<text></b>`,
        ITALIC: `<i>$<text></i>`,
        UNDERLINE: `<u>$<text></u>`,
        STRIKE: `<strike>$<text></strike>`,
        QUOTE: `<div class='chat_quote'>$<text></div>`,
        URL: `<a href="$<url_0>" target="_blank">$<url_1></a>`
    }
}

const ChatElementTemplate = `
    <div class="chat_msg" data-chatid="$<chat_id>">
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
            <div class="chat_attachment">$<attachment></div>
            <div class="chat_reaction">$<reaction></div>
        </div>
    </div>
`

const ChannelElementTemplate = `
    <a
        href="#"
        data-selected="false"
        data-id="$<channel_id>"
        data-notallowedtoview="$<no_viewing>"
        data-hiddenfromview="false"
        data-unsupported="$<unsupported>"
        title="$<name>"
        onclick="switchChannel('$<guild_id>', '$<channel_id_0>')"
        class="noselect"
    >
        <img src="$<type_indicator>" alt="$<channel_type_indicator>">
        <span>$<channel_name></span>
    </a>
`

const ServerElementTemplate = `
    <a
        href="#"
        data-selected="false"
        data-id="$<id_0>"
        onclick="selectServer('$<id_1>')"
        title="$<name>"
    >
        <img src="$<url>" alt="$<alt>">
    </a>
`

const ChannelGroupElementTemplate = `
    <details class="channel_details noselect" data-category-id="$<category_id>" open>
        <summary title="$<name>">$<category_name></summary>
        <div>
        </div>
    </details>
`

const ReactionTemplate = `
    <div class="reaction_item" data-containMe="$<contain_me>">
        <div class="reaction_icon">$<icon></div>
        <div class="reaction_count">$<count></div>
    </div>
`

const FileUploadTemplate = `
    <div class="file_upload_item">
        <div class="file_upload_icon">
            <img src="./src/assets/file.svg" alt="File">
        </div>
        <div class="file_upload_name">$<name></div>
        <div class="file_upload_size">$<size> bytes</div>
        <div class="file_upload_download">
            <a href="$<download_link>" target="_blank">
                <img src="./src/assets/file_download.svg" alt="File Download">
            </a>
        </div>
    </div>
`

const MediaFileTemplate = `
    <div class="multimedia_item" data-imageVideoId="$<id>" data-simpleView="true">
        <div class="multimedia_container">$<content></div>
        <div class="multimedia_more_info">
            <button onclick="showMoreInfo(this)" data-showId="$<show_id>">more info</button>
        </div>
        <div class="multimedia_less_info">
            <button onclick="showLessInfo(this)" data-showId="$<hide_id>">less info</button>
        </div>
        <div class="multimedia_detail">
            <div class="multimedia_name">$<name></div>
            <div class="multimedia_size">$<size> bytes</div>
            <div class="multimedia_download">
                <a href="$<download_link>" target="_blank">
                    <img src="./src/assets/file_download.svg" alt="File Download">
                </a>
            </div>
        </div>
    </div>
`

const ImageTemplate = `<img src="$<url>" alt="$<alt>">`
const VideoTemplate = `<video controls><source src="$<url>" type="$<type>"></video>`
const AudioTemplate = `<audio controls><source src="$<url>" type="$<type>"></audio>`

export {
    ChannelType,
    IconBasedOnChannelType,
    UnsupportedChannelType,
    MessageFormatting,
    ChatElementTemplate,
    ChannelElementTemplate,
    ChannelGroupElementTemplate,
    ServerElementTemplate,
    ReactionTemplate,
    FileUploadTemplate,
    MediaFileTemplate,
    ImageTemplate,
    VideoTemplate,
    AudioTemplate
}