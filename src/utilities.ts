/**
 * Utilities of GitHub Emoji Icon List Markdown Generator
 */

import {promises as fs} from 'fs';
import axios from 'axios';
import path from 'path';

/**
 * Get the config from the config file
 *
 * @param filename - The file name of the config file (in project root dir)
 * @param format - The file extension of the config file (normally is JSON)
 *
 * @returns The parsed config from the JSON-formatted config file
 */
const getConfig = async (filename: string = 'config', format: string = 'json'): Promise<Config> => {
    try {
        const readConfig: string = await fs.readFile(path.join(__dirname, '../', `${filename}.${format}`), 'utf8');
        return JSON.parse(readConfig);
    } catch (err) {
        log('Failed to read the config file.', 'e');
        console.log(err);
        process.exit();
    }
};

/**
 * Perform a HTTP/HTTPS get request
 *
 * @param url - The URL of the request
 *
 * @returns The responsive result of the request
 */
const get = async (url: string) => {
    return (await axios.get(url)).data ?? null;
};

/**
 * Extract the unicode form the urls in the GitHub emoji icon list
 *
 * @param url - The URL of a GitHub emoji icon
 * @param extension - The extension of the GitHUb emoji icon
 *
 * @returns The unicode of a GitHub emoji
 */
const base = (url: string, extension: string = '.png'): string => {
    if (url.includes('?')) {
        url = url.split('?')[0];
    }
    return path.basename(url, extension);
};

/**
 * Parser to extract the data from the Unicode Emojis Data text
 *
 * @param text - A line of the Unicode Emojis text
 *
 * @returns The parsed result of the line of Unicode Emoji text
 */
const parse = (text: string): Unicode | null => {
    // Format: {code points}; {status} # {emoji} E{emoji version} {name}
    const dataRegex = /^(.+)\s+;.+#.+E[\d.]+\s+(.+)$/i;
    const dataMatch = text.match(dataRegex);
    if (dataMatch !== null) {
        let unicode = dataMatch[1].trim();
        // \u200d is the joiner unicode which is not used in GitHub icon file naming
        const originalUnicode = (unicode.includes(' 200D')) ? unicode.replace(/\s/g, '-').toUpperCase() : undefined;
        unicode = unicode.replace(/\s200D/g, '').replace(/\s/g, '-').toUpperCase();
        return {type: 'emoji', name: dataMatch[2].trim(), unicode: unicode, original: originalUnicode };
    }
    const subgroupRegex = /^#\s+subgroup:\s+(.+)$/i;
    const subgroupMatch = text.match(subgroupRegex);
    if (subgroupMatch !== null) {
        return {type: 'subgroup', name: subgroupMatch[1].trim()};
    }
    const groupRegex = /^#\s+group:\s+(.+)$/i;
    const groupMatch = text.match(groupRegex);
    if (groupMatch !== null) {
        return {type: 'group', name: groupMatch[1].trim()};
    }
    return null;
};

/**
 * Formatting a title (Uppercase first character of each word)
 *
 * @param text - The original text for the title
 *
 * @returns The formatted title
 */
const title = (text: string): string => {
    text = text.replace(/-/g, ' ');
    if (text.includes(' ')) {
        const words = text.split(' ');
        return words.map((word) => {
            return word[0].toUpperCase() + word.substring(1);
        }).join(' ');
    }
    return text[0].toUpperCase() + text.substring(1);
};

/**
 * Convert the unicode to Emoji symbol
 *
 * @param unicode - The Unicode
 *
 * @returns The Emoji symbol
 */
const toEmoji = (unicode: string): string => {
    if (unicode.includes('-')) {
        const codes = unicode.split('-');
        return codes.map((u) => {
            return String.fromCodePoint(parseInt(u, 16));
        }).join('');
    }
    return String.fromCodePoint(parseInt(unicode, 16));
};

/**
 * Convert the unicode text to Unicode
 *
 * @param unicodeText - The text of the Unicode
 *
 * @returns The Unicode formatted unicode
 */
const toUnicode = (unicodeText: string): string => {
    if (unicodeText.includes('-')) {
        const codes = unicodeText.split('-');
        return codes.map((u) => {
            return ` U+${u}`;
        }).join('').trim();
    }
    return `U+${unicodeText}`;
};

/**
 * Convert the number to icon
 *
 * @param num - The number text
 *
 * @returns The shortcodes of the number icon
 */
const numberIcon = (num: number | string): string => {
    const mapping = ['zero','one','two','three','four','five','six','seven','eight','nine'];
    let result = '';
    for (const n of num.toString()) {
        result += `:${mapping[parseInt(n)]}:`;
    }
    return result;
};

/**
 * Create a Markdown Anchor
 *
 * @param displayText - The text for the anchor
 * @param anchorPoint - The named anchor point to be linked
 *
 * @returns The anchor point Markdown
 */
const anchor = (displayText: string, anchorPoint: string = '') => {
    if (anchorPoint === '') {
        anchorPoint = displayText;
    }
    return `[${displayText}](#${anchorPoint.toLowerCase().replace(/\s/g, '-').replace(/&/g, '')})`;
};

/**
 * Write content to a file
 *
 * @param filepath - The path of the file (in project root directory)
 * @param content - The content to be written to the file
 *
 */
const writeFile = async (filepath: string, content: string) => {
    await fs.writeFile(path.join(__dirname, '../', `${filepath}`), content);
};

/**
 * Log for message (Display in the console only)
 *
 * @param message - The text to be logged
 * @param type - The type of the log
 *
 */
const log = (message: string, type: string = '') => {
    let msgType;
    switch (type.toLowerCase()) {
        case 'i':
            msgType = 'INFO';
            break;
        case 'e':
            msgType = 'ERROR';
            break;
        case 'w':
            msgType = 'WARNING';
            break;
        default:
            msgType = 'MESSAGE';
    }
    console.log(`[${msgType}] ${timeNow()} | ${message}`);
};

/**
 * Get current date time with format YYYY-MM-DD HH:mm:ss
 *
 * @returns The formatted datetime
 */
const timeNow = (): string => {
    const d: Date = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};


export {getConfig, get, base, parse, title, toEmoji, toUnicode, numberIcon, anchor, writeFile, log, timeNow};
