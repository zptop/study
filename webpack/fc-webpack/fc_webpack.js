const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser'); //把ES6 code 转成 AST
const traverse = require('@babel/traverse').default //遍历AST树
const babel = require('@babel/core'); //把AST从ES6code转换到ES5code
let ID = 0; //filename是相对路径，可能会重名，加一个唯一id标识符

//单个文件分析
function createAsset(filename) {

    //拿到入口文件内容
    const content = fs.readFileSync(filename, 'utf-8');

    //把content转成AST，代码是模块化的(默认是不处理模块化代码)，所以要加{'sourceType':'module'}告诉代码是模块化的
    const ast = parser.parse(content, {
        sourceType: 'module'
    });

    //visitor
    //node节点包含当前节点和父节点的信息
    //ImportDeclaration这个节点存储在{ node }解构出来的节点上
    //{ node }相当于 es5的写法function (info){ const node = info.node }
    //index.js入口文件有多个import依赖时，就会有多个ImportDeclaration
    const dependencies = [];
    traverse(ast, {
        //找到有import语法的对应节点
        ImportDeclaration: ({ node }) => {
            dependencies.push(node.source.value);
        }
    });

    //从AST同步转换
    //第三个参数是转为es5或es3 
    //@babel/preset-env可以根据配置的目标浏览器或者运行环境来自动将ES2015+的代码转换为ES5
    const { code } = babel.transformFromAstSync(ast, null, {
        presets: ['@babel/preset-env']
    })


    //模块的id从0开始，相当于一个js文件 可以看成一个模块
    const id = ID++;

    return {
        id,
        filename,
        dependencies,
        code
    }

}

//从入口开始分析所有依赖项，形成依赖图，采用广度遍历
function createGraph(entry) {
    const mainAsset = createAsset(entry);

    //既然要广度遍历肯定要有一个队列，第一个元素肯定是从'./example/entry.js'返回的信息
    const queue = [mainAsset];


    for (const asset of queue) {

        const dirname = path.dirname(asset.filename);

        //新增一个属性来保存子依赖项的数据
        //保存类似 这样的数据结构--->{'./message.js':1}
        asset.mapping = {};

        asset.dependencies.forEach(relativePath => {
            const absolutePath = path.join(dirname, relativePath);

            //获得子依赖（子模块）的依赖项、代码、模块id，文件名
            const child = createAsset(absolutePath);

            //给子依赖项赋值
            asset.mapping[relativePath] = child.id;

            //将子依赖也加入队列，广度遍历
            queue.push(child);
        })
    }
    return queue;
}

//根据生成的依赖关系图，生成对应环境执行的代码，目前是生产浏览器可以执行的
function bundle(graph) {
    let modules = '';

    //循环依赖关系，并把每个模块中的代码存在function作用域里
    graph.forEach(mod => {
        modules += `
            ${mod.id}:[
                function(require,module,exports){
                    ${mod.code}
                },
                ${JSON.stringify(mod.mapping)}
            ],
        `
    })

    console.log('modules:', modules);

    //require、module、exports是common.js的标准，不能在浏览器中直接使用，所以这里模拟common.js模块加载、执行、导出操作
    const result = `(function(modules){
        function require(id){
            var module_bak = modules[id];
            var fn = module_bak[0];
            var mapping = module_bak[1];

            function localRequire(relativePath){
                return require(mapping[relativePath]);
            }
            var module = {
                exports:{}
            } 
            fn(localRequire,module,module.exports);
            return module.exports;
        }
        require(0);
    })({${modules}})`;


    return result;
}

const graph = createGraph('./src/index.js');
const result = bundle(graph);
console.log(result);