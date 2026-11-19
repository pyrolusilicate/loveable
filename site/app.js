const heart = document.querySelector("#heart");
const svgNS = "http://www.w3.org/2000/svg";
const measure = document.createElement("canvas").getContext("2d");
measure.font = "italic 13px Georgia, serif";
const colors = ["#cf898f", "#e9b4ad", "#c17a85", "#ebc9bb", "#de9799"];


function element(tag, attributes) {
  const node = document.createElementNS(svgNS, tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  return node;
}

// пересекаем горизонтали с замкнутой кривой, чтобы у каждой доли были свои строки.
const outline = Array.from({length: 360}, (_, degree) => {
  const t = degree * Math.PI / 180;
  return [19 * 16 * Math.sin(t) ** 3,
    -19 * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) - 45];
});
function render() {
  const signature = document.querySelector("h1");
  signature.classList.remove("signed");
  heart.replaceChildren();
  let phraseIndex = 0;
  let lineIndex = 0;
  function line(x, y, length, progress) {
    if (length < 13) return;
    let words = "";
    const entries = [];
    while (true) {
      const entry = translations[phraseIndex % translations.length];
      const phrase = entry.phrase;
      const next = words ? words + "  ·  " + phrase : phrase;
      if (words && measure.measureText(next).width > length * 1.08) break;
      entries.push(entry);
      words = next;
      phraseIndex++;
      if (measure.measureText(words).width >= length * .94) break;
    }
    const row = element("g", {class:"line"});
    row.style.setProperty("--tone", colors[(lineIndex*3) % colors.length]);
    row.style.setProperty("--delay", progress * 2.8 + "s");
    const scale = length / measure.measureText(words).width;
    let left = x;
    for (const [index, entry] of entries.entries()) {
      if (index) {
        const gap = measure.measureText("  ·  ").width * scale;
        const dot = element("text", {x:left + gap/2, y, "text-anchor":"middle", "aria-hidden":"true"});
        dot.textContent = "·";
        row.append(dot);
        left += gap;
      }
      const width = measure.measureText(entry.phrase).width * scale;
      const phrase = element("text", {x:left, y, textLength:width, lengthAdjust:"spacingAndGlyphs",
        role:"button", tabindex:0, "aria-haspopup":"dialog"});
      phrase.textContent = entry.phrase;
      phrase.onclick = () => showPhrase(entry);
      phrase.onkeydown = event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          showPhrase(entry);
        }
      };
      row.append(phrase);
      left += width;
    }
    heart.append(row);
    lineIndex++;
  }
  for (let y=-267; y<=277; y+=15) {
    const hits = [];
    outline.forEach(([x1,y1],i) => {
      const [x2,y2] = outline[(i+1)%outline.length];
      if ((y1>y) !== (y2>y)) hits.push(x1+(x2-x1)*(y-y1)/(y2-y1));
    });
    hits.sort((a,b) => a-b);
    for (let i=0; i<hits.length; i+=2) {
      const x = hits[i], width = hits[i+1]-x;
      line(x, y, width, (y+270)/550);
    }
  }
  const lastRow = heart.lastElementChild;
  Promise.allSettled(lastRow.getAnimations().map(animation => animation.finished)).then(() => {
    if (lastRow === heart.lastElementChild) signature.classList.add("signed");
  });
}

const card = document.querySelector("#phrase-card");
function showPhrase(entry) {
  document.querySelector("#card-phrase").textContent = entry.phrase;
  document.querySelector("#card-language").textContent = entry.language ?? "";
  card.showModal();
}
document.querySelector("#signature").onclick = () => showPhrase({phrase: "а это мой язык любви"});
card.onclick = event => {
  if (event.target !== card) return;
  const box = card.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right ||
      event.clientY < box.top || event.clientY > box.bottom) card.close();
};

document.querySelector("#replay").onclick = render;

// проверка для игрового входа в статическую открытку
function wordCode(value) {
  let hash = 2166136261;
  for (const symbol of value.trim().normalize("NFC").toLocaleLowerCase("ru")) {
    hash = Math.imul(hash ^ symbol.codePointAt(0), 16777619);
  }
  return hash >>> 0;
}

const word = document.querySelector("#word");
const feedback = document.querySelector("#feedback");
const stars = document.querySelector("#stars");
word.oninput = () => {
  stars.textContent = "*".repeat(Array.from(word.value).length);
  word.removeAttribute("aria-invalid");
  feedback.textContent = "";
};
document.querySelector("#unlock").onsubmit = event => {
  event.preventDefault();
  if (wordCode(word.value) !== 941626108) {
    feedback.textContent = "попробуй еще раз";
    word.setAttribute("aria-invalid", "true");
    word.focus();
    word.select();
    return;
  }
  word.value = "";
  stars.textContent = "";
  document.querySelector("#entry").hidden = true;
  document.querySelector("main").hidden = false;
  document.querySelector("footer").hidden = false;
  document.querySelector("#replay").focus({preventScroll:true});
  render();
};
