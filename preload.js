const { ipcRenderer } = require('electron')

window.exports = {
  dictinput: {
    mode: 'none',
    args: {
      enter: (action) => {
        window.location.href = 'index.html#/input'
      }
    }
  },
  dict: {
    mode: 'over',
    args: {
      enter: (action, searchWord) => {
        const [keyword, searchText] = searchWord.split(':').map(s => s.trim())
        if (!keyword || !searchText) {
          window.utools.showNotification('请输入正确的格式：关键字:搜索内容')
          return
        }
        window.location.href = `index.html#/search?keyword=${encodeURIComponent(keyword)}&searchText=${encodeURIComponent(searchText)}`
      }
    }
  },
  dictlist: {
    mode: 'none',
    args: {
      enter: (action) => {
        window.location.href = 'index.html#/list'
      }
    }
  }
} 