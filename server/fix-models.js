import fs from 'fs';
import path from 'path';

const modelsDir = './src/models';
const files = fs.readdirSync(modelsDir);

for (const file of files) {
  if (file.endsWith('.js') && !file.includes('.model.')) {
    const filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Change mongoose.model('Name', schema) to mongoose.model('NameYahya', schema)
    const newContent = content.replace(/mongoose\.model\(['"]([^'"]+)['"]/g, "mongoose.model('$1Yahya'");
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Renamed model definition in:', file);
    }
  }
}
