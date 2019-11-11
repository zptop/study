const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');  //把ES6 code 转成 AST
const traverse = require('@babel/traverse').default  //遍历AST树
const babel = require('@babel/core');     //把AST从ES6code转换到ES5code
let ID = 0;          //filename是相对路径，可能会重名，加一个唯一id标识符

//单个文件分析
function createAsset(filename) {

     //拿到入口文件内容
     const content = fs.readFileSync(filename,'utf-8');   
     
     //把content转成AST，代码是模块化的(默认是不处理模块化代码)，所以要加{'sourceType':'module'}告诉代码是模块化的
     const ast = parser.parse(content,{
         sourceType:'module'
     });

     //visitor
     //node节点包含当前节点和父节点的信息
     //ImportDeclaration这个节点存储在{ node }解构出来的节点上
     //{ node }相当于 es5的写法function (info){ const node = info.node }
     //index.js入口文件有多个import依赖时，就会有多个ImportDeclaration
     const dependencies = [];
     traverse(ast,{
         ImportDeclaration:({node})=>{
            dependencies.push(node.source.value);
         }
     });

     //从AST同步转换
     //第三个参数是转为es5或es3 
     //@babel/preset-env可以根据配置的目标浏览器或者运行环境来自动将ES2015+的代码转换为ES5
     const { code } = babel.transformFromAstSync(ast,null,{
        presets:['@babel/preset-env']
     })


    //  console.log(code);
    //把数据返回
    const id = ID++;
    return {
        id,
        filename,
        dependencies,
        code
    }
     
}
 
//多个依赖文件分析
function createGraph(entry){
    const mainAsset = createAsset(entry);
    const queue = [mainAsset];
    for(const asset of queue){
        asset.mapping = {};
        const dirname = path.dirname(asset.filename);
        asset.dependencies.forEach(relativePath=>{
            const absolutePath = path.join(dirname,relativePath);
            const child = createAsset(absolutePath);
            asset.mapping[relativePath] = child.id;
            queue.push(child);
        })
    }
    return queue;
}

//打包
function bundle(graph) {
    let modules = '';    
    
    graph.forEach(mod=>{
        modules += `
            ${mod.id}:[
                function(require,module,exports){
                    ${mod.code}
                },
                ${JSON.stringify(mod.mapping)}
            ],
        `
    })

    const result = `(function(modules){
        function require(id){
            var module = modules[id];
            var fn = module[0];
            var mapping = module[1];

            function localRequire(relativePath){
                return require(mapping[relativePath]);
            }
            var module = {
                exports:{}
            } 
            fn(localRequire,module,exports);
            return module.exports;
        }
        require(0);
    })({${modules}})`;


    return result;
}

const graph = createGraph('./src/index.js');
const result = bundle(graph);
console.log(result);