// Builds the staff induction certificate as a PDF (A4 landscape). Used by the induction page.
window.ehCertificate = function (d) {
  var GREEN = [62, 95, 34], ORANGE = [197, 114, 0], INK = [34, 48, 46], SOFT = [79, 93, 90], CREAM = [251, 246, 239];

  function loadImage(src) {
    return new Promise(function (res) {
      var img = new Image();
      img.onload = function () {
        var c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0);
        res({ data: c.toDataURL("image/png"), w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = function () { res(null); };
      img.src = src;
    });
  }

  return Promise.all([loadImage("/images/brand/logo.png"), loadImage("/images/brand/ndis-registered-provider.png")]).then(function (imgs) {
    var logo = imgs[0], ndis = imgs[1];
    var doc = new window.jspdf.jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    var W = 297, H = 210, cx = W / 2;
    doc.setProperties({ title: "Induction certificate - " + d.name, author: "Every Human Support Services" });

    // Background and borders
    doc.setFillColor.apply(doc, CREAM); doc.rect(0, 0, W, H, "F");
    doc.setDrawColor.apply(doc, GREEN); doc.setLineWidth(2.2); doc.rect(10, 10, W - 20, H - 20);
    doc.setDrawColor.apply(doc, ORANGE); doc.setLineWidth(0.6); doc.rect(14, 14, W - 28, H - 28);

    // Logo
    var y = 24;
    if (logo) { var lh = 30, lw = lh * logo.w / logo.h; doc.addImage(logo.data, "PNG", cx - lw / 2, y, lw, lh, "logo", "FAST"); }
    y += 42;

    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor.apply(doc, ORANGE);
    var t = "CERTIFICATE OF COMPLETION", sp = 2.2, tw = doc.getTextWidth(t) + sp * (t.length - 1);
    doc.setCharSpace(sp); doc.text(t, cx - tw / 2, y); doc.setCharSpace(0);
    y += 12;
    doc.setFont("times", "bold"); doc.setFontSize(30); doc.setTextColor.apply(doc, GREEN);
    doc.text("Staff Induction", cx, y, { align: "center" });
    y += 14;
    doc.setFont("helvetica", "normal"); doc.setFontSize(12); doc.setTextColor.apply(doc, SOFT);
    doc.text("This certifies that", cx, y, { align: "center" });
    y += 15;
    doc.setFont("times", "bold"); doc.setFontSize(34); doc.setTextColor.apply(doc, INK);
    doc.text(d.name, cx, y, { align: "center", maxWidth: W - 60 });
    doc.setDrawColor.apply(doc, ORANGE); doc.setLineWidth(0.5); doc.line(cx - 70, y + 4, cx + 70, y + 4);
    y += 14;
    doc.setFont("helvetica", "normal"); doc.setFontSize(12); doc.setTextColor.apply(doc, SOFT);
    var body = "has completed all " + d.sections + " sections of the Every Human Support Services staff induction, and agreed to follow Every Human's policies, procedures and the NDIS Code of Conduct.";
    doc.text(doc.splitTextToSize(body, 190), cx, y, { align: "center", lineHeightFactor: 1.5 });

    // Details row
    y = 168;
    var cols = [["Date completed", d.date], ["Location", d.location || "-"]];
    cols.forEach(function (c, i) {
      var x = cx + (i === 0 ? -45 : 45);
      doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor.apply(doc, INK);
      doc.text(c[1], x, y, { align: "center" });
      doc.setDrawColor.apply(doc, SOFT); doc.setLineWidth(0.3); doc.line(x - 35, y + 3, x + 35, y + 3);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor.apply(doc, SOFT);
      doc.text(c[0], x, y + 8, { align: "center" });
    });

    if (ndis) { var nh = 16, nw = nh * ndis.w / ndis.h; doc.addImage(ndis.data, "PNG", W - 24 - nw, H - 26 - nh + 4, nw, nh, "ndis", "FAST"); }
    doc.setFontSize(8.5); doc.setTextColor.apply(doc, SOFT);
    doc.text("Every Human Support Services  ·  ABN 97 652 447 544  ·  everyhuman.net.au", 24, H - 22);

    return doc.output("blob");
  });
};
