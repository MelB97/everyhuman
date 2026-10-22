// Site builder settings. Netlify runs this automatically when anything changes.
import path from "node:path";
import fs from "node:fs";
import Image from "@11ty/eleventy-img";

// Photos uploaded through the editor are saved under src/images/uploads and
// referenced as /images/uploads/... — turn that into a file on disk.
function localPath(src) {
  if (!src) return null;
  const clean = String(src).split("?")[0];
  const p = clean.startsWith("/") ? path.join("src", clean) : clean;
  return fs.existsSync(p) ? p : null;
}

async function makeImage(src, widths, formats = ["webp", "jpeg"]) {
  const file = localPath(src);
  if (!file) return null;
  return Image(file, {
    widths,
    formats,
    outputDir: "_site/img/",
    urlPath: "/img/",
    sharpJpegOptions: { quality: 78, mozjpeg: true },
    sharpWebpOptions: { quality: 76 },
  });
}

const byOrder = (a, b) => (a.data.order ?? 99) - (b.data.order ?? 99) || String(a.data.title).localeCompare(String(b.data.title));

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    "src/css": "css",
    "src/js": "js",
    "src/fonts": "fonts",
    "src/videos": "videos",
    "src/images/brand": "images/brand",
    "src/images/share.jpg": "images/share.jpg",
  });

  // {% img src, alt, sizes, class, eager %} — resized, compressed, modern-format photos
  eleventyConfig.addAsyncShortcode("img", async (src, alt = "", sizes = "100vw", cls = "", eager = false) => {
    const meta = await makeImage(src, [240, 480, 960, 1400]);
    if (!meta) return "";
    const attrs = { alt, sizes, loading: eager ? "eager" : "lazy", decoding: "async" };
    if (cls) attrs.class = cls;
    if (eager) attrs.fetchpriority = "high";
    return Image.generateHTML(meta, attrs);
  });

  // Logo keeps its transparent background (PNG/WebP, no JPEG). SVG logos are used as they are.
  eleventyConfig.addAsyncShortcode("logo", async (src, alt = "", cls = "") => {
    if (!src) return "";
    if (String(src).toLowerCase().endsWith(".svg")) return `<img src="${src}" alt="${alt}" class="${cls}">`;
    const meta = await makeImage(src, [240, 480], ["webp", "png"]);
    if (!meta) return "";
    return Image.generateHTML(meta, { alt, sizes: "240px", loading: "eager", decoding: "async", class: cls });
  });

  // Full web address of a 1200px JPEG, for Google and link previews
  eleventyConfig.addAsyncFilter("shareImage", async (src, siteUrl) => {
    const meta = await makeImage(src, [1200], ["jpeg"]);
    if (!meta) return siteUrl + "/images/share.jpg";
    return siteUrl + meta.jpeg[0].url;
  });

  eleventyConfig.addCollection("services", (api) => api.getFilteredByGlob("src/services/*.md").sort(byOrder));
  eleventyConfig.addCollection("locations", (api) => api.getFilteredByGlob("src/locations/*.md").sort(byOrder));

  // Team: one file per person in src/team. Office team first, then everyone else, A to Z by name.
  eleventyConfig.addCollection("team", (api) =>
    api
      .getFilteredByGlob("src/team/*.md")
      .filter((p) => p.data.show !== false)
      .sort((a, b) => {
        const ga = a.data.team === "Office team" ? 0 : 1;
        const gb = b.data.team === "Office team" ? 0 : 1;
        return ga - gb || String(a.data.name).localeCompare(String(b.data.name));
      })
  );

  eleventyConfig.addFilter("inLocation", (team, loc) =>
    (team || []).filter((t) => t.data.location === loc || t.data.location === "All locations")
  );
  eleventyConfig.addFilter("initials", (name) =>
    String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("")
  );
  // A steady colour per person for their initials circle, so it doesn't change between builds
  eleventyConfig.addFilter("tint", (name) => {
    let h = 0;
    for (const c of String(name || "")) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return "tint-" + (h % 4);
  });
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("abn", (n) => String(n || "").replace(/\D/g, "").replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3 $4"));
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("telLink", (phone) => "tel:" + String(phone || "").replace(/[^\d+]/g, ""));
  eleventyConfig.addFilter("intlPhone", (phone) => {
    const d = String(phone || "").replace(/\D/g, "");
    if (d.startsWith("1")) return "+61" + d; // 1800 and 1300 numbers
    return d.startsWith("0") ? "+61" + d.slice(1) : "+" + d;
  });
  eleventyConfig.addFilter("hasPhone", (phone) => /\d{6,}/.test(String(phone || "").replace(/\s/g, "")));
  eleventyConfig.addFilter("slug", (s) =>
    String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  );
  // Business details for Google (LocalBusiness schema)
  eleventyConfig.addFilter("bizSchema", (site, home, locations) => {
    const digits = String(site.phone || "").replace(/\D/g, "");
    const biz = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": site.url + "/#business",
      name: site.business_name,
      alternateName: ["Every Human", "Every Human Disability Services"],
      url: site.url + "/",
      email: site.email,
      image: site.url + "/images/share.jpg",
      description: home.seo_description,
      slogan: site.tagline,
      taxID: site.abn,
      address: { "@type": "PostalAddress", addressLocality: "Port Kembla", addressRegion: "NSW", postalCode: "2505", addressCountry: "AU" },
      areaServed: (locations || []).map((l) => ({ "@type": "Place", name: `${l.data.area}, ${l.data.state}` })),
      knowsAbout: ["NDIS support", "Aged care at home", "Personal care", "Community participation", "Life skills development", "Household tasks", "Disability transport"],
    };
    if (digits.length >= 6) biz.telephone = "+61" + (digits.startsWith("0") ? digits.slice(1) : digits);
    if (site.facebook) biz.sameAs = [site.facebook];
    return biz;
  });
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v).replace(/</g, "\\u003c"));
  eleventyConfig.addFilter("year", () => new Date().getFullYear());

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
