const eleventySass = require('eleventy-sass');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const postcss = require('postcss');
const cssnano = require('cssnano');
const autoprefixer = require('autoprefixer');
const pluginRss = require('@11ty/eleventy-plugin-rss');

const shortcodeCodepen = require('./utils/shortcode-codepen');
const shortcodeImage = require('./utils/shortcode-image');
const shortcodeVimeo = require('./utils/shortcode-vimeo');

module.exports = function (config) {
    config.addLiquidShortcode('image', shortcodeImage);
    config.addLiquidShortcode('codepen', shortcodeCodepen);
    config.addLiquidShortcode('vimeo', shortcodeVimeo);

    config.addNunjucksGlobal('getYear', function () {
        return new Date().getFullYear();
    });

    config.addNunjucksGlobal('formatDate', function (date) {
        return date.toLocaleDateString('en-FI', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    });

    config.addNunjucksGlobal('filterPastEvents', function (event) {
        return new Date(event.data.date) >= new Date();
    });

    config.addNunjucksGlobal('getArticleReadTime', function (content) {
        const splitContent = content.split('\n');
        const filteredContent = splitContent.filter(
            (content) =>
                !content.startsWith('<pre') &&
                !content.startsWith('<hr') &&
                !content.startsWith('<picture'),
        );
        const readTime = Math.floor(filteredContent.join('').split(' ').length / 165);
        return readTime;
    });

    config.addNunjucksGlobal('getCanonicalDomain', function (url) {
        return new URL(url).hostname;
    });

    config.addPassthroughCopy('./src/fonts');
    config.addPassthroughCopy('./src/js');
    config.addPassthroughCopy('./src/assets/books');
    config.addPassthroughCopy('./src/assets/icons');
    config.addPassthroughCopy('./src/assets/images');
    config.addPassthroughCopy('./src/assets/slides');
    config.addPassthroughCopy('./src/assets/articles/**/**.mp4');
    config.addPassthroughCopy('./src/assets/articles/**/social-image.jpg');

    config.addPlugin(syntaxHighlight);
    config.addPlugin(pluginRss, { getNewestCollectionItemDate: true });
    config.addPlugin(eleventySass, {
        postcss: postcss([autoprefixer, cssnano]),
    });

    return {
        dir: {
            input: 'src',
            output: '_site',
        },
    };
};
