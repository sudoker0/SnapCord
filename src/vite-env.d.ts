interface Window {
  greet: () => Promise<void>;
  switchTab: (tabid: string) => Promise<void>;
  logout: () => Promise<void>;
  selectServer: (id: string) => Promise<void>;
  switchChannel: (channelId: string) => void;
}

interface Template {
  [key: string]: string
}
interface HTMLElement {
  replace(data: Template, prefix?: string): void
}

declare enum GuildFeatures {
  ANIMATED_BANNER = "ANIMATED_BANNER",
  ANIMATED_ICON = "ANIMATED_ICON",
  AUTO_MODERATION = "AUTO_MODERATION",
  BANNER = "BANNER",
  COMMUNITY = "COMMUNITY",
  DISCOVERABLE = "DISCOVERABLE",
  FEATURABLE = "FEATURABLE",
  INVITES_DISABLED = "INVITES_DISABLED",
  INVITE_SPLASH = "INVITE_SPLASH",
  MEMBER_VERIFICATION_GATE_ENABLED = "MEMBER_VERIFICATION_GATE_ENABLED",
  MONETIZATION_ENABLED = "MONETIZATION_ENABLED",
  MORE_STICKERS = "MORE_STICKERS",
  NEWS = "NEWS",
  PARTNERED = "PARTNERED",
  PREVIEW_ENABLED = "PREVIEW_ENABLED",
  PRIVATE_THREADS = "PRIVATE_THREADS",
  ROLE_ICONS = "ROLE_ICONS",
  TICKETED_EVENTS_ENABLED = "TICKETED_EVENTS_ENABLED",
  VANITY_URL = "VANITY_URL",
  VERIFIED = "VERIFIED",
  VIP_REGIONS = "VIP_REGIONS",
  WELCOME_SCREEN_ENABLED = "WELCOME_SCREEN_ENABLED",
}

declare enum ChannelType {
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

declare type User = {
  id: string,
  username: string,
  discriminator: number,
  avatar?: string,
  bot?: boolean,
  system?: boolean,
  mfa_enabled?: boolean,
  banner?: string,
  accent_color?: number,
  locale?: string,
  verified?: boolean,
  email?: string,
  flags?: number,
  premium_type?: number,
  public_flags?: number,
}

declare type RoleTag = {
  bot_id?: string,
  integration_id?: string
  premium_subscriber?: null
}

declare type Role = {
  id: string,
  name: string,
  color: number,
  hoist: boolean,
  icon?: string,
  unicode_emoji?: string,
  position: number,
  permissions: string,
  managed: boolean,
  mentionable: boolean,
  tags?: RoleTag,
}

declare type Emoji = {
  id?: string,
  name?: string,
  roles?: string[],
  user?: User,
  require_colons?: boolean,
  managed?: boolean,
  animated?: boolean,
  available?: boolean,
}

declare type WelcomeScreenChannel = {
  channel_id: string,
  description: string,
  emoji_id?: string,
  emoji_name?: string,
}

declare type WelcomeScreen = {
  description?: string,
  welcome_channels: WelcomeScreenChannel[],
}

declare type Sticker = {
  id: string,
  pack_id?: string,
  name: string,
  description?: string,
  tags: string,
  asset?: string,
  type: number,
  format_type: number,
  available?: boolean,
  guild_id?: string,
  user: User,
  sort_value?: number,
}

declare type GuildList = {
  id: string,
  name: string,
  icon: string,
  owner: boolean,
  permissions: number,
  features: GuildFeatures[],
  permissions_new: string
}[]

declare type Guild = {
  id: string,
  name: string,
  icon?: string,
  icon_hash?: string,
  splash?: string,
  discovery_splash?: string,
  owner?: boolean,
  owner_id: string,
  permissions?: string,
  region?: string,
  afk_channel_id?: string,
  afk_timeout: number,
  widget_enabled?: boolean,
  widget_channel_id?: string,
  verification_level: number,
  default_message_notifications: number,
  explicit_content_filter: number,
  roles: Role[],
  emojis: Emoji[],
  features: GuildFeatures[],
  mfa_level: number,
  application_id?: string,
  system_channel_id?: string,
  system_channel_flags: number,
  rules_channel_id?: string,
  max_presences?: number,
  max_numbers?: number,
  vanity_url_code?: string,
  description?: string,
  banner?: string,
  premium_tier: number,
  premium_subscription_count?: number,
  preferred_locale: string,
  public_updates_channel_id?: string,
  max_video_channel_users?: number,
  approximate_member_count?: number,
  approximate_presence_count?: number,
  welcome_screen: WelcomeScreen,
  nsfw_level: number,
  stickers?: Sticker[],
  premium_progress_bar_enabled: boolean
}

declare type Reaction = {
  emoji: {
      id: string | null,
      name: string,
  },
  count: number,
  me: boolean,
}

declare type Attachment = {
  id: string,
  filename: string,
  description?: string,
  content_type?: string,
  size: number,
  url: string,
  proxy_url: string,
  height?: number,
  width?: number,
  ephemeral?: boolean,
}

declare type ChannelMention = {
  id: string,
  guild_id: string,
  type: number,
  name: string
}

declare type MessageReference = {
  message_id?: number,
  channel_id?: number,
  guild_id?: number,
  fail_if_not_exists?: boolean
}

declare type MessageStickerItem = {
  id: string,
  name: string,
  format_type: number,
}

declare type Message = {
  id: string,
  channel_id: string,
  author: User,
  content: string,
  timestamp: string,
  edited_timestamp?: string,
  tts: boolean,
  mention_everyone: boolean,
  mentions: User[],
  mention_roles: Role[],
  mention_channels?: ChannelMention[],
  attachments: Attachment[],
  embeds: Uint16Array[],
  reactions: Reaction[],
  nonce?: number | string,
  pinned: boolean,
  webhook_id?: string,
  type: number,
  activity?: any,
  application?: any,
  application_id?: string,
  message_reference?: MessageReference,
  flags?: number,
  referenced_message?: Message,
  interaction?: any,
  thread?: MessageChannel,
  components?: number[],
  sticker_items?: MessageStickerItem[],
  stickers?: Sticker[],
  position?: number,
}

declare type Chat = {
  [key in string]: Message[]
}

declare type Override = {
  id: string,
  type: number,
  allow: string,
  deny: string,
}

declare type GuildMember = {
  user?: User,
  nick?: string,
  avatar?: string,
  roles: string[],
  joined_at: string,
  premium_since?: string,
  deaf: boolean,
  mute: boolean,
  pending?: boolean,
  permissions?: string,
  communication_disabled_until?: string,
}

declare type ThreadMetadata = {
  archived: boolean,
  auto_archive_duration: number,
  archive_timestamp: string,
  locked: boolean,
  invitable?: boolean,
  create_timestamp?: string
}

declare type ThreadMember = {
  id?: string,
  user_id?: string,
  join_timestamp: string,
  flags: number,
}

declare type DefaultReaction = {
  emoji_id: string,
  emoji_name: string
}

declare type GuildChannel = {
  id: string,
  type: ChannelType,
  guild_id?: string,
  position?: number
  permission_overwrites?: Override[],
  name?: string,
  topic?: string,
  nsfw?: boolean,
  last_message_id?: string,
  bitrate?: number,
  user_limit?: number,
  rate_limit_per_user?: number,
  recipients?: User[],
  icon?: string,
  owner_id?: string,
  application_id?: string,
  parent_id?: string,
  last_pin_timestamp: string,
  rtc_region?: string,
  video_quality_mode?: number,
  message_count?: number,
  member_count?: number,
  thread_metadata?: ThreadMetadata,
  member?: ThreadMember,
  default_auto_archive_duration?: number,
  permissions?: string,
  flags?: number,
  total_message_sent?: number,
  available_tags?: number,
  applied_tags?: string[],
  default_reaction_emoji?: ThreadMember,
  default_thread_rate_limit_per_user?: number,
  default_sort_order?: number
}