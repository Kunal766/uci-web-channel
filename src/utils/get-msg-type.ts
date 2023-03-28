export const getMsgType = (msg: any) => {
    if (msg?.payload?.buttonChoices || msg?.choices) return "options";
    if (msg?.imageUrl) return "image";
    if (msg?.videoUrl) return "video";
    if (msg?.audioUrl) return "audio";
    if (msg?.payload?.media) {
      switch (msg?.payload?.media?.category) {
        case "IMAGE":
        case "IMAGE_URL":
          return "image";
        case "VIDEO":
        case "VIDEO_URL":
          return "video";
  
        case "AUDIO":
        case "AUDIO_URL":
          return "audio";
        default:
          return "text";
      }
    }
    return "text";
  };
  