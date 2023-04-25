import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { exec } from "child_process";
import { createWriteStream, unlinkSync, mkdirSync } from "fs";
import fs from "fs";
import axios from "axios";
import path from "path";
 
const app = express();
 
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
 
// Add a route for the root URL
app.get("/", (req, res) => {
  const filePath = path.join("src", "public", "index.html");
  const absolutePath = path.join(process.cwd(), filePath);
 
  res.sendFile(absolutePath);
});
 
app.post("/download", async (req, res) => {
  const links: string[] = req.body.links;
  const downloadDir = `src/downloads/${Date.now()}`;
  const tempFile = `src/downloads/${Date.now()}.txt`;
  let zipFile: string;
 
  try {
    // Check if the downloads folder exists
    if (!fs.existsSync('src/downloads')) {
      // Create the downloads folder if it doesn't exist
      mkdirSync('src/downloads');
    }
 
    for (let i = 0; i < links.length; i++) {
      let link = links[i];
      if (link.startsWith("https://bunkr.su/a/") || link.startsWith("https://bunkr.la/a/")) {
        const response = await axios.get(link);
        const html = response.data;
        const regex = /https:\/\/cdn\d+\.bunkr\.(ru|la)\/\S+\.(jpg|jpeg|png|gif|mp4)/g;
        const cdnLinks = html.match(regex)?.map((cdnLink) => {
          cdnLink = cdnLink.replace("cdn", "media-files");
          if (cdnLink.includes("media-files12.bunkr.ru")) {
            cdnLink = cdnLink.replace("media-files12.bunkr.ru", "media-files12.bunkr.la");
          }
          return cdnLink;
        });
        if (cdnLinks) {
          link = cdnLinks.join("\n");
        }
      }
      await appendToFile(tempFile, link);
    }
 
    await execCommand(`gallery-dl -d ${downloadDir} -i ${tempFile}`);
    zipFile = `${downloadDir}.zip`;
    await execCommand(`zip -r ${zipFile} ${downloadDir}`);
    res.download(zipFile);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error downloading files");
  } finally {
    if (tempFile) {
      unlinkSync(tempFile);
    }
    if (zipFile) {
      unlinkSync(zipFile);
    }
  }
});
 
async function appendToFile(file: string, content: string) {
  return new Promise<void>((resolve, reject) => {
    const stream = createWriteStream(file, { flags: "a" });
    stream.write(`${content}\n`, "utf-8", (error) => {
      if (error) {
        reject(error);
      } else {
        stream.close();
        resolve();
      }
    });
  });
}
 
async function execCommand(command: string) {
  return new Promise<void>((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        console.log(stdout);
        console.error(stderr);
        resolve();
      }
    });
  });
}
 
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
