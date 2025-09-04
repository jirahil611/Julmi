module.exports.config = {
    name: "video",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Kashif Raza",
    description: "Download YouTube Video",
    commandCategory: "download",
    usages: "[video name or YouTube link]",
    cooldowns: 5,
    dependencies: {
      "axios": "",
      "yt-search": ""
    }
};

module.exports.run = async ({ api, event, args }) => {
  const axios = global.nodemodule['axios'];
  const yts = global.nodemodule['yt-search'];

  try {
    const q = args.join(" ");
    if (!q) return api.sendMessage("*Please provide a video name or a YouTube link.* 🎥❤️", event.threadID, event.messageID);

    // 1) Find the URL
    let url = q;
    try {
      url = new URL(q).toString();
    } catch {
      const s = await yts(q);
      if (!s.videos.length) return api.sendMessage("❌ No videos found!", event.threadID, event.messageID);
      url = s.videos[0].url;
    }

    // 2) Send metadata + thumbnail
    const info = (await yts(url)).videos[0];
    const desc = `
🧩 *𝗡𝗘𝗡𝗢 𝗫𝗠𝗗 DOWNLOADER* 🧩
📌 *Title:* ${info.title}

📝 *Description:* ${info.description}

⏱️ *Uploaded:* ${info.timestamp} (${info.ago} ago)

👀 *Views:* ${info.views}

🔗 *Download URL:*
${info.url}

━━━━━━━━━━━━━━━━━━
*ᴺᴵᴹᴱˢᴴᴷᴬ ᴹᴵᴴᴵᴿᴬᴺ🪀*
    `.trim();

    await api.sendMessage({
      body: desc,
      attachment: await axios.get(info.thumbnail, { responseType: 'stream' }).then(res => res.data)
    }, event.threadID, event.messageID);

    // 3) Video download helper
    const downloadVideo = async (videoUrl, quality = "720") => {
      const apiUrl = `https://p.oceansaver.in/ajax/download.php?format=${quality}&url=${encodeURIComponent(videoUrl)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`;

      const res = await axios.get(apiUrl);
      if (!res.data.success) throw new Error("Failed to fetch video details.");

      const { id, title } = res.data;
      const progressUrl = `https://p.oceansaver.in/ajax/progress.php?id=${id}`;

      // Poll until ready
      while (true) {
        const prog = (await axios.get(progressUrl)).data;
        if (prog.success && prog.progress === 1000) {
          const vid = await axios.get(prog.download_url, { responseType: "arraybuffer" });
          return { buffer: vid.data, title };
        }
        await new Promise((r) => setTimeout(r, 5000));
      }
    };

    // 4) Download + send
    const { buffer, title } = await downloadVideo(url, "720");
    await api.sendMessage({
      body: `🎥 *${title}*\n\nⒸ Made By 𝐊𝐀𝐒𝐇𝐈𝐅 ☠ 𝐑𝐀𝐙𝐀❤️`,
      attachment: buffer
    }, event.threadID, event.messageID);

    api.sendMessage("*Thanks for using my bot!* 🎥", event.threadID, event.messageID);
  } catch (e) {
    console.error(e);
    api.sendMessage(`❌ Error: ${e.message}`, event.threadID, event.messageID);
  }
};
