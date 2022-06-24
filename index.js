const path = require('path')
const fs = require('fs')

const excludes = ['.DS_Store', '.vuepress', 'assets']
const replaceList = ['index.md', 'README.md']
const DEFAULT_ROOT_PTAH = '/docs'

function getRootDir() {
    return path.resolve(process.cwd());
};
function getNode(path = '', isTop = false) {
  const pagesPath = getRootDir() + DEFAULT_ROOT_PTAH + path
  const targetDir = []
  const rootPage = []
  let fileTypes = /\.md$/ //只匹配以md结尾的文件
  fs.readdirSync(pagesPath).forEach((i) => {
    const fileFullPath = pagesPath + '/' + i
    const fileInfo = fs.statSync(fileFullPath) // 用于异步返回有关给定文件路径的[信息]
    if (fileInfo.isFile()) { // 判断是否文件
      fileTypes.test(i) &&
        (replaceList.indexOf(i) < 0 ? rootPage.push(i) : rootPage.push(''))
    } else if (fileInfo.isDirectory()) { // 判断是否目录
      if (isTop) {
        excludes.indexOf(i) < 0 && targetDir.push(i)
      } else {
        targetDir.push(i)
      }
    }
  })
  targetDir.sort()
  rootPage.sort()
  return {
    path: `${path}`,
    targetDir,
    rootPage,
  }
}

function getRoopNode(options, root, Result) {
  if (options.targetDir.length !== 0) {
    options.targetDir.forEach((j) => {
      getRoopNode(getNode(`${options.path}/${j}`), root, Result)
    })
  }
  if (options.path === root) {
    Object.assign(Result, {
      '/': options.rootPage,
    })
  } else {
    Object.assign(Result, {
      [options.path + '/']: options.rootPage, // 多个侧边栏key结尾需要加/
    })
  }
}

/**
 * 
 * @param {*} dir 
 * @param {*} plink level > 1 时传
 * @returns 
 */
function linkBuilder (dir, plink) {
  return {
    text: path.basename(dir) || '首页',
    link: `${plink || ''}${dir}`,
  }
}




// type 不传 或 withNav
function nemuConstructor(type) {
  const root = getNode('', true) //先剔除docs默认目录下不需要展示标题的目录
  let sideBar = {}
  let nav = {},
    navList = {}
    tempNav = []

  getRoopNode(root, DEFAULT_ROOT_PTAH, sideBar)

  // console.log(sideBar)
  tempNav = Object.keys(sideBar).sort()
  // console.log('tempNav', tempNav)
  if (tempNav[0] === '/') {
    tempNav.splice(0, 1) // 删掉根目录
  }

function navItemBuilder (dir, plink) {
  const router = `${plink || ''}${dir}`
  const hasIndexpage = sideBar[router].includes('')
  if (hasIndexpage) {
    return linkBuilder(dir, plink)
  } else {
    return Object.assign(linkBuilder(dir, plink), {
      items: [{
          text: 'link 下面的',
          items: sideBar[router].map(i => linkBuilder(i, router))
      }]
    })
  }
}


// // console.log('tempNav',tempNav)
  
  function addItem (pdir, addDir) {
    if (sideBar[addDir].includes('')) {
      nav[pdir] = navItemBuilder(addDir)
    } else {
        nav[pdir] = {
          ...linkBuilder(addDir),
          items: [{
            text: '/',
            items: sideBar[addDir].map(i => linkBuilder(i, pdir))
          }]
        }
      }
  }

  function mergeItemHandler (pdir, addDir) {
    // console.log('%%%%%%%', navItemBuilder(pdir, addDir))
    const tp = navItemBuilder(pdir, addDir)
    if (tp.hasOwnProperty('items')) {
      // console.log(tp.items[0].items[0].link)
      // tp.link = tp.items[0].items[0].link // 方法1
      // delete (tp.items) // 方法1
    
      tp.items = tp.items[0].items
      
    }
    return tp
  }


  /**
   * 
   * @param {父级路径} pdir 
   * @param {真实路径} dir 非必须
   */
  function add (pdir, dir) {
    const addDir = dir || pdir
    // 当父级路径是'/' 时 添加路由为该真实路径，传参数只传一个就行
    const hasIndexpage = sideBar[addDir].includes('') // 用于判断是否还要加items
    // console.log('addDir', addDir)
    // console.log('nav是否已经有', nav.hasOwnProperty(pdir))
    if (nav.hasOwnProperty(pdir)) {
      const temp = nav[pdir].items
      // console.log('nav',nav)
      // console.log('tp2', nav[addDir])
      // // console.log('要加的项',addItem(pdir, addDir),pdir, addDir)
      nav[pdir].items = [...(temp || []), mergeItemHandler(addDir,)]
    } else {
      // console.log('kk有没有index', sideBar[pdir])
      addItem(pdir, addDir)
    }
    // console.log(nav)
  }
  tempNav.forEach((i, index) => {
    // console.log('****************', i, index)
    let pdirArr = []
    let tmpdir = i
    do {
      tmpdir = path.dirname(tmpdir)
      if (tmpdir !== '/') {
        pdirArr.push(tmpdir +'/')
      } else if (pdirArr.length === 0) {  // 父级是根目录， 并且pdirArr没有任何元素
        // console.log('pdirArr.length === 0', 'tmpdir不是 /')
        add(i)
      }
    } while (tmpdir !== '/')
    // console.log('结果', JSON.stringify(pdirArr))

    // pdirArr.forEach(j => {
    //   if (j === "/") {
    //     add(i)
    //   } else {
    //     if (Object.keys(nav).includes(j)) {
    //       add(j)
    //      }
    //   }
    //   // console.log('$', JSON.stringify(nav))
    // })
    const tempLen = pdirArr.length
    if (tempLen) {
      const topLevel = pdirArr[tempLen - 1]
      // console.log(index, topLevel)
      if (topLevel === '/') {
        // console.log('1')
        add(i)
      } else {
        // console.log('2')
        add(topLevel, i)
      }
    }
    

  })

  let resultNav = Object.values(nav)
  resultNav.unshift({
        text: 'home',
        items: sideBar['/'].map(i => linkBuilder(i, '/'))
  })
  
  if (type) {
    return {
      sideBar,
      nav: resultNav,
    }
  } else {
    return sideBar 
  }
}
// console.log(JSON.stringify(sideBarConstructor('withNav').nav))
module.exports = { nemuConstructor }
