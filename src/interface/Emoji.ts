interface Emoji {
    unicode: string,
    shortcode: string,
    name: string,
    order?: number,
    emoji?: string,
    origUnicode?: string
}

interface EmojiGroup {
    [groupname: string]: EmojiSubgroup
}

interface EmojiSubgroup {
    [subgroupname: string]: Emoji[]
}

interface CustomEmoji {
    unicode: string,
    shortcode: string
}

type EmojiSubgroupData = [suborder: number, subgroup: string, emoji: Emoji[]];

type EmojiGroupData = [order: number, group: string, subgroups: EmojiSubgroupData[]];
