const fs = require('fs')
const path = require('path')

// 读取命令行参数
const fileName = process.argv[2]
const filePath = path.join(__dirname, fileName)

// 读取文件内容
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error(err)
    return
  }

  let content = data.replace(/\t/g, '    ')
  content = content.replace(/\\R/g, '\\mathbb{R}')
  content = content.replace(/\\Z/g, '\\mathbb{Z}')
  content = content.replace(/\\N/g, '\\mathbb{N}')

  content = content.replace(/\\tg/g, '\\tan')
  content = content.replace(/\\ctg/g, '\\cot')
  content = content.replace(/\\sh/g, '\\sinh')
  content = content.replace(/\\ch/g, '\\cosh')

  // dumb but work
  content = content.replace(/\\th/g, '\\tanh')
  content = content.replace(/\\tanheta/g, '\\theta')

  content = content.replace(/\\cth/g, '\\coth')
  content = content.replace(/\\arctg/g, '\\arctan')
  content = content.replace(/\\arcctg/g, '\\text{arccot}')

  content = content.replace(/\\coshi/g, '\\chi')

  content = content.replace(/\\sub/g, '\\subset')
  content = content.replace(/\\sube/g, '\\subseteq')

  content = content.replace(/\\exist/g, '\\exists')
  content = content.replace(/\\lrarr/g, '\\iff')

  content = content.replace(/\\darr/g, '\\downarrow')
  content = content.replace(/\\argmax/g, '\\arg\\max')

  content = content.replace(/\\textbf\{\\dot/g, '\\dot{\\textbf')
  content = content.replace(/\\textbf\{\\ddot/g, '\\ddot{\\textbf')
  content = content.replace(/\\textbf\{\\hat/g, '\\hat{\\textbf')
  content = content.replace(/\\bold/g, '\\textbf')
  content = content.replace(/\\textbfsymbol/g, '\\boldsymbol')
  content = content.replace(/\\~/g, '\\tilde')


  fs.writeFile(filePath, content, 'utf8', (err) => {
    if (err) {
      console.error(err)
      return
    }
  })
})