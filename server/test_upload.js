import fs from 'fs';

async function testUploadAndPollinations() {
  try {
    const filePath = '../front/public/ai/demo_before.png';
    const imageBuffer = fs.readFileSync(filePath);
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    
    // Upload image anonymously
    const formData = new FormData();
    formData.append('file', blob, 'demo_before.png');

    console.log("Uploading to tmpfiles.org...");
    const uploadRes = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: formData
    });
    const uploadData = await uploadRes.json();
    console.log(uploadData);

    if (uploadData.status === 'success') {
      const publicUrl = uploadData.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      console.log("Public URL:", publicUrl);

      // Tell pollinations to use it!
      const prompt = "contemporary luxury room interior design perfect lighting high quality";
      const polliUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true&seed=42&image_url=${encodeURIComponent(publicUrl)}`;
      
      console.log("Fetching enhanced image from Pollinations...");
      const polliRes = await fetch(polliUrl);
      console.log("Polli Status:", polliRes.status);
      console.log("Polli Content-Type:", polliRes.headers.get('content-type'));
    }

  } catch (err) {
    console.error(err);
  }
}
testUploadAndPollinations();
