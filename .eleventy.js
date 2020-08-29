const htmlmin = require('html-minifier');
const { DateTime } = require('luxon');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const pluginRss = require('@11ty/eleventy-plugin-rss');
const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const markdownItLazyImg = require('markdown-it-image-lazy-loading');

// const bart = {
//   doeIets: (input) => {
//     return input.toUpperCase();
//   }
// };

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(pluginRss);

  // eleventyConfig.addPlugin(lazyImagesPlugin, {
  //   transformImgPath: (imgPath) => {
  //     if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
  //       // Handle remote file
  //       return imgPath;
  //     } else {
  //       return `./src/${imgPath}`;
  //     }
  //   },
  // });

  // eleventyConfig.setEjsOptions({
  //   rmWhitespace: true,
  //   context: {
  //     // bart
  //   },
  // });
  //
  // eleventyConfig.addFilter('json', (obj) => {
  //   return JSON.stringify(obj);
  // });

  eleventyConfig.addFilter('date', (dateObj, type) => {
    let format;
    const dateTime = DateTime.fromJSDate(dateObj, { zone: 'utc' });
    switch (type) {
      case 'iso':
        return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toISODate();
      case 'date':
      default:
        return dateTime.toFormat('LLLL d, yyyy');
    }
  });

  eleventyConfig.setBrowserSyncConfig({
    files: './_site/assets/styles/main.css',
    ghostMode: false,
  });

  // Get the first `n` elements of a collection. Or last by supplying a negative `n`
  eleventyConfig.addFilter('head', (array, n) => {
    return n < 0 ? array.slice(n) : array.slice(0, n);
  });

  eleventyConfig.addTransform('htmlmin', (content, outputPath) => {
    if (outputPath.endsWith('.html')) {
      return htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        minifyJS: true,
        conservativeCollapse: false,
      });
    }
    return content;
  });

  eleventyConfig.setDataDeepMerge(true);

  /* Markdown Overrides */
  let markdownLibrary = markdownIt({
    html: true,
    breaks: false,
    linkify: true,
    typographer: true,
  })
    .use(markdownItAnchor, {
      permalink: true,
      permalinkClass: 'anchor',
      permalinkSymbol: '#',
      permalinkBefore: true,
      level: 2,
    })
    .use(markdownItLazyImg);
  eleventyConfig.setLibrary('md', markdownLibrary);

  eleventyConfig.addCollection('tagList', function (collection) {
    let tagSet = new Set();
    collection.getAll().forEach(function (item) {
      if ('tags' in item.data) {
        const tags = item.data.tags.filter(function (tag) {
          return !['all', 'post'].includes(tag);
        });
        for (const tag of tags) {
          tagSet.add(tag);
        }
      }
    });

    // returning an array in addCollection works in Eleventy 0.5.3
    return [...tagSet];
  });

  return {
    pathPrefix: '/',
    dir: {
      input: 'src',
      output: '_site',
      data: '_data',
    },
    markdownTemplateEngine: 'njk',
  };
};
