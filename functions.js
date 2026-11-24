const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');

module.exports = {
    loadRules,
    autocompleteRules,
    getCustomEmoji,
};

function loadRules(rulesDirectory) {
    const rulesLibrary = {};
    const rulesOptions = [];

    for (const filename of fs.readdirSync(rulesDirectory)) {
        if (!filename.endsWith('.md')) continue;

        const filePath = path.join(rulesDirectory, filename);
        const { data, content } = matter.read(filePath);
        const filenameStem = path.basename(filename, '.md');
        const name = String(data.title ?? data.name ?? filenameStem);
        const description = removeWikiLinks(content.trim());

        rulesLibrary[filenameStem] = {
            ...data,
            name,
            description,
        };

        rulesOptions.push({
            name,
            value: filenameStem,
            filenameStem,
        });
    }

    return { rulesLibrary, rulesOptions };
}

async function autocompleteRules(interaction, rulesOptions) {
    try {
        const focusedValue = interaction.options.getFocused().toLowerCase();

        const suggestions = rulesOptions
        .filter(choice =>
        choice.name.toLowerCase().includes(focusedValue) ||
        choice.filenameStem.toLowerCase().includes(focusedValue)
        )
        .slice(0, 25)
        .map(choice => ({
            name: choice.name,
            value: choice.value,
        }));

        if (!interaction.responded) {
            await interaction.respond(suggestions);
        }
    } catch (error) {
        console.error('Autocomplete error:', error);
    }
}

function getCustomEmoji(interaction, name) {
    const emoji = interaction.guild?.emojis.cache.find(item => item.name === name);
    return emoji ? `<:${emoji.name}:${emoji.id}>` : '';
}

function removeWikiLinks(markdown) {
    return markdown
    // [[Target|Display]] → Display
    .replace(/\[\[([^[\]|]+)\|([^[\]]+)\]\]/g, '$2')
    // [[Target]] → Target
    .replace(/\[\[([^[\]]+)\]\]/g, '$1')
    // [[Target#Section|Display]] / [[Target#Section]] → display/target
    .replace(/\[\[([^[\]|#]+)(?:#[^[\]|]+)?(?:\|([^[\]]+))?\]\]/g,
             (_match, target, display) => display ?? target);
}
