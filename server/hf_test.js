import fs from 'fs';

async function testHuggingFace() {
    const filePath = "../front/public/ai/demo_before.png";
    const imageBuffer = fs.readFileSync(filePath);
    
    // Attempt 1: Raw binary POST (standard for some HF models)
    try {
        const response = await fetch(
            "https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix",
            {
                headers: { "Content-Type": "application/octet-stream" },
                method: "POST",
                body: imageBuffer,
            }
        );
        const result = await response.blob();
        console.log("HF API Response Status:", response.status);
    } catch (e) {
        console.log("Error:", e);
    }
}

testHuggingFace();
