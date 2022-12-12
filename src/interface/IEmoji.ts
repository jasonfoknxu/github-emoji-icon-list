interface IEmoji {
    unicode: string,
    shortcode?: string,
    name: string,
    order: number
}

interface IEmojiGroup {
    [groupname: string]: IEmojiSubgroup
}

interface IEmojiSubgroup {
    [subgroupname: string]: IEmoji[]
}

interface ICustomEmoji {
    unicode: string,
    shortcode: string
}

type EmojiSubgroup = [suborder: number, subgroup: string, emoji: IEmoji[]];

type EmojiGroup = [order: number, group: string, subgroups: EmojiSubgroup[]];
