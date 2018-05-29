const fs = require('fs')
const moment = require('moment')
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')
const yaml = require('js-yaml')

module.exports = eleventyConfig => {
  eleventyConfig.addCollection('homepage', collection => {
    return collection.getAllSorted().filter(item => {
      if (!item.data.tags || !item.data.tags.includes('blog') || item.data.queued) {
        return false
      }

      let basename = item.inputPath.split('/').pop().split('.').shift()
      let comments = []

      try {
        let path = `comments/${basename}`
        let files = fs.readdirSync(path)

        files.forEach(file => {
          let raw = fs.readFileSync(`${path}/${file}`, 'utf8')
          let data = yaml.safeLoad(raw)

          comments.push(data)
        })
      } catch (err) {}

      if (comments.length) {
        item.data.comments = comments  
      }

      return true
    }).reverse()
  })

  eleventyConfig.addCollection('series', collection => {
    let previousItem

    return collection.getAllSorted().filter(item => {
      if (item.data.series) {
        if (previousItem && (previousItem.data.series === item.data.series)) {
          previousItem.data.nextInSeries = item
        }

        previousItem = item
      } else {
        previousItem = undefined
      }

      return item.data.series
    })
  })

  eleventyConfig.addCollection('video-section', collection => {
    return collection.getAllSorted().filter(item => {
      return item.data.tags &&
        item.data.tags.includes('video') &&
        item.data.src
    }).reverse()
  })  

  eleventyConfig.addLiquidFilter('feature_title', title => {
    const MIN_LENGTH = 8
    const MAX_LENGTH = 20

    if (!title) return ''

    let currentLine = ''
    let lines = []
    let words = title.split(' ')

    words.forEach(word => {
      if ((currentLine.length + word.length) <= MAX_LENGTH) {
        currentLine += (word + ' ')
      } else {
        lines.push(currentLine)
        
        currentLine = word + ' '
      }
    })

    if (currentLine.length < MIN_LENGTH) {
      lines[lines.length - 1] += currentLine
    } else {
      lines.push(currentLine)
    }

    return `
      <span class="feature-title__full">${title}</span>

      ${lines.map(line => `
        <span aria-hidden="true" class="feature-title__part">${line.slice(0, -1)}</span>
      `).join('')}
    `
  })

  eleventyConfig.addLiquidFilter('fullDate', date => {
    let momentDate = typeof date === 'number'
      ? moment(new Date(date * 1000))
      : moment(date)

    return momentDate.format("dddd, MMMM Do, YYYY")
  })

  eleventyConfig.addPassthroughCopy('assets')
  eleventyConfig.addPassthroughCopy('posts')

  eleventyConfig.addPlugin(syntaxHighlight)

  return {
    passthroughFileCopy: true
  }
}
