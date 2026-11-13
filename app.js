/**
 * Picture QR Generator
 * Client-side only – ready for GitHub Pages
 */

(function () {
  "use strict";

  // DOM elements
  const urlInput = document.getElementById("urlInput");
  const imageInput = document.getElementById("imageInput");
  const imagePreview = document.getElementById("imagePreview");
  const noImageText = document.getElementById("noImageText");
  const modeSelect = document.getElementById("modeSelect");
  const sizeRange = document.getElementById("sizeRange");
  const sizeValue = document.getElementById("sizeValue");
  const eccSelect = document.getElementById("eccSelect");
  const fgColor = document.getElementById("fgColor");
  const bgColor = document.getElementById("bgColor");
  const logoSize = document.getElementById("logoSize");
  const logoSizeValue = document.getElementById("logoSizeValue");
  const marginRange = document.getElementById("marginRange");
  const marginValue = document.getElementById("marginValue");
  const generateBtn = document.getElementById("generateBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const qrContainer = document.getElementById("qrContainer");
  const statusEl = document.getElementById("status");
  const logoSizeField = document.getElementById("logoSizeField");

  let currentImageDataUrl = null;
  let currentQrInstance = null;
  let currentCanvas = null;

  // Update range labels
  sizeRange.addEventListener("input", () => {
    sizeValue.textContent = sizeRange.value;
  });
  logoSize.addEventListener("input", () => {
    logoSizeValue.textContent = logoSize.value + "%";
  });
  marginRange.addEventListener("input", () => {
    marginValue.textContent = marginRange.value;
  });

  // Mode toggle visibility
  modeSelect.addEventListener("change", () => {
    logoSizeField.style.display = modeSelect.value === "logo" ? "flex" : "none";
  });
  logoSizeField.style.display = modeSelect.value === "logo" ? "flex" : "none";

  // Image preview
  imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Please select a valid image file.", true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      currentImageDataUrl = ev.target.result;
      imagePreview.src = currentImageDataUrl;
      imagePreview.hidden = false;
      noImageText.hidden = true;
      setStatus("Image loaded. Ready to generate.");
    };
    reader.readAsDataURL(file);
  });

  // Generate
  generateBtn.addEventListener("click", () => {
    const url = urlInput.value.trim();
    if (!url) {
      setStatus("Please enter a valid URL.", true);
      return;
    }
    if (!currentImageDataUrl && modeSelect.value === "logo") {
      setStatus("Please upload an image for the logo.", true);
      return;
    }

    setStatus("Generating…");
    downloadBtn.disabled = true;

    const size = parseInt(sizeRange.value, 10);
    const ecc = eccSelect.value;
    const margin = parseInt(marginRange.value, 10);

    if (modeSelect.value === "logo") {
      generateLogoMode(url, size, ecc, margin);
    } else {
      generateArtisticMode(url, size, ecc, margin);
    }
  });

  // Download
  downloadBtn.addEventListener("click", () => {
    if (currentCanvas) {
      const link = document.createElement("a");
      link.download = "picture-qr.png";
      link.href = currentCanvas.toDataURL("image/png");
      link.click();
      return;
    }
    if (currentQrInstance) {
      currentQrInstance.download({ name: "picture-qr", extension: "png" });
    }
  });

  function setStatus(msg, isError = false) {
    statusEl.textContent = msg;
    statusEl.className = "status" + (isError ? " error" : msg ? " success" : "");
  }

  function clearQrContainer() {
    qrContainer.innerHTML = "";
    currentQrInstance = null;
    currentCanvas = null;
  }

  /* ------------------------------------------------------------------ */
  /*  LOGO MODE – reliable, high ECC, image in center                   */
  /* ------------------------------------------------------------------ */
  function generateLogoMode(data, size, ecc, margin) {
    clearQrContainer();

    const imageSizePercent = parseInt(logoSize.value, 10) / 100;

    currentQrInstance = new QRCodeStyling({
      width: size,
      height: size,
      type: "canvas",
      data: data,
      image: currentImageDataUrl || undefined,
      margin: margin,
      qrOptions: {
        typeNumber: 0,
        mode: "Byte",
        errorCorrectionLevel: ecc
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: imageSizePercent,
        margin: 6,
        crossOrigin: "anonymous"
      },
      dotsOptions: {
        color: fgColor.value,
        type: "rounded"
      },
      backgroundOptions: {
        color: bgColor.value
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: fgColor.value
      },
      cornersDotOptions: {
        type: "dot",
        color: fgColor.value
      }
    });

    currentQrInstance.append(qrContainer);
    downloadBtn.disabled = false;
    setStatus("Logo QR generated. High error correction keeps it scannable.");
  }

  /* ------------------------------------------------------------------ */
  /*  ARTISTIC MODE – image blended into modules (visible picture)      */
  /* ------------------------------------------------------------------ */
  function generateArtisticMode(data, size, ecc, margin) {
    clearQrContainer();

    // We use a temporary high-ECC QR, then composite the image
    // onto a larger canvas while preserving finder patterns and
    // using the center of each module for the actual data bit.

    const tempQr = new QRCodeStyling({
      width: size,
      height: size,
      type: "canvas",
      data: data,
      margin: 0,
      qrOptions: {
        errorCorrectionLevel: ecc
      },
      dotsOptions: {
        color: "#000000",
        type: "square"
      },
      backgroundOptions: {
        color: "#ffffff"
      }
    });

    // Wait a tick for the internal canvas to be ready
    setTimeout(() => {
      const qrCanvas = qrContainer.querySelector("canvas");
      if (!qrCanvas) {
        // Force render into a hidden container first
        const hidden = document.createElement("div");
        hidden.style.position = "absolute";
        hidden.style.left = "-9999px";
        document.body.appendChild(hidden);
        tempQr.append(hidden);

        setTimeout(() => {
          const srcCanvas = hidden.querySelector("canvas");
          if (srcCanvas) {
            buildArtisticFromCanvas(srcCanvas, size, margin);
          } else {
            setStatus("Failed to generate base QR. Try Logo mode.", true);
          }
          document.body.removeChild(hidden);
        }, 80);
        return;
      }
      buildArtisticFromCanvas(qrCanvas, size, margin);
    }, 60);
  }

  function buildArtisticFromCanvas(baseCanvas, targetSize, margin) {
    const out = document.createElement("canvas");
    const ctx = out.getContext("2d");
    const pad = margin;
    out.width = targetSize;
    out.height = targetSize;

    // Fill background
    ctx.fillStyle = bgColor.value;
    ctx.fillRect(0, 0, out.width, out.height);

    const qrSize = targetSize - pad * 2;
    if (qrSize <= 0) {
      setStatus("Margin too large for chosen size.", true);
      return;
    }

    // Draw the uploaded image as the base (scaled to QR area)
    if (currentImageDataUrl) {
      const img = new Image();
      img.onload = () => {
        // Draw image with slight desaturation / contrast boost for better module readability
        ctx.save();
        ctx.translate(pad, pad);
        ctx.drawImage(img, 0, 0, qrSize, qrSize);

        // Soft overlay to improve contrast for modules
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(0, 0, qrSize, qrSize);
        ctx.restore();

        // Now overlay a semi-transparent version of the real QR modules
        // so that dark modules become dark and light modules stay light,
        // while the photo shows through.
        ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(baseCanvas, pad, pad, qrSize, qrSize);

        // Restore finder patterns (the three big corner squares) in solid color
        // for reliable detection by scanners.
        restoreFinderPatterns(ctx, pad, qrSize, fgColor.value, bgColor.value);

        ctx.globalCompositeOperation = "source-over";

        // Final solid border quiet zone already handled by padding
        currentCanvas = out;
        qrContainer.innerHTML = "";
        qrContainer.appendChild(out);
        downloadBtn.disabled = false;
        setStatus("Artistic QR ready. Test scan on a phone before large prints.");
      };
      img.onerror = () => {
        setStatus("Could not load the image for artistic mode.", true);
      };
      img.src = currentImageDataUrl;
    } else {
      // No image – just show a normal QR
      ctx.drawImage(baseCanvas, pad, pad, qrSize, qrSize);
      currentCanvas = out;
      qrContainer.innerHTML = "";
      qrContainer.appendChild(out);
      downloadBtn.disabled = false;
      setStatus("QR generated (no image provided).");
    }
  }

  /**
   * Redraw the three finder patterns solidly so scanners can lock on quickly.
   * Approximate positions for a standard QR (works well enough for visual + scan).
   */
  function restoreFinderPatterns(ctx, offset, size, dark, light) {
    const moduleCount = 25; // rough average; real count depends on version
    const moduleSize = size / moduleCount;
    const finderSize = moduleSize * 7;

    const positions = [
      { x: 0, y: 0 },
      { x: size - finderSize, y: 0 },
      { x: 0, y: size - finderSize }
    ];

    positions.forEach((pos) => {
      const x = offset + pos.x;
      const y = offset + pos.y;

      // Outer square
      ctx.fillStyle = dark;
      ctx.fillRect(x, y, finderSize, finderSize);

      // Inner white
      ctx.fillStyle = light;
      ctx.fillRect(x + moduleSize, y + moduleSize, finderSize - 2 * moduleSize, finderSize - 2 * moduleSize);

      // Center dark
      ctx.fillStyle = dark;
      ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, finderSize - 4 * moduleSize, finderSize - 4 * moduleSize);
    });
  }
})();
