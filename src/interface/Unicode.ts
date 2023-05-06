interface Unicode {
    type: string,
    name: string,
    unicode?: string,
    original?: string
}

interface UnicodeEmojiData {
    [unicode: string]: UnicodeEmoji
}

interface UnicodeEmoji {
    name: string,
    group: string,
    subgroup: string,
    order: number,
    origUnicode?: string
}
