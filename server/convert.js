import fs from 'fs';
import path from 'path';

function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walk(filePath, fileList);
        } else if (filePath.endsWith('.js')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const files = walk('./src');

files.forEach(file => {
   let content = fs.readFileSync(file, 'utf8');
   let original = content;
   
   if (!content.includes('require(') && !content.includes('module.exports') && !content.includes('exports.')) {
       return;
   }

   // 1. replace const { x, y } = require('...');
   content = content.replace(/(?:let|const|var)\s+\{\s*([^}]+)\s*\}\s*=\s*require\((['"])([^'"]+)\2\);?/g, (match, binds, q, reqPath) => {
       let newPath = reqPath;
       if (newPath.startsWith('.') && !newPath.endsWith('.js')) newPath += '.js';
       return `import { ${binds} } from '${newPath}';`;
   });

   // 2. replace const x = require('...');
   content = content.replace(/(?:let|const|var)\s+([a-zA-Z0-9_]+)\s*=\s*require\((['"])([^'"]+)\2\);?/g, (match, bind, q, reqPath) => {
       let newPath = reqPath;
       if (newPath.startsWith('.') && !newPath.endsWith('.js')) newPath += '.js';
       return `import ${bind} from '${newPath}';`;
   });

   // 2b. replace bare require('...'); (like in dotenv)
   content = content.replace(/require\((['"])([^'"]+)\1\);?/g, (match, q, reqPath) => {
       let newPath = reqPath;
       if (newPath.startsWith('.') && !newPath.endsWith('.js')) newPath += '.js';
       return `import '${newPath}';`;
   });

   // 3. replace module.exports = x;
   content = content.replace(/module\.exports\s*=\s*([^;\n]+);?/g, 'export default $1;');

   // 4. exports.foo = ... -> export const foo = ...
   content = content.replace(/exports\.([a-zA-Z0-9_]+)\s*=\s*(async\s*\(|function|new|\(|req|\[|\{)/g, 'export const $1 = $2');
   // handle simple exports like exports.foo = 'bar'
   content = content.replace(/exports\.([a-zA-Z0-9_]+)\s*=\s*([^\n;]+);?/g, 'export const $1 = $2;');

   if (content !== original) {
       fs.writeFileSync(file, content, 'utf8');
       console.log(`Converted: ${file}`);
   }
});
