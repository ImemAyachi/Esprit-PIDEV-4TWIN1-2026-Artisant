import { client } from "@gradio/client";
import fs from 'fs';

async function test() {
  try {
    const app = await client("timbrooks/instruct-pix2pix");
    console.log("Connected to Space!");
    
    // Convert demo before image to Blob
    const buffer = fs.readFileSync("../front/public/ai/demo_before.png");
    const blob = new Blob([buffer], { type: "image/png" });

    const result = await app.predict("/generate", [
      blob,
      "make it a contemporary luxury room", // prompt
      7, // text cfg
      1.5, // image cfg
    ]);

    console.log("Success:", result.data);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
