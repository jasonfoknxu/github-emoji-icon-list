/**
 * add  Generator
 * - Version: 1.0.0
 * - Developer: NXU (GitHub: @jasonfoknxu)
 * - https://github.com/jasonfoknxu/github-emoji-icon-list
 */

import * as Utils from './utilities';

(async () => {
    // Get the config from config file
    const config: IConfig = await Utils.getConfig();
    // Get the GitHub Emoji Icon List
    const githubEmojisData: IGithubEmoji = await Utils.get(config.GitHub_Emojis_List);
    // Get the Unicode Emoji Data
    const unicodeEmojisData = await Utils.get(config.Unicode_Emojis_Data);

    // Stop if no GitHub emoji list or Unicode data
    if (!githubEmojisData || !unicodeEmojisData) {
        Utils.log('Failed to get the GitHub Emoji List or Unicode Emoji Data.', 'e');
        process.exit(1);
    }

    // Handle the GitHub emoji from the GitHub Emoji Icon List
    let githubEmojis: IGithubEmoji = {};
    for (const [shortcode, url] of Object.entries(githubEmojisData)) {
        githubEmojis[shortcode] = Utils.base(url).toUpperCase();
    }

    // Process the Unicode emoji data from the Unicode Emoji Data text
    const unicodeEmojiLines = unicodeEmojisData.split(/\r?\n/);
    let unicodeEmojis: IUnicodeEmojiData = {};
    let group, subgroup, emojiGroups = [], emojiSubgroups = [], emojiCount = 0;
    for (let i = 0; i < unicodeEmojiLines.length; i++) {
        const parseResult = Utils.parse(unicodeEmojiLines[i]);
        if (!parseResult) { continue; }
        if (parseResult.type === 'group') {
            group = parseResult.name;
            emojiGroups.push(group);
        } else if (parseResult.type === 'subgroup') {
            subgroup = parseResult.name;
            emojiSubgroups.push(subgroup);
        } else if (parseResult.type === 'emoji') {
            if (!parseResult.unicode) { continue; }
            unicodeEmojis[parseResult.unicode] = {
                name: parseResult.name,
                group: group ?? '',
                subgroup: subgroup ?? '',
                order: emojiCount++
            };
        }
    }

    // Group the GitHub emoji with the Unicode emoji information
    let emojis: IEmojiGroup = {}, customGroup: ICustomEmoji[] = [];
    for (const [shortcode, unicode] of Object.entries(githubEmojis)) {
        const emojiData = unicodeEmojis[unicode];
        if (!emojiData || emojiData.group === '') {
            customGroup.push({unicode: unicode, shortcode: shortcode});
        } else if (emojiData.group !== '') {
            if (!emojis[emojiData.group]) {
                emojis[emojiData.group] = {};
            }
            if (emojiData.subgroup !== '')
                if (!emojis[emojiData.group][emojiData.subgroup]) {
                    emojis[emojiData.group][emojiData.subgroup] = [];
                }
            const emojiToAdd = {unicode: unicode, shortcode: shortcode, name: emojiData.name, order: emojiData.order};
            // Ordering the emoji within the subgroup
            const index = emojis[emojiData.group][emojiData.subgroup].findIndex((emoji) => {
                return emoji.order > emojiToAdd.order;
            });
            if (index > -1) {
                emojis[emojiData.group][emojiData.subgroup].splice(index, 0, emojiToAdd);
            } else {
                emojis[emojiData.group][emojiData.subgroup].splice(emojis[emojiData.group][emojiData.subgroup].length, 0, emojiToAdd);
            }
        }
    }

    // Sort the emoji from group and subgroup
    let organizedEmoji: EmojiGroup[] = [];
    for (const group in emojis) {
        let sortedEmojiSubgroups: EmojiSubgroup[] = [];
        for (const subgroup in emojis[group]) {
            sortedEmojiSubgroups.push([emojiSubgroups.indexOf(subgroup), subgroup, emojis[group][subgroup]]);
        }
        sortedEmojiSubgroups = sortedEmojiSubgroups.sort((a, b) => {
            return a[0] - b[0];
        });
        organizedEmoji.push([emojiGroups.indexOf(group), group, sortedEmojiSubgroups]);
    }
    organizedEmoji = organizedEmoji.sort((a, b) => {
        return a[0] - b[0];
    });

    // Create the Markdown
    let markdown = '', tableOfContents = '## Table of Contents\n', tocColumns = [];
    // Build the Markdown format
    for (let i = 0; i < organizedEmoji.length; i++) {
        const groupTitle = organizedEmoji[i][1];
        markdown += `## ${groupTitle}\n\n`;

        if (tocColumns.length > 0) {
            tableOfContents += `|${tocColumns.join('|')}|\n`;
            tocColumns = [];
        }
        tableOfContents += `\n- ${Utils.anchor(groupTitle)})\n\n`;
        tableOfContents += `|   |   |   |   |   |\n`;
        tableOfContents += `|:-----:|:-----:|:-----:|:-----:|:-----:|\n`;

        const subgroups = organizedEmoji[i][2];
        for (let j = 0; j < subgroups.length; j++) {
            const subgroupTitle = subgroups[j][1];
            markdown += `### ${Utils.title(subgroupTitle)}\n\n`;
            markdown += `|Emoji|Shortcode|Description|\n`;
            markdown += `|:---:|:-----:|:---|\n`;

            const emojiInGroup = subgroups[j][2];
            for (let k = 0; k < emojiInGroup.length; k++) {
                const emoji = emojiInGroup[k];
                markdown += `|:${emoji.shortcode}:|\`:${emoji.shortcode}:\`|${emoji.name}|\n`;
            }
            markdown += `\n\n`;
            markdown += Utils.anchor(':top: Back to Top', 'github-emoji-icon-list');
            markdown += `\n\n`;

            tocColumns.push(Utils.anchor(`:${emojiInGroup[0].shortcode}: ${Utils.title(subgroupTitle)}`, subgroupTitle));
            if (tocColumns.length > 4) {
                tableOfContents += `|${tocColumns.join('|')}|\n`;
                tocColumns = [];
            }
        }

        if (tocColumns.length > 0) {
            tableOfContents += `|${tocColumns.join('|')}|\n`;
            tocColumns = [];
        }
    }

    // Add GitHub Custom Emoji
    tableOfContents += `\n- ${Utils.anchor('GitHub Custom Emoji')}\n\n`;

    markdown += `### GitHub Custom Emoji\n\n`;
    markdown += `|Emoji|Shortcode|\n`;
    markdown += `|:---:|:-----:|\n`;
    for (let x = 0; x < customGroup.length; x++) {
        const emoji = customGroup[x];
        markdown += `|:${emoji.shortcode}:|\`:${emoji.shortcode}:\`|\n`;
    }
    markdown += `\n\n`;
    markdown += Utils.anchor(':top: Back to Top', 'github-emoji-icon-list');
    markdown += `\n`;

    // Add Table of Contents
    markdown = tableOfContents + '\n\n' + markdown;

    // Introduction
    markdown = `This list includes all the usable Emoji icon shortcodes in GitHub Markdown. The list is automatically generated from [GitHub Emoji API](${config.GitHub_Emojis_List}) with the information from [Unicode Emoji data file](${config.Unicode_Emojis_Data}).\n\nThe first column is the emoji icon, second column is the shortcode for Markdown, third column is the name of the emoji from the Unicode data.\n\n*The emoji may be displayed in different result on various system*\n\n` + markdown;

    // Heading
    markdown = `# GitHub Emoji Icon List\n\n` + markdown;

    // Write to file README.md
    await Utils.writeFile('README.md', markdown);

})();
