const photoInput = document.getElementById("photoInput");
const nameInput = document.getElementById("nameInput");
const flyerPreview = document.getElementById("flyerPreview");
const flyerPlaceholder = document.getElementById("flyerPlaceholder");
const portraitPreview = document.getElementById("portraitPreview");
const portraitPlaceholder = document.getElementById("portraitPlaceholder");
const namePreview = document.getElementById("namePreview");
const downloadBtn = document.getElementById("downloadBtn");
const shareBtn = document.getElementById("shareBtn");
const statusEl = document.getElementById("status");

let participantImage = null;

function setStatus(message) {
  statusEl.textContent = message;
}

function loadFlyer() {
  const candidates = ["images/flyer.jpg", "images/flyer.png"];
  let index = 0;

  function tryNext() {
    if (index >= candidates.length) {
      flyerPreview.style.display = "none";
      flyerPlaceholder.style.display = "flex";
      setStatus("Ajoute ton flyer dans le dossier images.");
      return;
    }

    flyerPreview.onerror = () => {
      index++;
      tryNext();
    };

    flyerPreview.onload = () => {
      flyerPreview.style.display = "block";
      flyerPlaceholder.style.display = "none";
    };

    flyerPreview.src = candidates[index];
  }

  tryNext();
}

loadFlyer();

nameInput.addEventListener("input", () => {
  namePreview.textContent = nameInput.value.trim() || "TON NOM ICI";
});

photoInput.addEventListener("change", () => {
  const file = photoInput.files && photoInput.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setStatus("Choisis un fichier image valide.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      participantImage = img;
      portraitPreview.src = reader.result;
      portraitPreview.hidden = false;
      portraitPlaceholder.style.display = "none";
      setStatus("Photo ajoutée. Ton aperçu est prêt.");
    };
    img.onerror = () => setStatus("Impossible de lire cette image.");
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawCover(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const sw = width / scale;
  const sh = height / scale;
  const sx = (image.width - sw) / 2;
  const sy = 0;
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function renderBadge() {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1600;

  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, "#080d35");
  gradient.addColorStop(.55, "#101849");
  gradient.addColorStop(1, "#070b2b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(1450, 160, 20, 1450, 160, 650);
  glow.addColorStop(0, "#45346d99");
  glow.addColorStop(1, "#45346d00");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(80, 1400, 20, 80, 1400, 600);
  glow2.addColorStop(0, "#182c75aa");
  glow2.addColorStop(1, "#182c7500");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // Flyer: complete artwork inside a tilted white frame.
  const frameX = 95;
  const frameY = 250;
  const frameW = 720;
  const frameH = 1030;

  ctx.save();
  ctx.translate(frameX + frameW / 2, frameY + frameH / 2);
  ctx.rotate(-7 * Math.PI / 180);
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "#0009";
  ctx.shadowBlur = 36;
  ctx.fillRect(-frameW / 2, -frameH / 2, frameW, frameH);
  ctx.shadowBlur = 0;

  const flyerSrc = flyerPreview.style.display !== "none" && flyerPreview.complete
    ? flyerPreview.src
    : null;

  if (flyerSrc) {
    try {
      const flyer = await loadImage(flyerSrc);
      const pad = 18;
      const maxW = frameW - pad * 2;
      const maxH = frameH - pad * 2;
      const scale = Math.min(maxW / flyer.width, maxH / flyer.height);
      const iw = flyer.width * scale;
      const ih = flyer.height * scale;
      ctx.fillStyle = "#fff";
      ctx.fillRect(-frameW / 2 + pad, -frameH / 2 + pad, maxW, maxH);
      ctx.drawImage(flyer, -iw / 2, -ih / 2, iw, ih);
    } catch {
      drawFlyerPlaceholder(ctx, frameW, frameH);
    }
  } else {
    drawFlyerPlaceholder(ctx, frameW, frameH);
  }
  ctx.restore();

  // Participant portrait on the right.
  const px = 865;
  const py = 190;
  const pw = 650;
  const ph = 810;

  if (participantImage) {
    ctx.save();
    ctx.shadowColor = "#0008";
    ctx.shadowBlur = 30;
    drawCover(ctx, participantImage, px, py, pw, ph);
    ctx.restore();

    const fade = ctx.createLinearGradient(0, py + ph * .68, 0, py + ph);
    fade.addColorStop(0, "#080d3500");
    fade.addColorStop(1, "#080d35ff");
    ctx.fillStyle = fade;
    ctx.fillRect(px, py + ph * .68, pw, ph * .32);
  } else {
    ctx.fillStyle = "#263365";
    ctx.fillRect(px + 80, py + 100, pw - 160, ph - 100);
    ctx.fillStyle = "#e8c75a";
    ctx.font = "36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("AJOUTE TA PHOTO", px + pw / 2, py + ph / 2);
  }

  const name = nameInput.value.trim() || "TON NOM ICI";
  let fontSize = 54;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "#080d35";
  ctx.shadowBlur = 12;

  while (fontSize > 28) {
    ctx.font = `700 ${fontSize}px Arial`;
    if (ctx.measureText(name).width <= 590) break;
    fontSize -= 2;
  }

  ctx.fillText(name, px + pw / 2, 1065, 590);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = "#e8c75a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px + 210, 1115);
  ctx.lineTo(px + pw - 210, 1115);
  ctx.stroke();

  ctx.save();
  ctx.fillStyle = "#e8c75a";
  ctx.textAlign = "center";
  ctx.font = "italic 100px 'Brush Script MT', 'Segoe Script', cursive";
  ctx.fillText("J’y serai !", px + pw / 2, 1240);
  ctx.restore();

  ctx.fillStyle = "#d3d7ed";
  ctx.font = "20px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    "LES BASES D’UN LEADERSHIP TRANSFORMATIONNEL ET PERSONNEL",
    W / 2,
    1535
  );

  return canvas;
}

function drawFlyerPlaceholder(ctx, width, height) {
  ctx.fillStyle = "#f8f7ff";
  ctx.fillRect(-width / 2 + 18, -height / 2 + 18, width - 36, height - 36);
  ctx.fillStyle = "#21164f";
  ctx.textAlign = "center";
  ctx.font = "bold 46px Arial";
  ctx.fillText("LEADERSHIP 101", 0, -100);
  ctx.font = "28px Arial";
  ctx.fillText("Ajoute le flyer officiel", 0, 0);
  ctx.fillText("dans le dossier images", 0, 48);
}

downloadBtn.addEventListener("click", async () => {
  downloadBtn.disabled = true;
  setStatus("Préparation du badge…");

  try {
    const canvas = await renderBadge();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));

    if (!blob) throw new Error("PNG non disponible");

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mon-badge-leadership101.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("Ton badge PNG a été téléchargé.");
  } catch (error) {
    console.error(error);
    setStatus("Erreur pendant la création. Vérifie ton flyer et ta photo.");
  } finally {
    downloadBtn.disabled = false;
  }
});

shareBtn.addEventListener("click", async () => {
  try {
    const canvas = await renderBadge();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("PNG non disponible");

    const file = new File([blob], "mon-badge-leadership101.png", {
      type: "image/png"
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: "Je participe à Leadership 101",
        text: "J’y serai !",
        files: [file]
      });
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Badge téléchargé. Tu peux maintenant le partager.");
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      setStatus("Le partage direct n’est pas disponible. Télécharge le badge.");
    }
  }
});
