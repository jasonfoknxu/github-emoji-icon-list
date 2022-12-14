interface IUnicode {
    type: string,
    name: string,
    unicode?: string,
    original?: string
}

interface IUnicodeEmojiData {
    [unicode: string]: IUnicodeEmoji
}

interface IUnicodeEmoji {
    name: string,
    group: string,
    subgroup: string,
    order: number,
    origUnicode?: string
}
