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
    switch (type) {
      case 'iso':
        return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toISODate();
        break;
      case 'date':
      default:
        format = 'LLLL d, yyyy';
        break;
    }
    // format = 'dd LLL yyyy';
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat(format);
  });
  // eleventyConfig.addFilter("readableDate", dateObj => {
  //   return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("dd LLL yyyy");
  // });
  //
  // // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  // eleventyConfig.addFilter('htmlDateString', (dateObj) => {
  //   return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
  // });

  eleventyConfig.setBrowserSyncConfig({
    files: './_site/assets/styles/main.css',
    ghostMode: false,
  });

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter('head', (array, n) => {
    if (n < 0) {
      return array.slice(n);
    }
    return array.slice(0, n);
  });

  eleventyConfig.addTransform('htmlmin', (content, outputPath) => {
    if (outputPath.endsWith('.html')) {
      const minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        minifyJS: true,
      });
      return minified;
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
  };
};
