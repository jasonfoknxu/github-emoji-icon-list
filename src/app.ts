/**
 * GitHub Emoji Icon List Markdown Generator
 * - Version: 1.0.5
 * - Developer: NXU (GitHub: @jasonfoknxu)
 * - https://github.com/jasonfoknxu/github-emoji-icon-list
 */

import * as Utils from './utilities';

(async () => {
    // Get the config from config file
    const config: Config | null = await Utils.getConfig();

    if (!config) {
        Utils.log('Failed to get config file.', 'e');
        return;
    }

    // Get the GitHub Emoji Icon List
    const githubEmojisData: GithubEmoji = await Utils.get(config.GitHub_Emojis_List);
    // Get the Unicode Emoji Data
    const unicodeEmojisData = await Utils.get(config.Unicode_Emojis_Data);

    // Stop if no GitHub emoji list or Unicode data
    if (!githubEmojisData || !unicodeEmojisData) {
        Utils.log('Failed to get the GitHub Emoji List or Unicode Emoji Data.', 'e');
        return;
    }

    // Count number of GitHub emoji
    let numberOfEmoji = 0;

    // Handle the GitHub emoji from the GitHub Emoji Icon List
    let githubEmojis: GithubEmoji = {}, githubEmojiImage: GithubEmoji = {};
    for (const [shortcode, url] of Object.entries(githubEmojisData)) {
        githubEmojis[shortcode] = Utils.base(url).toUpperCase();
        githubEmojiImage[shortcode] = url;
        numberOfEmoji++;
    }

    // Process the Unicode emoji data from the Unicode Emoji Data text
    const unicodeEmojiLines = unicodeEmojisData.split(/\r?\n/);
    let unicodeEmojis: UnicodeEmojiData = {};
    let group = '', subgroup = '', emojiGroups = [], emojiSubgroups = [], emojiCount = 0;
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
                order: emojiCount++,
                origUnicode: parseResult.original
            };
        }
    }

    // Group the GitHub emoji with the Unicode emoji information
    let emojis: EmojiGroup = {}, customGroup: CustomEmoji[] = [];
    for (const [shortcode, unicode] of Object.entries(githubEmojis)) {
        const emojiData = unicodeEmojis[unicode];
        if (!emojiData || emojiData.group === '') {
            customGroup.push({ unicode: unicode, shortcode: shortcode });
        } else if (emojiData.group !== '') {
            if (!emojis[emojiData.group]) {
                emojis[emojiData.group] = {};
            }
            if (emojiData.subgroup !== '')
                if (!emojis[emojiData.group][emojiData.subgroup]) {
                    emojis[emojiData.group][emojiData.subgroup] = [];
                }
            const emojiToAdd = { unicode: unicode, shortcode: shortcode, name: emojiData.name, order: emojiData.order, origUnicode: emojiData.origUnicode };
            // Ordering the emoji within the subgroup
            const index = emojis[emojiData.group][emojiData.subgroup].findIndex((emoji) => {
                return (emoji.order ?? 0) > emojiToAdd.order;
            });
            if (index > -1) {
                emojis[emojiData.group][emojiData.subgroup].splice(index, 0, emojiToAdd);
            } else {
                emojis[emojiData.group][emojiData.subgroup].splice(emojis[emojiData.group][emojiData.subgroup].length, 0, emojiToAdd);
            }
        }
    }

    // Export the emoji list to format the JSON
    let exportEmoji: EmojiGroup = {};
    for (const group in emojis) {
        exportEmoji[group] = {};
        for (const subgroup in emojis[group]) {
            exportEmoji[group][Utils.title(subgroup)] = emojis[group][subgroup].map((e) => ({
                unicode: Utils.toUnicode(e.origUnicode ?? e.unicode),
                shortcode: `:${e.shortcode}:`,
                name: e.name,
                emoji: Utils.toEmoji(e.origUnicode ?? e.unicode),
                image: Utils.base(githubEmojiImage[e.shortcode], '')
            }));
        }
    }

    // Write to a JSON file
    await Utils.writeFile(config.Json_File_Name ?? 'github-emoji.json', JSON.stringify(exportEmoji));

    // Sort the emoji from group and subgroup
    let organizedEmoji: EmojiGroupData[] = [];
    for (const group in emojis) {
        let sortedEmojiSubgroups: EmojiSubgroupData[] = [];
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
        tableOfContents += `\n- ${Utils.anchor(groupTitle)}\n\n`;
        tableOfContents += `|   |   |   |   |   |\n`;
        tableOfContents += `|:-----:|:-----:|:-----:|:-----:|:-----:|\n`;

        const subgroups = organizedEmoji[i][2];
        for (let j = 0; j < subgroups.length; j++) {
            const subgroupTitle = subgroups[j][1];
            markdown += `### ${Utils.title(subgroupTitle)}\n\n`;
            markdown += `|Emoji|Image|Shortcode|Description|\n`;
            markdown += `|:---:|:---:|:-----:|:---|\n`;

            const emojiInGroup = subgroups[j][2];
            for (let k = 0; k < emojiInGroup.length; k++) {
                const emoji = emojiInGroup[k];
                // Image Markdown: ![${emoji.name}](${githubEmojiImage[emoji.shortcode]})
                // Use HTML instead, because we need to resize the image 
                markdown += `|:${emoji.shortcode}:|<img src="${githubEmojiImage[emoji.shortcode]}" alt="${emoji.name}" style="width:20px" />|\`:${emoji.shortcode}:\`|${emoji.name}|\n`;
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

    markdown += `## GitHub Custom Emoji\n\n`;
    markdown += `|Emoji|Shortcode|\n`;
    markdown += `|:---:|:-----:|\n`;
    for (let x = 0; x < customGroup.length; x++) {
        const emoji = customGroup[x];
        markdown += `|:${emoji.shortcode}:|\`:${emoji.shortcode}:\`|\n`;
    }
    markdown += `\n\n`;
    markdown += Utils.anchor(':top: Back to Top', 'github-emoji-icon-list');
    markdown += `\n`;

    // end
    markdown += `\n\n`;
    markdown += `:heart: :orange_heart: :yellow_heart: :green_heart: :blue_heart: :purple_heart: :brown_heart: :black_heart: :white_heart:`;

    // Add Table of Contents
    markdown = tableOfContents + '\n\n' + markdown;

    // Square icon divider
    markdown = ':red_square: :orange_square: :yellow_square: :green_square: :blue_square: :purple_square: :brown_square: :black_large_square: :white_large_square: \n\n' + markdown;

    // Add GitHub Actions badge (Auto Update)
    markdown = `[![Auto Update by GitHub Actions](https://github.com/jasonfoknxu/github-emoji-icon-list/actions/workflows/auto-update.yml/badge.svg)](https://github.com/jasonfoknxu/github-emoji-icon-list/actions/workflows/auto-update.yml)\n\n :robot: New icon checking & Auto update by GitHub Actions everyday.\n\n` + markdown;

    // Add the Json version info
    markdown = `[:floppy_disk: JSON version](https://github.com/jasonfoknxu/github-emoji-icon-list/blob/main/github-emoji.json) is available. Feel free to use it for further development.\n\n` + markdown;

    // Add the Json version info
    markdown = `:bar_chart: Number of GitHub Emoji Icon: ${Utils.numberIcon(numberOfEmoji)}\n\n` + markdown;

    // Circle icon divider
    markdown = ':red_circle: :orange_circle: :yellow_circle: :green_circle: :large_blue_circle: :purple_circle: :brown_circle: :black_circle: :white_circle: \n\n' + markdown;

    // Introduction
    markdown = `This list includes all the usable Emoji icon shortcodes in GitHub Markdown. The list is automatically generated from [:octocat: GitHub Emoji API](${config.GitHub_Emojis_List}) with the information from [Unicode Emoji data file](${config.Unicode_Emojis_Data}).\n\n> :information_source: *The emoji may be displayed in different result on various system or browser*\n\n` + markdown;

    // Heading
    markdown = `# GitHub Emoji Icon List\n\n` + markdown;

    // Write to file README.md
    await Utils.writeFile('README.md', markdown);

})();
