import fs from 'fs';

async function testPolli() {
    const prompt = 'contemporary luxury room';
    const initImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png';
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?image_url=${encodeURIComponent(initImageUrl)}`;
    
    console.log("Fetching:", url);
    const res = await fetch(url);
    console.log("Status:", res.status);
    console.log("Headers:", res.headers.get('content-type'));
}
testPolli();
