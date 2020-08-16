const htmlmin = require('html-minifier');
const { DateTime } = require('luxon');
const lazyImagesPlugin = require('eleventy-plugin-lazyimages');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');

// const bart = {
//   doeIets: (input) => {
//     return input.toUpperCase();
//   }
// };

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight);

  eleventyConfig.addPlugin(lazyImagesPlugin, {
    transformImgPath: (imgPath) => {
      if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
        // Handle remote file
        return imgPath;
      } else {
        return `./src/${imgPath}`;
      }
    },
  });
  //
  eleventyConfig.setEjsOptions({
    rmWhitespace: true,
    context: {
      // bart
    },
  });

  eleventyConfig.addFilter('json', (obj) => {
    return JSON.stringify(obj);
  });

  eleventyConfig.addFilter('date', (dateObj, type) => {
    let format;
    switch (type) {
      case 'iso':
        return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toISO();
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

  return {
    dir: { input: 'src', output: '_site', data: '_data' },
  };
};
