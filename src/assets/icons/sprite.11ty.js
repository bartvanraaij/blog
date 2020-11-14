// Shamelessly modified from james website
// https://github.com/jamesdoc/jamesdoc.com

const fs = require('fs');
const path = require('path');
const util = require('util');
const glob = require('glob');
const File = require('vinyl');
const SVGSpriter = require('svg-sprite');

module.exports = class {
  // eslint-disable-next-line class-methods-use-this
  data() {
    return {
      permalink: '/assets/images/icons.svg',
      layout: null,
      eleventyExcludeFromCollections: true,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async compile() {
    const cwd = path.resolve('src/assets/icons');
    const config = {
      mode: {
        inline: true,
        symbol: {
          sprite: 'icons.svg',
          example: false,
        },
      },
      shape: {
        transform: ['svgo'],
        id: {
          generator: '%s',
        },
      },
      svg: {
        xmlDeclaration: false,
        doctypeDeclaration: false,
      },
    };
    const spriter = new SVGSpriter(config);
    const getFiles = util.promisify(glob);

    const compileSprite = async (args) => new Promise((resolve, reject) => {
      spriter.compile(args, (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result.symbol.sprite);
      });
    });

    const files = await getFiles('**/*.svg', { cwd });
    files.forEach((file) => {
      spriter.add(
        new File({
          path: path.join(cwd, file),
          base: cwd,
          contents: fs.readFileSync(path.join(cwd, file)),
        }),
      );
    });

    const sprite = await compileSprite(config.mode);
    return sprite.contents.toString('utf8');
  }

  // render the SVG file
  async render() {
    try {
      return await this.compile();
    } catch (err) {
      throw new Error(err);
    }
  }
};
