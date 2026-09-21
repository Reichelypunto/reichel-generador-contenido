import { useState, useRef, useEffect, useCallback } from "react";

const GF = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Qwitcher+Grypen&family=Outfit:wght@400;500;700&display=swap";
const W = 1080, H = 1350, AVR = 40, pad = 90;

/* ---------- Perfil de marca de cada alumna (se guarda en su navegador) ---------- */
const PROFILE_DEFAULT = {
  nombre:"", handle:"", negocio:"", audiencia:"", tono:"Directo, adulto y cercano",
  genero:"femenino", persona:"yo", idioma:"España", evitar:"", firma:"", cta:"",
  color:"#a3134b", colorOscuro:"#0e2e64"
};
let PROFILE = Object.assign({}, PROFILE_DEFAULT);
function hex2rgb(h){h=(h||"").replace("#","");return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function rgb2hex(r,g,b){return "#"+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("");}
function mix(h1,h2,t){const a=hex2rgb(h1),b=hex2rgb(h2);return rgb2hex(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t);}
function lum(h){const c=hex2rgb(h).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2];}
function monograma(label){const w=(label||"").replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9 ]/g," ").trim().split(/\s+/).filter(Boolean);return (w.length>1?w.map(x=>x[0]).join("").slice(0,3):(w[0]||"·").slice(0,2)).toUpperCase();}

const BRANDS = {
  rrss: { label: "Tu marca", handle: "@tumarca", accent: "#a3134b", border: "#e8a0b4", light: "#faf6ef", titleFont: "'Fraunces', serif", accentFont: "'Qwitcher Grypen', cursive", accentStyle: "400", accentSize: 130, pair: ["#A3134B","#FCF2E6"] },
  kr:   { label: "Tu marca", handle: "@tumarca", accent: "#c9a96e", border: "#7aa0d4", light: "#edf3fb", titleFont: "'Cormorant Garamond', serif", accentFont: "'Amiri', serif", accentStyle: "italic 400", accentSize: 96, pair: ["#0e2e64","#f8ede1"], dark:"#0e2e64", dark2:"#2a5298", darker:"#071b3d" },
};
function applyProfile(p){
  PROFILE = Object.assign({}, PROFILE_DEFAULT, p||{});
  const ok = v => /^#[0-9a-f]{6}$/i.test(v||"");
  const c = ok(PROFILE.color)?PROFILE.color:PROFILE_DEFAULT.color;
  const d = ok(PROFILE.colorOscuro)?PROFILE.colorOscuro:PROFILE_DEFAULT.colorOscuro;
  const nm = (PROFILE.nombre||"").trim() || "Tu marca";
  const hd = (PROFILE.handle||"").trim() || nm;
  const R=BRANDS.rrss, K=BRANDS.kr;
  R.label=nm; R.handle=hd; R.accent=c; R.border=mix(c,"#ffffff",0.55); R.pair=[c.toUpperCase(),"#FCF2E6"];
  K.label=nm; K.handle=hd; K.dark=d; K.dark2=mix(d,"#ffffff",0.2); K.darker=mix(d,"#000000",0.45);
  K.accent = lum(c)<0.25 ? mix(c,"#ffffff",0.6) : c;   // sobre fondo oscuro necesita ser claro
  K.border = mix(d,"#ffffff",0.55); K.light = mix(d,"#ffffff",0.93); K.pair=[d,"#f8ede1"];
}

const FORMATOS    = ["Carrusel","Reel","Post-Caption","Stories","Email"];
const INTENCIONES = ["Posicionamiento","Autoridad","Venta Sutil"];
const ESTILOS     = ["Negativo","Info Secreta","Controversial"];
const MOTORES     = ["Aspiración","Educación","Impacto","Reflejo"];

/* ---------- ZIP nativo (sin librerías, método STORE) ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return t;
})();
function crc32(d){ let c = 0xFFFFFFFF; for (let i = 0; i < d.length; i++) c = CRC_TABLE[(c ^ d[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function buildZip(files){
  const enc = new TextEncoder();
  const u16 = v => new Uint8Array([v & 255, (v >> 8) & 255]);
  const u32 = v => new Uint8Array([v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]);
  const parts = []; const central = []; let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name); const crc = crc32(f.data);
    parts.push(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(f.data.length), u32(f.data.length), u16(name.length), u16(0), name, f.data);
    central.push({ name, crc, size: f.data.length, offset });
    offset += 30 + name.length + f.data.length;
  }
  const cdStart = offset; let cdLen = 0;
  for (const e of central) {
    parts.push(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(e.crc), u32(e.size), u32(e.size), u16(e.name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(e.offset), e.name);
    cdLen += 46 + e.name.length;
  }
  parts.push(u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length), u32(cdLen), u32(cdStart), u16(0));
  return new Blob(parts, { type: "application/zip" });
}
function slugify(s){
  return String(s||"").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40);
}
async function dlZip(refs, total, brand, fileName, setStatus, slides){
  try {
    setStatus("Empaquetando... no cambies de pestaña");
    const files = [];
    let skipped = 0;
    for (let i = 0; i < total; i++) {
      if (slides && slides[i] && slides[i].bgVideoURL) { skipped++; continue; }
      const c = refs[i]; if (!c) continue;
      const blob = await new Promise(res => c.toBlob(res, "image/png"));
      files.push({ name: "slide-" + (i + 1) + ".png", data: new Uint8Array(await blob.arrayBuffer()) });
    }
    if (!files.length) { setStatus(skipped?"Solo hay slides de vídeo, descárgalas una a una":""); return; }
    const zip = buildZip(files);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(zip);
    const base = slugify(fileName) || "carrusel";
    a.download = base + ".zip";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    setStatus(skipped ? "✓ ZIP con las fotos ("+skipped+" slide(s) de vídeo aparte, descárgalas con su botón 🎬)" : "✓ Descargado, ya puedes cambiar de pestaña");
    setTimeout(() => setStatus(""), skipped?6000:3500);
  } catch (e) { setStatus("Error"); setTimeout(() => setStatus(""), 2500); }
}
/* -------------------------------------------------------------- */

function parseContent(raw) {
  const allLines = String(raw||"").split("\n").map(l => l.trim());
  const lines = allLines.filter(Boolean);
  const bulletRe = /^[•\-\*]\s+(.+)/;
  const stepRe   = /^(\d+)[.)]\s+(.+)/;
  const bullets = lines.filter(l => bulletRe.test(l)).map(l => l.match(bulletRe)[1]);
  const steps   = lines.filter(l => stepRe.test(l)).map(l => ({ n: l.match(stepRe)[1], t: l.match(stepRe)[2] }));
  const plain   = lines.filter(l => !bulletRe.test(l) && !stepRe.test(l)).join(" ");
  if (steps.length >= 2)   return { type: "steps",   items: steps,   plain };
  if (bullets.length >= 2) return { type: "bullets", items: bullets, plain };
  // Se conservan los saltos de línea y las líneas en blanco (aire)
  return { type: "plain", text: allLines.join("\n") };
}

function drawPaper(ctx, w, h) {
  ctx.fillStyle = "#faf6ef"; ctx.fillRect(0,0,w,h);
  const id = ctx.getImageData(0,0,w,h); const d = id.data;
  for (let i=0;i<d.length;i+=4){const n=(Math.random()-.5)*14;d[i]=Math.min(255,Math.max(0,d[i]+n));d[i+1]=Math.min(255,Math.max(0,d[i+1]+n));d[i+2]=Math.min(255,Math.max(0,d[i+2]+n));}
  ctx.putImageData(id,0,0);
  const v=ctx.createRadialGradient(w/2,h/2,h*.3,w/2,h/2,h*.8);
  v.addColorStop(0,"rgba(0,0,0,0)");v.addColorStop(1,"rgba(0,0,0,0.06)");
  ctx.fillStyle=v;ctx.fillRect(0,0,w,h);
}

function drawKRBg(ctx, w, h, idx, total) {
  // Alternas: impares azul, pares crema. Última siempre azul.
  const isBlue = (idx % 2 === 0) || (idx === total - 1);
  if(isBlue){
    const gr = ctx.createLinearGradient(0,0,0,h);
    gr.addColorStop(0,BRANDS.kr.dark);
    gr.addColorStop(1,BRANDS.kr.dark2);
    ctx.fillStyle=gr;ctx.fillRect(0,0,w,h);
  } else {
    ctx.fillStyle="#f8ede1";ctx.fillRect(0,0,w,h);
    const v=ctx.createRadialGradient(w/2,h/2,h*.3,w/2,h/2,h*.8);
    v.addColorStop(0,"rgba(0,0,0,0)");v.addColorStop(1,"rgba(0,0,0,0.04)");
    ctx.fillStyle=v;ctx.fillRect(0,0,w,h);
  }
  return isBlue;
}

function wrap(ctx, text, maxW) {
  const words=String(text||"").split(" ");const lines=[];let line="";
  for(const w of words){const t=line?line+" "+w:w;if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=w;}else line=t;}
  if(line)lines.push(line);return lines;
}

/* ---------- Texto enriquecido: **negrita**, *cursiva*, ++énfasis grande++, saltos de línea ---------- */
function parseInline(text, base){
  base = base || {b:false,i:false,big:false,u:false,color:null,box:null};
  const segs=[]; const re=/(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(\+\+([^+]+)\+\+)|(~([^~]+)~)|(\{#([0-9a-fA-F]{6})\}([^{]*)\{\/\})|(\[\[([^\]]+)\]\])|(\{\{([^}]+)\}\})/g;
  let last=0,m;
  while((m=re.exec(text))){
    if(m.index>last) segs.push(Object.assign({t:text.slice(last,m.index)},base));
    let inner, patch;
    if(m[2]!==undefined){ inner=m[2]; patch={b:true}; }
    else if(m[4]!==undefined){ inner=m[4]; patch={i:true}; }
    else if(m[6]!==undefined){ inner=m[6]; patch={i:true}; }
    else if(m[8]!==undefined){ inner=m[8]; patch={big:true}; }
    else if(m[10]!==undefined){ inner=m[10]; patch={u:true}; }
    else if(m[13]!==undefined){ inner=m[13]; patch={color:"#"+m[12]}; }
    else if(m[15]!==undefined){ inner=m[15]; patch={box:"normal"}; }
    else { inner=m[17]; patch={box:"invert"}; }
    // Recursivo: un marcador puede contener otro dentro (ej. ++**texto**++),
    // así que el contenido interior se vuelve a analizar heredando las marcas
    // ya activas, en vez de tratarse como texto literal.
    segs.push(...parseInline(inner, Object.assign({},base,patch)));
    last=re.lastIndex;
  }
  if(last<text.length) segs.push(Object.assign({t:text.slice(last)},base));
  return segs;
}
function tokenizeFull(text){
  // Recorre TODO el bloque de texto de una vez (no línea a línea), para que un
  // *asterisco* de apertura y uno de cierre se encuentren aunque haya un salto
  // de párrafo entre medias. Devuelve una secuencia plana de palabras (con su
  // negrita/cursiva/énfasis ya resueltos) intercalada con marcadores de salto
  // de línea ("\n" real), que layoutRich usa para reconstruir filas y huecos.
  const toks=[];
  for(const seg of parseInline(String(text||""))){
    const pieces = seg.t.match(/\n|[^\s]+/g) || [];
    for(const piece of pieces){
      if(piece==="\n") toks.push({brk:true});
      else toks.push({w:piece,b:seg.b,i:seg.i,big:seg.big,u:seg.u,color:seg.color,box:seg.box});
    }
  }
  return toks;
}
function fnt(size,family,weight){return weight+" "+size+"px "+family;}
/* La cursiva se genera SIEMPRE inclinando la fuente de marca real (nunca se pide
   la variante italic al navegador, que puede caer a una serif genérica) */
const BIG_SCALE = 1.32; // tamaño del énfasis ++texto++ respecto al texto base de la slide
function layoutRich(ctx,text,maxW,size,family,baseWeight){
  const rows=[];
  let line=[],lineW=0,lineBig=false;
  function flushLine(){
    if(line.length){ rows.push({tokens:line,width:lineW,big:lineBig}); line=[];lineW=0;lineBig=false; }
  }
  for(const tok of tokenizeFull(text)){
    if(tok.brk){
      if(line.length===0){ rows.push({gap:true}); }
      else { flushLine(); }
      continue;
    }
    const tSize = tok.big ? Math.round(size*BIG_SCALE) : size;
    ctx.font=fnt(tSize,family,tok.b?700:baseWeight);
    const wW=ctx.measureText(tok.w).width + (tok.i?tSize*0.06:0);
    const sW=line.length?ctx.measureText(" ").width:0;
    if(line.length&&lineW+sW+wW>maxW){rows.push({tokens:line,width:lineW,big:lineBig});line=[];lineW=0;lineBig=false;}
    else if(line.length){lineW+=sW;}
    line.push({w:tok.w,b:tok.b,i:tok.i,big:tok.big,u:tok.u,color:tok.color,box:tok.box,size:tSize,width:wW});
    lineW+=wW; if(tok.big)lineBig=true;
  }
  flushLine();
  while(rows.length&&rows[0].gap)rows.shift();
  while(rows.length&&rows[rows.length-1].gap)rows.pop();
  return rows;
}
function richHeight(rows,lh){return rows.reduce((h,r)=>h+(r.gap?Math.round(lh*0.55):(r.big?Math.round(lh*BIG_SCALE):lh)),0);}
/* Reduce el tamaño de letra automáticamente hasta que el bloque quepa en maxH.
   Nunca supera baseSize (el tamaño pedido o ajustado a mano); solo encoge si hace falta. */
function fitRich(ctx,text,maxW,maxH,baseSize,lhRatio,family,weight){
  let size=Math.round(baseSize);
  const minSize=Math.max(20,Math.round(baseSize*0.5));
  let rows,lh,h;
  while(size>=minSize){
    lh=Math.round(size*lhRatio);
    rows=layoutRich(ctx,text,maxW,size,family,weight);
    h=richHeight(rows,lh);
    if(h<=maxH||size<=minSize)break;
    size-=2;
  }
  return {size,rows,lh,height:h};
}
function drawRich(ctx,rows,x,y,maxW,size,lh,family,baseWeight,color,align,lineOffsets,boxesOut,boxPair){
  let cy=y;
  ctx.textAlign="left";
  let rowIdx=0;
  const pair = boxPair || ["#333333","#f5f5f5"];
  for(const r of rows){
    if(r.gap){cy+=Math.round(lh*0.55);continue;}
    const off = (lineOffsets&&lineOffsets[rowIdx]) || {x:0,y:0};
    const rowH = r.big?Math.round(lh*BIG_SCALE):lh;
    let cx = (align==="center" ? x+(maxW-r.width)/2 : x) + off.x;
    const rowY = cy + off.y;
    if(boxesOut) boxesOut.push({index:rowIdx, x0:cx, y0:rowY-rowH*0.78, x1:cx+r.width, y1:rowY+rowH*0.22});

    // Caja de fondo [[así]]: solo dentro de esta fila (si una frase marcada
    // se parte en varias líneas, cada línea saca su propia caja — más simple
    // y más fiable que fusionar entre líneas, a propósito).
    if(r.tokens.some(t=>t.box)){
      let mx=cx;
      const pos=[];
      for(let k=0;k<r.tokens.length;k++){
        const tok=r.tokens[k];
        pos.push({x0:mx,x1:mx+tok.width,box:tok.box,tSize:tok.size||size});
        mx+=tok.width;
        if(k<r.tokens.length-1){
          ctx.font=fnt(r.tokens[k+1].size||size,family,r.tokens[k+1].b?700:baseWeight);
          mx+=ctx.measureText(" ").width;
        }
      }
      let ri=0;
      while(ri<pos.length){
        if(!pos[ri].box){ri++;continue;}
        let rj=ri;
        while(rj+1<pos.length && pos[rj+1].box===pos[ri].box) rj++;
        const maxTSize=Math.max(...pos.slice(ri,rj+1).map(p=>p.tSize));
        const padX=maxTSize*0.28, padY=maxTSize*0.22;
        const boxH=maxTSize*1.0+padY*2;
        const radius=Math.min(boxH*0.35,26);
        ctx.fillStyle = pos[ri].box==="invert" ? pair[1] : pair[0];
        ctx.beginPath();
        const bx0=pos[ri].x0-padX, by0=rowY-maxTSize*0.78-padY, bw=(pos[rj].x1-pos[ri].x0)+padX*2, bh=boxH;
        if(ctx.roundRect) ctx.roundRect(bx0,by0,bw,bh,radius); else ctx.rect(bx0,by0,bw,bh);
        ctx.fill();
        ri=rj+1;
      }
    }

    for(let k=0;k<r.tokens.length;k++){
      const tok=r.tokens[k];
      const tSize = tok.size || size;
      const tColor = tok.box ? (tok.box==="invert" ? pair[0] : pair[1]) : (tok.color || color);
      ctx.font=fnt(tSize,family,tok.b?700:baseWeight);
      ctx.fillStyle=tColor;
      if(tok.i){
        // Cursiva: misma fuente de marca, inclinada 12°
        ctx.save();
        ctx.translate(cx,rowY);
        ctx.transform(1,0,-0.21,1,0,0);
        ctx.fillText(tok.w,0,0);
        ctx.restore();
      } else {
        ctx.fillText(tok.w,cx,rowY);
      }
      if(tok.u){
        ctx.save();
        ctx.strokeStyle=tColor;
        ctx.lineWidth=Math.max(2,tSize*0.045);
        ctx.beginPath();
        const uy=rowY+tSize*0.14;
        ctx.moveTo(cx,uy); ctx.lineTo(cx+tok.width-(tok.i?tSize*0.06:0),uy);
        ctx.stroke();
        ctx.restore();
      }
      cx+=tok.width;
      if(k<r.tokens.length-1){
        const nt=r.tokens[k+1];
        ctx.font=fnt(nt.size||size,family,nt.b?700:baseWeight);
        cx+=ctx.measureText(" ").width;
      }
    }
    cy+=rowH;
    rowIdx++;
  }
  return cy;
}
/* ------------------------------------------------------------------------------- */

function drawAv(ctx, img, cx, cy, r, col) {
  if(!img)return;
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();ctx.drawImage(img,cx-r,cy-r,r*2,r*2);ctx.restore();
  ctx.strokeStyle=col;ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
}

function drawProgress(ctx, idx, total, accent, onDark) {
  // Indicador discreto: puntos pequeños arriba a la derecha
  const r = 5, gap = 18;
  const totalW = (total - 1) * gap;
  const x0 = W - pad - totalW, y = 52;
  for (let i = 0; i < total; i++) {
    ctx.beginPath(); ctx.arc(x0 + i * gap, y, r, 0, Math.PI * 2);
    if (i === idx) { ctx.fillStyle = onDark ? "rgba(255,255,255,0.85)" : accent; }
    else { ctx.fillStyle = onDark ? "rgba(255,255,255,0.28)" : "rgba(26,16,16,0.15)"; }
    ctx.fill();
  }
}

function drawSlide(canvas, {slide, idx, total, brand, avatarImg, bgVideoEl}) {
  const ctx = canvas.getContext("2d");
  canvas.width=W; canvas.height=H;
  ctx.clearRect(0,0,W,H); // limpieza explícita adicional, por si acaso
  if(canvas) canvas.__rowBoxes = [];
  const b = BRANDS[brand];
  const isHero = idx===0, isCTA = idx===total-1;
  const bgSource = bgVideoEl || slide.bgImg;
  const hasBg = !!bgSource;
  const isKR = brand==="kr";

  let isKRBlue = false;
  if(hasBg){
    const img=bgSource;
    const srcW = bgVideoEl ? bgVideoEl.videoWidth : img.width;
    const srcH = bgVideoEl ? bgVideoEl.videoHeight : img.height;
    if(srcW&&srcH){
      const sc=Math.max(W/srcW,H/srcH);
      const drawW=srcW*sc, drawH=srcH*sc;
      // Margen disponible para reencuadrar (arrastrar) sin dejar huecos vacíos
      const maxOffX=Math.max(0,(drawW-W)/2), maxOffY=Math.max(0,(drawH-H)/2);
      const iox=Math.max(-maxOffX,Math.min(maxOffX,slide.imgOffsetX||0));
      const ioy=Math.max(-maxOffY,Math.min(maxOffY,slide.imgOffsetY||0));
      ctx.drawImage(img,(W-drawW)/2+iox,(H-drawH)/2+ioy,drawW,drawH);
    }
    ctx.fillStyle="rgba(0,0,0,0.42)";ctx.fillRect(0,0,W,H);
  } else if(isKR){
    isKRBlue = drawKRBg(ctx,W,H,idx,total);
  } else {
    drawPaper(ctx,W,H);
  }

  const onDark = hasBg || (isKR && isKRBlue);
  const tc  = slide.textColor || (onDark ? (isKR?"#f0e8d8":"#ffffff") : "#1a1010");
  const sc2 = onDark ? (isKR?"rgba(240,232,216,0.55)":"rgba(255,255,255,0.55)") : "#6a4a4a";

  // Marca de agua discreta en todas las slides con el @ de la alumna
  if(isKR){
    ctx.font="400 36px 'Cormorant Garamond', serif";
    ctx.fillStyle=onDark?"rgba(240,232,216,0.5)":"rgba(26,16,16,0.25)";
    ctx.textAlign="center";
    ctx.fillText(b.handle, W/2, H-pad);
  } else {
    ctx.font="400 28px 'Outfit', sans-serif";
    ctx.fillStyle=sc2;
    ctx.textAlign="center";
    ctx.fillText(b.handle, W/2, H-pad);
  }

  drawProgress(ctx, idx, total, b.accent, onDark);

  // Avatar pequeño flotante arriba, centrado — sin línea, sin interrumpir la foto
  const avCY = AVR+46;
  const showAv = slide.showAvatar!==false && !isKR && !!avatarImg;
  if(showAv){
    drawAv(ctx,avatarImg,W/2,avCY,AVR,onDark?"rgba(255,255,255,0.8)":b.border);
  }

  const cTop = showAv ? avCY+AVR+44 : 80;
  const cHeight = H-80-cTop;
  // "Copy exacto" promete texto literal: nunca reinterpretar "6." / "• " como
  // pasos o viñetas visuales, aunque el patrón coincida por casualidad.
  const parsed = slide.literalFormat
    ? { type:"plain", text: String(slide.text||"").split("\n").map(l=>l.trim()).join("\n") }
    : parseContent(slide.text||"");

  const adj = slide.sizeAdj || 1;
  // Desplazamiento manual del texto dentro de la slide (arrastrando sobre el
  // canvas), para no tapar caras u otros elementos importantes de una foto de fondo.
  const oy = slide.offsetY || 0;
  const ox = slide.offsetX || 0;
  const padX = pad + ox;
  // Tipografía del titular: puede sobreescribirse por slide (cualquier fuente
  // de Google Fonts, cargada dinámicamente); si no, usa la de la marca.
  const uf = slide.titleFont || b.titleFont;
  // Peso de letra del texto normal (no el titular en negrita de la portada):
  // por defecto 400, pero se puede subir a un peso intermedio para mejorar la
  // legibilidad sobre fotos, sin llegar a negrita real (que se reserva para
  // el marcador **así** y para el contraste del CTA).
  const baseW = slide.weightOverride || 400;

  if(isHero){
    ctx.textAlign="left";
    // El acento (script) se calcula ANTES para escalarlo con el mismo % que el titular
    let scriptH=0, alines=[], accentSizeUsed=0, alh=0, aOffset=0;
    if(slide.acento){
      accentSizeUsed = Math.round(b.accentSize*adj);
      alh = Math.round((isKR?100:130)*adj);
      aOffset = Math.round((isKR?88:108)*adj);
      ctx.font=`${b.accentStyle} ${accentSizeUsed}px ${b.accentFont}`;
      alines = wrap(ctx, slide.acento, W-pad*2);
      scriptH = alines.length*alh + (aOffset-alh); // aproxima el hueco real que ocupa el bloque
    }
    const fit=fitRich(ctx,slide.text,W-pad*2,cHeight-scriptH,100*adj,1.18,uf,700);
    const {rows,size:titleSize,lh:lhF,height:titleH}=fit;
    const totalH=titleH+scriptH;
    const startY=cTop+(cHeight-totalH)/2+oy;

    // Cada línea del titular se puede arrastrar por separado (slide.lineOffsets[i] = {x,y})
    const rowBoxes=[];
    drawRich(ctx,rows,padX,startY,W-pad*2,titleSize,lhF,uf,700,tc,"left",slide.lineOffsets,rowBoxes,b.pair);
    if(canvas) canvas.__rowBoxes = rowBoxes;

    if(slide.acento){
      ctx.font=`${b.accentStyle} ${accentSizeUsed}px ${b.accentFont}`;
      ctx.fillStyle=tc;
      alines.forEach((l,i)=>{
        const rowIdx=rows.length+i; // continúa la numeración de líneas tras el titular
        const lineOff=(slide.lineOffsets&&slide.lineOffsets[rowIdx])||{x:0,y:0};
        const lx=(isKR?pad:pad-8)+ox+lineOff.x;
        const ly=startY+titleH+aOffset+i*alh+lineOff.y;
        ctx.fillText(l, lx, ly);
        const w=ctx.measureText(l).width;
        rowBoxes.push({index:rowIdx, x0:lx, y0:ly-alh*0.8, x1:lx+w, y1:ly+alh*0.25});
      });
    }

  } else if(isCTA){
    const fit=fitRich(ctx,slide.text,W-pad*2,cHeight,58*adj,1.31,uf,baseW);
    const {rows,size:ctaSize,lh,height:bH}=fit;
    const sY=cTop+(cHeight-bH)/2+oy;
    const rowBoxes=[];
    drawRich(ctx,rows,padX,sY,W-pad*2,ctaSize,lh,uf,baseW,tc,"center",slide.lineOffsets,rowBoxes,b.pair);
    if(canvas) canvas.__rowBoxes = rowBoxes;

  } else if(parsed.type==="steps"){
    const introSize=Math.round(48*adj), itemSize=Math.round(50*adj), slh=Math.round(64*adj), sg=Math.round(36*adj), circR=Math.round(28*adj);
    const introRows = parsed.plain ? layoutRich(ctx,parsed.plain,W-pad*2,introSize,"'Outfit', sans-serif",500) : [];
    const introLh=Math.round(58*adj);
    const introH = introRows.length ? richHeight(introRows,introLh)+40 : 0;
    const stepRows = parsed.items.map(s=>layoutRich(ctx,s.t,W-pad*2-80,itemSize,uf,baseW));
    let totalH=0;
    stepRows.forEach(r=>{ totalH+=richHeight(r,slh)+sg; });
    let cy=cTop+(cHeight-(introH+totalH))/2+oy;
    ctx.textAlign="left";
    if(introRows.length){ drawRich(ctx,introRows,padX,cy,W-pad*2,introSize,introLh,"'Outfit', sans-serif",500,sc2,"left"); cy+=introH; }
    parsed.items.forEach((s,si)=>{
      ctx.fillStyle=b.accent;ctx.beginPath();ctx.arc(padX+circR,cy-circR,circR,0,Math.PI*2);ctx.fill();
      ctx.font="600 "+Math.round(28*adj)+"px 'Outfit', sans-serif";ctx.fillStyle="#ffffff";ctx.textAlign="center";ctx.fillText(s.n,padX+circR,cy-circR+10);
      drawRich(ctx,stepRows[si],padX+circR*2+18,cy,W-pad*2-(circR*2+18),itemSize,slh,uf,baseW,tc,"left",null,null,b.pair);
      cy+=richHeight(stepRows[si],slh)+sg;
    });

  } else if(parsed.type==="bullets"){
    const introSize=Math.round(48*adj), itemSize=Math.round(50*adj), blh=Math.round(64*adj), bg=Math.round(24*adj), dotR=Math.round(10*adj);
    const introRows = parsed.plain ? layoutRich(ctx,parsed.plain,W-pad*2,introSize,"'Outfit', sans-serif",500) : [];
    const introLh=Math.round(58*adj);
    const introH = introRows.length ? richHeight(introRows,introLh)+40 : 0;
    const itemRows = parsed.items.map(item=>layoutRich(ctx,item,W-pad*2-55,itemSize,uf,baseW));
    let totalH=0;
    itemRows.forEach(r=>{ totalH+=richHeight(r,blh)+bg; });
    let cy=cTop+(cHeight-(introH+totalH))/2+oy;
    ctx.textAlign="left";
    if(introRows.length){ drawRich(ctx,introRows,padX,cy,W-pad*2,introSize,introLh,"'Outfit', sans-serif",500,sc2,"left"); cy+=introH; }
    parsed.items.forEach((item,bi)=>{
      ctx.fillStyle=b.accent;ctx.beginPath();ctx.arc(padX+14,cy-16,dotR,0,Math.PI*2);ctx.fill();
      drawRich(ctx,itemRows[bi],padX+42,cy,W-pad*2-55,itemSize,blh,uf,baseW,tc,"left",null,null,b.pair);
      cy+=richHeight(itemRows[bi],blh)+bg;
    });

  } else {
    const fit=fitRich(ctx,parsed.text,W-pad*2,cHeight,54*adj,1.41,uf,baseW);
    const {rows,size:bodySize,lh,height:bH}=fit;
    const sY=cTop+(cHeight-bH)/2+oy;
    const rowBoxes=[];
    drawRich(ctx,rows,padX,sY,W-pad*2,bodySize,lh,uf,baseW,tc,"left",slide.lineOffsets,rowBoxes,b.pair);
    if(canvas) canvas.__rowBoxes = rowBoxes;
  }

  // Stickers (emoji o imagen recortada): capa independiente, siempre encima de
  // todo lo demás — se comportan como una pegatina puesta sobre el diseño.
  const stickerBoxes = [];
  (slide.stickers||[]).forEach(st=>{
    const px = (st.x==null?75:st.x)/100*W, py=(st.y==null?50:st.y)/100*H;
    const scale = st.scale==null?1:st.scale;
    if(st.type==="emoji"){
      const size = 110*scale;
      ctx.font = size+"px sans-serif";
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(st.content, px, py);
      const w = ctx.measureText(st.content).width || size;
      stickerBoxes.push({id:st.id, x0:px-w/2, y0:py-size/2, x1:px+w/2, y1:py+size/2});
      ctx.textBaseline="alphabetic";
    } else if(st.type==="imagen" && st.img){
      const baseW = W*0.4*scale;
      const ratio = st.img.height/st.img.width;
      const w = baseW, h = baseW*ratio;
      ctx.save();
      ctx.shadowColor="rgba(0,0,0,0.35)"; ctx.shadowBlur=24; ctx.shadowOffsetY=8;
      ctx.drawImage(st.img, px-w/2, py-h/2, w, h);
      ctx.restore();
      stickerBoxes.push({id:st.id, x0:px-w/2, y0:py-h/2, x1:px+w/2, y1:py+h/2});
    }
  });
  if(canvas) canvas.__stickerBoxes = stickerBoxes;
}

function dlOne(canvas,idx){const a=document.createElement("a");a.href=canvas.toDataURL("image/png");a.download="slide-"+(idx+1)+".png";document.body.appendChild(a);a.click();document.body.removeChild(a);}

const FONT_LOADS = () => Promise.all([
  document.fonts.load("700 100px 'Fraunces'"),
  document.fonts.load("600 100px 'Fraunces'"),
  document.fonts.load("400 100px 'Fraunces'"),
  document.fonts.load("400 54px 'Fraunces'"),
  document.fonts.load("600 54px 'Fraunces'"),
  document.fonts.load("700 54px 'Fraunces'"),
  document.fonts.load("italic 700 100px 'Fraunces'"),
  document.fonts.load("italic 400 54px 'Fraunces'"),
  document.fonts.load("italic 700 54px 'Fraunces'"),
  document.fonts.load("700 100px 'Cormorant Garamond'"),
  document.fonts.load("400 100px 'Cormorant Garamond'"),
  document.fonts.load("400 54px 'Cormorant Garamond'"),
  document.fonts.load("600 54px 'Cormorant Garamond'"),
  document.fonts.load("700 54px 'Cormorant Garamond'"),
  document.fonts.load("italic 600 100px 'Cormorant Garamond'"),
  document.fonts.load("italic 400 54px 'Cormorant Garamond'"),
  document.fonts.load("italic 400 96px 'Amiri'"),
  document.fonts.load("700 48px 'Outfit'"),
  document.fonts.load("400 130px 'Qwitcher Grypen'"),
]).catch(()=>{});

// Carga dinámica de cualquier fuente de Google Fonts escrita a mano (para el
// selector de tipografía por slide / por carrusel). Se cachea por nombre para
// no volver a pedirla si ya está cargada.
const _loadedCustomFonts = new Set();
function loadCustomGoogleFont(familyRaw){
  const family = String(familyRaw||"").trim();
  if(!family) return Promise.resolve(false);
  if(_loadedCustomFonts.has(family)) return Promise.resolve(true);
  return new Promise((resolve)=>{
    const urlName = family.replace(/\s+/g,"+");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family="+urlName+":ital,wght@0,400;0,700;1,400;1,700&display=swap";
    let settled = false;
    const finish = (ok)=>{ if(settled)return; settled=true; resolve(ok); };
    link.onload = async ()=>{
      try{
        await Promise.all([
          document.fonts.load("400 60px '"+family+"'"),
          document.fonts.load("700 60px '"+family+"'"),
        ]);
        _loadedCustomFonts.add(family);
        finish(true);
      }catch(e){ finish(false); }
    };
    link.onerror = ()=>finish(false);
    document.head.appendChild(link);
    setTimeout(()=>finish(_loadedCustomFonts.has(family)), 4000); // por si Google Fonts no dispara onload
  });
}

function SlideCanvas({slide,idx,total,brand,avatarImg,fontsReady,canvasRefs,onBgUpload,onBgVideoUpload,onUpdate,onUpdateSticker,onAddSticker,onDeleteSticker}){
  const ref=useRef(null); const b=BRANDS[brand];
  const dragRef=useRef(null); // {startX,startY,baseOx,baseOy,pendingOx,pendingOy}
  const renderTokenRef=useRef(0); // "a prueba de balas" contra llamadas dobles del entorno
  const [dragging,setDragging]=useState(false);
  const previewVideoRef=useRef(null);
  const rafRef=useRef(null);
  const exportingRef=useRef(false);
  const [exportState,setExportState]=useState(""); // "" | "grabando…" | "✓ codec: xxx" | "error"
  const [emojiInputOpen,setEmojiInputOpen]=useState(false);
  const [emojiInputVal,setEmojiInputVal]=useState("✨");

  const render=useCallback(()=>{
    if(!ref.current)return;
    const myToken = ++renderTokenRef.current;
    requestAnimationFrame(()=>{
      // Si mientras esperábamos a pintar llegó una llamada más reciente,
      // esta queda obsoleta y no pinta nada — solo cuenta la última.
      // Esto blinda contra cualquier doble llamada del entorno de ejecución,
      // sea cual sea la causa exacta.
      if(renderTokenRef.current!==myToken)return;
      if(!ref.current)return;
      drawSlide(ref.current,{slide,idx,total,brand,avatarImg});
      canvasRefs.current[idx]=ref.current;
    });
  },[slide,idx,total,brand,avatarImg]);

  // Redibujado normal: una sola pasada, cada vez que cambia algo de la slide.
  useEffect(()=>{
    render();
  },[render]);

  // Espera de fuentes: solo la primera vez (cuando fontsReady cambia, algo
  // que pasa una sola vez al cargar la app), no en cada edición posterior —
  // antes se repetía en cada cambio, causando una doble pasada de dibujo
  // constante que producía el texto superpuesto en pantalla.
  useEffect(()=>{
    FONT_LOADS().then(()=>render());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[fontsReady]);

  // (Vídeo de fondo eliminado: las slides son solo imagen.)

  function onPointerDown(e){
    e.preventDefault();
    const canvas=ref.current; if(!canvas)return;
    canvas.setPointerCapture(e.pointerId);
    const rect0=canvas.getBoundingClientRect();
    const scX0=canvas.width/rect0.width, scY0=canvas.height/rect0.height;
    const px0=(e.clientX-rect0.left)*scX0, py0=(e.clientY-rect0.top)*scY0;
    const stBoxes=canvas.__stickerBoxes||[];
    const stHit=stBoxes.slice().reverse().find(bx=>px0>=bx.x0&&px0<=bx.x1&&py0>=bx.y0&&py0<=bx.y1);
    if(stHit){
      const st=(slide.stickers||[]).find(s=>s.id===stHit.id);
      const existing={x:st&&st.x!=null?st.x:75, y:st&&st.y!=null?st.y:50};
      dragRef.current={mode:"sticker", stickerId:stHit.id, startX:e.clientX, startY:e.clientY, baseX:existing.x, baseY:existing.y, pending:null};
      setDragging(true);
      return;
    }
    if(slide.editMode==="foto"){
      dragRef.current={mode:"photo", startX:e.clientX, startY:e.clientY, baseX:slide.imgOffsetX||0, baseY:slide.imgOffsetY||0, pending:null};
      setDragging(true);
      return;
    }
    const forceBlock = slide.moveMode==="bloque";
    const rect=canvas.getBoundingClientRect();
    const scaleX=canvas.width/rect.width, scaleY=canvas.height/rect.height;
    const px=(e.clientX-rect.left)*scaleX, py=(e.clientY-rect.top)*scaleY;
    const boxes=canvas.__rowBoxes||[];
    const hit=!forceBlock && boxes.find(bx=>px>=bx.x0&&px<=bx.x1&&py>=bx.y0&&py<=bx.y1);
    if(hit){
      const existing=(slide.lineOffsets&&slide.lineOffsets[hit.index])||{x:0,y:0};
      dragRef.current={mode:"line", lineIndex:hit.index, startX:e.clientX, startY:e.clientY, baseX:existing.x, baseY:existing.y, pending:null};
    } else {
      dragRef.current={mode:"block", startX:e.clientX, startY:e.clientY, baseX:slide.offsetX||0, baseY:slide.offsetY||0, pending:null};
    }
    setDragging(true);
  }
  function onPointerMove(e){
    if(!dragRef.current)return;
    const canvas=ref.current; if(!canvas)return;
    const rect=canvas.getBoundingClientRect();
    const scaleX=canvas.width/rect.width, scaleY=canvas.height/rect.height;
    const dx=(e.clientX-dragRef.current.startX)*scaleX;
    const dy=(e.clientY-dragRef.current.startY)*scaleY;
    if(dragRef.current.mode==="line"){
      const newX=Math.max(-W*0.45,Math.min(W*0.45,dragRef.current.baseX+dx));
      const newY=Math.max(-H*0.45,Math.min(H*0.45,dragRef.current.baseY+dy));
      dragRef.current.pending={x:newX,y:newY};
      const nextOffsets=(slide.lineOffsets||[]).slice();
      nextOffsets[dragRef.current.lineIndex]={x:newX,y:newY};
      drawSlide(canvas,{slide:Object.assign({},slide,{lineOffsets:nextOffsets}),idx,total,brand,avatarImg});
    } else if(dragRef.current.mode==="photo"){
      // El recorte real (que nunca deje huecos vacíos) lo aplica drawSlide según
      // el tamaño real de la foto; aquí solo proponemos el movimiento.
      const newX=dragRef.current.baseX+dx, newY=dragRef.current.baseY+dy;
      dragRef.current.pending={x:newX,y:newY};
      drawSlide(canvas,{slide:Object.assign({},slide,{imgOffsetX:newX,imgOffsetY:newY}),idx,total,brand,avatarImg});
    } else if(dragRef.current.mode==="sticker"){
      // La posición del sticker se guarda en % (no en píxeles), igual que en B-roll.
      const newX=Math.max(3,Math.min(97,dragRef.current.baseX+(dx/W)*100));
      const newY=Math.max(3,Math.min(97,dragRef.current.baseY+(dy/H)*100));
      dragRef.current.pending={x:newX,y:newY};
      const nextStickers=(slide.stickers||[]).map(s=>s.id===dragRef.current.stickerId?Object.assign({},s,{x:newX,y:newY}):s);
      drawSlide(canvas,{slide:Object.assign({},slide,{stickers:nextStickers}),idx,total,brand,avatarImg});
    } else {
      const newX=Math.max(-W*0.45,Math.min(W*0.45,dragRef.current.baseX+dx));
      const newY=Math.max(-H*0.45,Math.min(H*0.45,dragRef.current.baseY+dy));
      dragRef.current.pending={x:newX,y:newY};
      drawSlide(canvas,{slide:Object.assign({},slide,{offsetX:newX,offsetY:newY}),idx,total,brand,avatarImg});
    }
  }
  function endDrag(){
    if(!dragRef.current)return;
    if(dragRef.current.mode==="line"){
      const nextOffsets=(slide.lineOffsets||[]).slice();
      nextOffsets[dragRef.current.lineIndex]=dragRef.current.pending||{x:dragRef.current.baseX,y:dragRef.current.baseY};
      onUpdate(idx,"lineOffsets",nextOffsets);
    } else if(dragRef.current.mode==="photo"){
      const p=dragRef.current.pending||{x:dragRef.current.baseX,y:dragRef.current.baseY};
      onUpdate(idx,"imgOffsetX",p.x);
      onUpdate(idx,"imgOffsetY",p.y);
    } else if(dragRef.current.mode==="sticker"){
      const p=dragRef.current.pending||{x:dragRef.current.baseX,y:dragRef.current.baseY};
      onUpdateSticker(idx,dragRef.current.stickerId,{x:p.x,y:p.y});
    } else {
      const p=dragRef.current.pending||{x:dragRef.current.baseX,y:dragRef.current.baseY};
      onUpdate(idx,"offsetX",p.x);
      onUpdate(idx,"offsetY",p.y);
    }
    dragRef.current=null;
    setDragging(false);
  }

  return(
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <canvas ref={ref}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}
        style={{width:"100%",borderRadius:10,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",display:"block",cursor:dragging?"grabbing":(slide.editMode==="foto"?"move":"grab"),touchAction:"none"}}/>
      <button
        onClick={()=>onUpdate(idx,"moveMode",slide.moveMode==="bloque"?"linea":"bloque")}
        title="Elige si al arrastrar se mueve solo la línea que tocas o todo el texto junto"
        style={{fontSize:10,fontFamily:"'Outfit',sans-serif",background:"transparent",border:"1px solid #c8bfaf",borderRadius:4,padding:"3px 6px",color:"#888",cursor:"pointer"}}>
        Mover: {slide.moveMode==="bloque"?"todo el bloque":"línea a línea"} · cambiar
      </button>
      {slide.bgImg&&(
        <button
          onClick={()=>onUpdate(idx,"editMode",slide.editMode==="foto"?"texto":"foto")}
          title="Arrastra para reencuadrar la foto en vez del texto"
          style={{fontSize:10,fontFamily:"'Outfit',sans-serif",background:slide.editMode==="foto"?"#eee7d8":"transparent",border:"1px solid "+(slide.editMode==="foto"?b.accent:"#c8bfaf"),borderRadius:4,padding:"3px 6px",color:slide.editMode==="foto"?b.accent:"#888",cursor:"pointer"}}>
          {slide.editMode==="foto"?"📍 Reencuadrando foto · pulsa para volver al texto":"🖼️ Reencuadrar foto"}
        </button>
      )}
      <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,color:"#999",fontFamily:"'Outfit',sans-serif"}}>Color texto:</span>
        {[
          {label:"Auto",val:null},
          {label:"Blanco",val:"#ffffff"},
          {label:"Oscuro",val:"#1a1010"},
          {label:"Acento",val:b.accent},
        ].map(opt=>(
          <button key={opt.label} onClick={()=>onUpdate(idx,"textColor",opt.val)}
            title={opt.label}
            style={{width:20,height:20,borderRadius:"50%",padding:0,cursor:"pointer",
              background:opt.val||"linear-gradient(135deg,#fff 50%,#1a1010 50%)",
              border:(slide.textColor||null)===opt.val?"2px solid "+b.accent:"1px solid #c8bfaf"}}/>
        ))}
        <label title="Color personalizado" style={{width:20,height:20,borderRadius:"50%",overflow:"hidden",border:"1px solid #c8bfaf",cursor:"pointer",position:"relative",display:"inline-block"}}>
          <input type="color" value={slide.textColor||"#1a1010"} onChange={e=>onUpdate(idx,"textColor",e.target.value)} style={{position:"absolute",top:-4,left:-4,width:28,height:28,border:"none",padding:0,cursor:"pointer"}}/>
        </label>
      </div>
      <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}} title="Sube el peso del texto normal (no el titular) sin llegar a negrita — útil para leer mejor sobre fotos">
        <span style={{fontSize:10,color:"#999",fontFamily:"'Outfit',sans-serif"}}>Peso letra:</span>
        {[
          {label:"Normal",val:null},
          {label:"Medio",val:500},
          {label:"Semi",val:600},
        ].map(opt=>(
          <button key={opt.label} onClick={()=>onUpdate(idx,"weightOverride",opt.val)}
            style={{fontSize:10,fontFamily:"'Outfit',sans-serif",fontWeight:opt.val||400,
              background:(slide.weightOverride||null)===opt.val?b.accent:"transparent",
              color:(slide.weightOverride||null)===opt.val?"#fff":"#888",
              border:"1px solid "+((slide.weightOverride||null)===opt.val?b.accent:"#c8bfaf"),
              borderRadius:4,padding:"2px 8px",cursor:"pointer"}}>{opt.label}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={()=>dlOne(ref.current,idx)} style={{flex:1,background:"transparent",border:"1px solid "+b.accent,borderRadius:4,padding:"4px 8px",fontSize:11,fontFamily:"'Outfit',sans-serif",color:b.accent,cursor:"pointer"}}>↓ PNG</button>
        <label style={{flex:1,background:"transparent",border:"1px dashed "+b.accent,borderRadius:4,padding:"4px 8px",fontSize:11,fontFamily:"'Outfit',sans-serif",color:b.accent,cursor:"pointer",textAlign:"center"}}>
          📷<input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
            const file=e.target.files&&e.target.files[0];if(!file)return;
            const reader=new FileReader();
            reader.onload=ev=>{const img=new Image();img.onload=()=>onBgUpload(idx,img);img.src=ev.target.result;};
            reader.readAsDataURL(file);
          }}/>
        </label>
        {slide.bgImg&&<button onClick={()=>onBgUpload(idx,null)} style={{background:"transparent",border:"1px solid #c06060",borderRadius:4,padding:"4px 8px",fontSize:11,color:"#c06060",cursor:"pointer"}}>✕</button>}
        {slide.bgImg&&(slide.imgOffsetX||slide.imgOffsetY)?<button onClick={()=>{onUpdate(idx,"imgOffsetX",0);onUpdate(idx,"imgOffsetY",0);}} title="Volver a centrar la foto" style={{background:"transparent",border:"1px solid #c8bfaf",borderRadius:4,padding:"4px 8px",fontSize:11,color:"#888",cursor:"pointer"}}>🖼️↺</button>:null}
        {(slide.offsetX||slide.offsetY||(slide.lineOffsets&&slide.lineOffsets.some(o=>o&&(o.x||o.y))))?<button onClick={()=>{onUpdate(idx,"offsetX",0);onUpdate(idx,"offsetY",0);onUpdate(idx,"lineOffsets",[]);}} title="Centrar texto de nuevo" style={{background:"transparent",border:"1px solid #c8bfaf",borderRadius:4,padding:"4px 8px",fontSize:11,color:"#888",cursor:"pointer"}}>↺</button>:null}
      </div>

      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",paddingTop:4,borderTop:"1px solid #eee5d5"}}>
        <span style={{fontSize:10,color:"#999",fontFamily:"'Outfit',sans-serif"}}>Stickers:</span>
        {!emojiInputOpen ? (
          <button
            onClick={()=>setEmojiInputOpen(true)}
            style={{fontSize:11,background:"transparent",border:"1px dashed "+b.accent,borderRadius:4,padding:"3px 8px",color:b.accent,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
            😊 Sticker emoji
          </button>
        ) : (
          <span style={{display:"flex",gap:4,alignItems:"center"}}>
            <input
              autoFocus
              value={emojiInputVal}
              onChange={e=>setEmojiInputVal(e.target.value)}
              onKeyDown={e=>{
                if(e.key==="Enter"&&emojiInputVal.trim()){ onAddSticker(idx,{type:"emoji",content:emojiInputVal.trim()}); setEmojiInputOpen(false); setEmojiInputVal("✨"); }
                if(e.key==="Escape"){ setEmojiInputOpen(false); }
              }}
              placeholder="pega o escribe un emoji"
              style={{width:130,fontSize:14,border:"1px solid "+b.accent,borderRadius:4,padding:"3px 6px",fontFamily:"'Outfit',sans-serif"}}/>
            <button
              onClick={()=>{ if(emojiInputVal.trim()){ onAddSticker(idx,{type:"emoji",content:emojiInputVal.trim()}); setEmojiInputOpen(false); setEmojiInputVal("✨"); } }}
              style={{fontSize:11,background:b.accent,border:"none",borderRadius:4,padding:"3px 10px",color:"#fff",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              Añadir
            </button>
            <button onClick={()=>setEmojiInputOpen(false)} style={{fontSize:11,background:"transparent",border:"1px solid #c8bfaf",borderRadius:4,padding:"3px 8px",color:"#888",cursor:"pointer"}}>✕</button>
          </span>
        )}
        <label style={{fontSize:11,background:"transparent",border:"1px dashed "+b.accent,borderRadius:4,padding:"3px 8px",color:b.accent,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
          🖼️ Sticker imagen
          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
            const file=e.target.files&&e.target.files[0]; if(!file)return;
            const reader=new FileReader();
            reader.onload=ev=>{ const img=new Image(); img.onload=()=>onAddSticker(idx,{type:"imagen",img}); img.src=ev.target.result; };
            reader.readAsDataURL(file);
          }}/>
        </label>
      </div>
      {(slide.stickers||[]).length>0 && (
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          {(slide.stickers||[]).map(st=>(
            <div key={st.id} style={{display:"flex",gap:6,alignItems:"center",fontSize:11,fontFamily:"'Outfit',sans-serif",color:"#777"}}>
              <span style={{width:22,textAlign:"center"}}>{st.type==="emoji"?st.content:"🖼️"}</span>
              <button onClick={()=>onUpdateSticker(idx,st.id,{scale:Math.max(0.3,(st.scale==null?1:st.scale)-0.15)})} style={{background:"transparent",border:"1px solid #c8bfaf",borderRadius:3,width:20,height:20,cursor:"pointer",color:"#888"}}>−</button>
              <span>{Math.round((st.scale==null?1:st.scale)*100)}%</span>
              <button onClick={()=>onUpdateSticker(idx,st.id,{scale:Math.min(3,(st.scale==null?1:st.scale)+0.15)})} style={{background:"transparent",border:"1px solid #c8bfaf",borderRadius:3,width:20,height:20,cursor:"pointer",color:"#888"}}>+</button>
              <button onClick={()=>onDeleteSticker(idx,st.id)} style={{background:"transparent",border:"1px solid #e0c0b0",borderRadius:3,padding:"1px 6px",cursor:"pointer",color:"#c06060",marginLeft:"auto"}}>✕</button>
            </div>
          ))}
          <div style={{fontSize:10,color:"#bbb",fontFamily:"'Outfit',sans-serif"}}>Arrastra un sticker sobre la slide para moverlo</div>
        </div>
      )}
    </div>
  );
}

function EditPanel({slides,onUpdate,onAdd,onInsertAt,onSplit,onDelete,onMove,brand}){
  const b=BRANDS[brand];
  const taRefs=useRef({});
  const [fontDrafts,setFontDrafts]=useState({});
  const [fontStatuses,setFontStatuses]=useState({});
  async function applySlideFont(i,fontNameOrNull){
    if(fontNameOrNull){
      setFontStatuses(s=>Object.assign({},s,{[i]:"cargando…"}));
      const ok=await loadCustomGoogleFont(fontNameOrNull);
      if(!ok){
        setFontStatuses(s=>Object.assign({},s,{[i]:"no se encontró esa fuente"}));
        setTimeout(()=>setFontStatuses(s=>Object.assign({},s,{[i]:""})),3500);
        return;
      }
    }
    onUpdate(i,"titleFont",fontNameOrNull);
    setFontStatuses(s=>Object.assign({},s,{[i]:fontNameOrNull?"✓ aplicada":""}));
    if(fontNameOrNull) setTimeout(()=>setFontStatuses(s=>Object.assign({},s,{[i]:""})),2000);
  }
  return(
    <div style={{background:"rgba(255,255,255,0.9)",border:"1px solid #ddd5c2",borderRadius:10,padding:"1rem 1.25rem",marginBottom:20}}>
      <div style={{fontSize:10,letterSpacing:"2px",color:"#aaa",textTransform:"uppercase",fontFamily:"'Outfit',sans-serif",marginBottom:12}}>Editor de slides</div>

      <button onClick={()=>onInsertAt(0)} style={{width:"100%",background:"transparent",border:"1px dashed "+b.accent,borderRadius:6,padding:"5px 0",fontFamily:"'Outfit',sans-serif",fontSize:11,color:b.accent,cursor:"pointer",marginBottom:8}}>+ Insertar slide aquí</button>

      {slides.map((sl,i)=>(
        <div key={i}>
        <div style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:10}}>
          <div style={{display:"flex",flexDirection:"column",gap:3,paddingTop:4}}>
            <button onClick={()=>onMove(i,-1)} disabled={i===0} style={{background:"transparent",border:"1px solid "+b.accent,borderRadius:3,width:22,height:22,fontSize:10,color:b.accent,cursor:"pointer",padding:0}}>▲</button>
            <button onClick={()=>onMove(i,1)} disabled={i===slides.length-1} style={{background:"transparent",border:"1px solid "+b.accent,borderRadius:3,width:22,height:22,fontSize:10,color:b.accent,cursor:"pointer",padding:0}}>▼</button>
          </div>
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:6,marginBottom:4,alignItems:"center"}}>
              <input value={sl.label} onChange={e=>onUpdate(i,"label",e.target.value)} style={{width:90,border:"1px solid #d4c9b0",borderRadius:4,padding:"3px 8px",fontFamily:"'Outfit',sans-serif",fontSize:11,color:"#555",background:"#faf7f0"}}/>
              <div style={{display:"flex",alignItems:"center",gap:3,border:"1px solid #d4c9b0",borderRadius:4,padding:"2px 6px",background:"#faf7f0"}}>
                <button onClick={()=>onUpdate(i,"sizeAdj",Math.max(0.5,Math.round(((sl.sizeAdj||1)-0.1)*10)/10))} title="Reducir tamaño del texto" style={{background:"transparent",border:"none",fontSize:13,color:"#888",cursor:"pointer",padding:"0 3px",lineHeight:1}}>−</button>
                <span style={{fontSize:10,fontFamily:"'Outfit',sans-serif",color:"#888",minWidth:32,textAlign:"center"}}>{Math.round((sl.sizeAdj||1)*100)}%</span>
                <button onClick={()=>onUpdate(i,"sizeAdj",Math.min(1.4,Math.round(((sl.sizeAdj||1)+0.1)*10)/10))} title="Aumentar tamaño del texto" style={{background:"transparent",border:"none",fontSize:13,color:"#888",cursor:"pointer",padding:"0 3px",lineHeight:1}}>+</button>
              </div>
              <label title="Si está activo, líneas como '6.' o '•' nunca se convierten en pasos/viñetas — se muestran tal cual las escribes" style={{display:"flex",alignItems:"center",gap:4,fontSize:10,fontFamily:"'Outfit',sans-serif",color:sl.literalFormat?b.accent:"#999",border:"1px solid "+(sl.literalFormat?b.accent:"#d4c9b0"),borderRadius:4,padding:"2px 8px",background:sl.literalFormat?"#faf0f0":"#faf7f0",cursor:"pointer",whiteSpace:"nowrap"}}>
                <input type="checkbox" checked={!!sl.literalFormat} onChange={e=>onUpdate(i,"literalFormat",e.target.checked)} style={{margin:0,cursor:"pointer"}}/>
                Texto literal
              </label>
              <div style={{display:"flex",alignItems:"center",gap:3,border:"1px solid #d4c9b0",borderRadius:4,padding:"2px 6px",background:"#faf7f0"}} title="Tipografía de esta slide (cualquier fuente de Google Fonts). Vacío = la de la marca.">
                <input
                  value={fontDrafts[i]!==undefined?fontDrafts[i]:(sl.titleFont||"")}
                  onChange={e=>setFontDrafts(s=>Object.assign({},s,{[i]:e.target.value}))}
                  onKeyDown={e=>{ if(e.key==="Enter") applySlideFont(i, (fontDrafts[i]||"").trim()||null); }}
                  placeholder="fuente (marca)"
                  style={{width:90,fontSize:10,border:"none",outline:"none",fontFamily:"'Outfit',sans-serif",color:"#555",background:"transparent"}}/>
                <button onClick={()=>applySlideFont(i,(fontDrafts[i]||"").trim()||null)} style={{fontSize:9,background:b.accent,border:"none",borderRadius:3,padding:"2px 6px",color:"#fff",cursor:"pointer"}}>OK</button>
                {sl.titleFont&&<button onClick={()=>{setFontDrafts(s=>Object.assign({},s,{[i]:""}));applySlideFont(i,null);}} title="Volver a la de marca" style={{fontSize:9,background:"transparent",border:"none",color:"#999",cursor:"pointer"}}>↺</button>}
                {fontStatuses[i]&&<span style={{fontSize:9,color:fontStatuses[i].startsWith("no se")?"#c06060":"#888"}}>{fontStatuses[i]}</span>}
              </div>
              {i===0&&<input value={sl.acento||""} onChange={e=>onUpdate(i,"acento",e.target.value)} placeholder="acento script (opcional)" style={{flex:1,border:"1px solid #d4c9b0",borderRadius:4,padding:"3px 8px",fontFamily:"'Outfit',sans-serif",fontSize:11,color:"#888",background:"#faf7f0"}}/>}
            </div>
            <textarea
              ref={el=>{taRefs.current[i]=el;}}
              value={sl.text} onChange={e=>{onUpdate(i,"text",e.target.value);onUpdate(i,"literalFormat",true);}} rows={3}
              onKeyDown={e=>{
                const mod=e.metaKey||e.ctrlKey;
                if(!mod)return;
                const marker=e.key==="b"?"**":e.key==="i"?"*":e.key==="u"?"~":e.key==="g"?"++":null;
                if(!marker)return;
                e.preventDefault();
                const ta=e.target;
                const s=ta.selectionStart, en=ta.selectionEnd;
                if(s===en)return; // sin selección, no hacemos nada
                const mLen=marker.length;
                const already = sl.text.slice(s-mLen,s)===marker && sl.text.slice(en,en+mLen)===marker;
                let next, newS, newE;
                if(already){
                  next = sl.text.slice(0,s-mLen)+sl.text.slice(s,en)+sl.text.slice(en+mLen);
                  newS=s-mLen; newE=en-mLen;
                } else {
                  next = sl.text.slice(0,s)+marker+sl.text.slice(s,en)+marker+sl.text.slice(en);
                  newS=s+mLen; newE=en+mLen;
                }
                onUpdate(i,"text",next);
                onUpdate(i,"literalFormat",true);
                requestAnimationFrame(()=>{ ta.selectionStart=newS; ta.selectionEnd=newE; ta.focus(); });
              }}
              style={{width:"100%",boxSizing:"border-box",border:"1px solid #d4c9b0",borderRadius:6,padding:"8px 10px",fontFamily:"'Outfit',sans-serif",fontSize:13,resize:"vertical",outline:"none",background:"#faf7f0"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:3,flexWrap:"wrap",gap:6}}>
              <div style={{fontSize:10,color:"#bbb"}}>Selecciona texto y pulsa ⌘B negrita · ⌘I cursiva · ⌘U subrayado · ⌘G tamaño grande (o escribe **negrita** *cursiva* ~subrayado~ ++grande++ [[caja]] a mano) · línea en blanco = aire · Bullets: • o - · Pasos: 1. 2. 3. · % = tamaño de toda la slide</div>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                <span style={{fontSize:10,color:"#999"}}>Color selección:</span>
                {(()=>{
                  function applyColor(hexOrNull){
                    const ta=taRefs.current[i]; if(!ta)return;
                    const s=ta.selectionStart, en=ta.selectionEnd;
                    if(s===en)return;
                    const text=sl.text;
                    const openMatch = text.slice(0,s).match(/\{#[0-9a-fA-F]{6}\}$/);
                    const closeMatch = text.slice(en,en+3)==="{/}";
                    let base=text, baseS=s, baseE=en;
                    if(openMatch&&closeMatch){
                      const openLen=openMatch[0].length;
                      base = text.slice(0,s-openLen)+text.slice(s,en)+text.slice(en+3);
                      baseS = s-openLen; baseE = en-openLen;
                    }
                    if(hexOrNull===null){
                      onUpdate(i,"text",base);
                      onUpdate(i,"literalFormat",true);
                      requestAnimationFrame(()=>{ta.selectionStart=baseS;ta.selectionEnd=baseE;ta.focus();});
                      return;
                    }
                    const marker="{#"+hexOrNull.replace("#","")+"}";
                    const next=base.slice(0,baseS)+marker+base.slice(baseS,baseE)+"{/}"+base.slice(baseE);
                    onUpdate(i,"text",next);
                    onUpdate(i,"literalFormat",true);
                    requestAnimationFrame(()=>{ta.selectionStart=baseS+marker.length;ta.selectionEnd=baseE+marker.length;ta.focus();});
                  }
                  return (
                    <>
                      <button onClick={()=>applyColor(b.accent)} title="Acento de marca" style={{width:16,height:16,borderRadius:"50%",padding:0,cursor:"pointer",background:b.accent,border:"1px solid #c8bfaf"}}/>
                      <button onClick={()=>applyColor("#ffffff")} title="Blanco" style={{width:16,height:16,borderRadius:"50%",padding:0,cursor:"pointer",background:"#ffffff",border:"1px solid #c8bfaf"}}/>
                      <button onClick={()=>applyColor("#1a1010")} title="Oscuro" style={{width:16,height:16,borderRadius:"50%",padding:0,cursor:"pointer",background:"#1a1010",border:"1px solid #c8bfaf"}}/>
                      <label title="Color personalizado" style={{width:16,height:16,borderRadius:"50%",overflow:"hidden",border:"1px solid #c8bfaf",cursor:"pointer",position:"relative",display:"inline-block",background:"conic-gradient(red,yellow,lime,cyan,blue,magenta,red)"}}>
                        <input type="color" onChange={e=>applyColor(e.target.value)} style={{position:"absolute",top:-4,left:-4,width:24,height:24,border:"none",padding:0,cursor:"pointer",opacity:0}}/>
                      </label>
                      <button onClick={()=>applyColor(null)} title="Quitar color de la selección" style={{fontSize:9,background:"transparent",border:"1px solid #c8bfaf",borderRadius:3,padding:"1px 5px",color:"#888",cursor:"pointer"}}>✕</button>
                    </>
                  );
                })()}
              </div>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                <span style={{fontSize:10,color:"#999"}}>Caja de fondo:</span>
                {(()=>{
                  function applyBox(kind){
                    const ta=taRefs.current[i]; if(!ta)return;
                    const s=ta.selectionStart, en=ta.selectionEnd;
                    if(s===en)return;
                    const text=sl.text;
                    const openNormal = text.slice(0,s).match(/\[\[$/);
                    const closeNormal = text.slice(en,en+2)==="]]";
                    const openInvert = text.slice(0,s).match(/\{\{$/);
                    const closeInvert = text.slice(en,en+2)==="}}";
                    let base=text, baseS=s, baseE=en;
                    if(openNormal&&closeNormal){
                      base = text.slice(0,s-2)+text.slice(s,en)+text.slice(en+2);
                      baseS=s-2; baseE=en-2;
                    } else if(openInvert&&closeInvert){
                      base = text.slice(0,s-2)+text.slice(s,en)+text.slice(en+2);
                      baseS=s-2; baseE=en-2;
                    }
                    if(kind===null){
                      onUpdate(i,"text",base);
                      onUpdate(i,"literalFormat",true);
                      requestAnimationFrame(()=>{ta.selectionStart=baseS;ta.selectionEnd=baseE;ta.focus();});
                      return;
                    }
                    const [mo,mc] = kind==="invert" ? ["{{","}}"] : ["[[","]]"];
                    const next=base.slice(0,baseS)+mo+base.slice(baseS,baseE)+mc+base.slice(baseE);
                    onUpdate(i,"text",next);
                    onUpdate(i,"literalFormat",true);
                    requestAnimationFrame(()=>{ta.selectionStart=baseS+mo.length;ta.selectionEnd=baseE+mo.length;ta.focus();});
                  }
                  return (
                    <>
                      <button onClick={()=>applyBox("normal")} title="Caja: fondo de marca, texto claro" style={{width:24,height:16,borderRadius:3,padding:0,cursor:"pointer",background:b.pair[0],border:"1px solid #c8bfaf"}}/>
                      <button onClick={()=>applyBox("invert")} title="Caja invertida: fondo claro, texto de marca" style={{width:24,height:16,borderRadius:3,padding:0,cursor:"pointer",background:b.pair[1],border:"1px solid #c8bfaf"}}/>
                      <button onClick={()=>applyBox(null)} title="Quitar caja de la selección" style={{fontSize:9,background:"transparent",border:"1px solid #c8bfaf",borderRadius:3,padding:"1px 5px",color:"#888",cursor:"pointer"}}>✕</button>
                    </>
                  );
                })()}
              </div>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                <span style={{fontSize:10,color:"#999"}}>Tamaño selección:</span>
                <button
                  title="Agranda solo el texto seleccionado (+32%), o lo quita si ya lo estaba"
                  onClick={()=>{
                    const ta=taRefs.current[i]; if(!ta)return;
                    const s=ta.selectionStart, en=ta.selectionEnd;
                    if(s===en)return;
                    const marker="++";
                    const text=sl.text;
                    const already = text.slice(s-2,s)===marker && text.slice(en,en+2)===marker;
                    let next, newS, newE;
                    if(already){
                      next = text.slice(0,s-2)+text.slice(s,en)+text.slice(en+2);
                      newS=s-2; newE=en-2;
                    } else {
                      next = text.slice(0,s)+marker+text.slice(s,en)+marker+text.slice(en);
                      newS=s+2; newE=en+2;
                    }
                    onUpdate(i,"text",next);
                    onUpdate(i,"literalFormat",true);
                    requestAnimationFrame(()=>{ta.selectionStart=newS;ta.selectionEnd=newE;ta.focus();});
                  }}
                  style={{fontSize:14,fontWeight:700,background:"transparent",border:"1px solid #c8bfaf",borderRadius:4,padding:"1px 8px",color:"#555",cursor:"pointer",lineHeight:1.3}}>A+</button>
              </div>
              <button
                onClick={()=>{
                  const ta=taRefs.current[i]; if(!ta)return;
                  const s=ta.selectionStart, e=ta.selectionEnd;
                  if(s===e)return;
                  onSplit(i,s,e);
                }}
                title="Selecciona texto arriba y pulsa para moverlo a una slide nueva justo después"
                style={{background:"transparent",border:"1px solid "+b.accent,borderRadius:4,padding:"2px 8px",fontSize:10,fontFamily:"'Outfit',sans-serif",color:b.accent,cursor:"pointer",whiteSpace:"nowrap",marginLeft:8}}>
                → Dividir en nueva slide
              </button>
            </div>
          </div>
          <button onClick={()=>onDelete(i)} style={{background:"transparent",border:"1px solid #e0c0b0",borderRadius:4,padding:"4px 8px",fontSize:12,color:"#c06060",cursor:"pointer",marginTop:22}}>✕</button>
        </div>
        <button onClick={()=>onInsertAt(i+1)} style={{width:"100%",background:"transparent",border:"1px dashed "+b.accent,borderRadius:6,padding:"5px 0",fontFamily:"'Outfit',sans-serif",fontSize:11,color:b.accent,cursor:"pointer",marginBottom:10}}>+ Insertar slide aquí</button>
        </div>
      ))}
      <button onClick={onAdd} style={{background:"transparent",border:"1px dashed "+b.accent,borderRadius:6,padding:"6px 16px",fontFamily:"'Outfit',sans-serif",fontSize:12,color:b.accent,cursor:"pointer",marginTop:4}}>+ Añadir slide al final</button>
    </div>
  );
}

function sysP(brand){
  const P=PROFILE;
  const nombre=(P.nombre||"").trim()||"la marca de la usuaria";
  const plural=P.persona==="nosotras";
  const latam=P.idioma==="Latam";
  const gen = P.genero==="femenino"
    ? 'GÉNERO (obligatorio, sin excepciones): la audiencia son mujeres. Usa SIEMPRE formas femeninas al dirigirte a la lectora o describirla: "lista" no "listo", "convencida" no "convencido", "cansada" no "cansado", "todas" no "todos", "una experta" no "un experto". Nunca uses el masculino genérico ni por defecto. Revisa cada adjetivo y participio referido a la lectora antes de entregar el texto.'
    : P.genero==="masculino"
    ? 'GÉNERO (obligatorio): la audiencia son hombres. Usa formas masculinas al dirigirte al lector. Revisa cada adjetivo y participio referido al lector antes de entregar el texto.'
    : 'GÉNERO: la audiencia es mixta. Usa formulaciones neutras cuando sea natural ("quien", "las personas que"), sin dobletes forzados ni @ ni "e" inclusiva.';
  const limpio = latam
    ? 'IDIOMA LIMPIO (obligatorio): español neutro de Latinoamérica, sin regionalismos muy marcados de un solo país. PROHIBIDO inventar verbos a partir de una palabra inglesa (ejemplos de lo que NUNCA debes escribir: "flinchado", "trackear", "stalkear", "printear", "deletear"). Usa siempre la palabra española natural.'
    : 'IDIOMA LIMPIO (obligatorio, sin excepciones): PROHIBIDO cualquier anglicismo o latinoamericanismo, incluidos verbos inventados a partir de una palabra inglesa (ejemplos de lo que NUNCA debes escribir: "flinchado", "trackear", "stalkear", "printear", "deletear", "chequear" en vez de "comprobar", "rentar" en vez de "alquilar"). Usa siempre la palabra española natural de España, aunque sea menos "cool" o más larga.';
  return "Eres estratega de contenido digital. Idioma: "+(latam?"español neutro latinoamericano":"español de España")+".\nMarca: "+nombre+(plural?" (voz en plural, \"nosotras\")":" (voz en primera persona del singular)")+
    (P.negocio?"\nA QUÉ SE DEDICA: "+P.negocio:"")+
    (P.audiencia?"\nAUDIENCIA: "+P.audiencia:"")+
    "\nTONO: "+(P.tono||"directo, adulto y cercano")+
    "\nREGLAS: tono adulto directo. CTA siempre. Posiciona sin enseñar. Sin clichés. PROHIBIDO negritas, cursivas, markdown inline. Solo texto plano con formato estructurado cuando aplique. Sin metadatos."+
    (P.cta?"\nCTA HABITUAL: cuando el formato lo permita, cierra con este tipo de llamada a la acción: "+P.cta:"")+
    (P.evitar?"\nPALABRAS, TEMAS O ENFOQUES A EVITAR (obligatorio): "+P.evitar:"")+
    "\nAUDIENCIA CONCRETA: escribes para UNA persona real de esa audiencia, no para una audiencia genérica y abstracta. Háblale como a alguien que conoces, con situaciones que ella reconocería literalmente como suyas."+
    "\n"+gen+
    "\nGRAMÁTICA (obligatorio, sin excepciones): cada frase de CADA slide, no solo la portada, debe ser gramaticalmente completa y correcta en español — sujeto, verbo bien conjugado, preposiciones y pronombres bien enlazados. Nunca sacrifiques la corrección gramatical por sonar más corto o más contundente. Antes de entregar, relee cada frase mentalmente: si suena rara, mal encajada o con una preposición/pronombre colgando (por ejemplo \"te da miedo a quién diga que no\" en vez de \"te da miedo que alguien te diga que no\"), corrígela."+
    "\n"+limpio+
    "\nRITMO DE VOZ (imítalo): (1) frases completas siempre, nunca cortadas a media estructura tipo \"No tu diario íntimo\" — mejor \"No tienes que enseñarles tu diario íntimo\"; (2) puedes empezar frase con \"Y\" como conector conversacional (\"Y no son lo mismo\"); (3) cuando afirmes algo abstracto, ancla con UN ejemplo concreto y visual antes de seguir; (4) no cortes justo antes del remate emocional — completa el pensamiento hasta el final; (5) las consecuencias que menciones deben ser concretas y con acción, no solo el resultado pasivo (\"te leen, aplican solas y punto\", no solo \"te leen, y punto\"); (6) NUNCA niegues una premisa que nadie ha puesto sobre la mesa antes de afirmar la real — ve directa a la afirmación (\"El problema es que compartas sin criterio\", NO \"El problema no es que compartas demasiado. Es que compartas sin criterio\").";
}

function buildCarruselP({brand,intencion,estilo,motor,tema}){
  const isKR=brand==="kr";
  // Detecta la palabra clave del CTA venga escrita como "CTA:", "palabra clave:" o "palabra:",
  // en vez de exigir una única frase literal (antes esto hacía que instrucciones como
  // "CTA: PRECIO" se ignoraran por completo).
  const kwMatch = tema.match(/(?:palabra\s*clave|palabra|cta)\s*:\s*([a-záéíóúñ0-9]+)/i);
  const mc = kwMatch ? `\nMANYCHAT: la palabra clave que el usuario pidió es "${kwMatch[1].toUpperCase()}". El CTA final DEBE usarla tal cual, tipo: "Comenta ${kwMatch[1].toUpperCase()} si quieres [beneficio]". No inventes otra palabra ni otro tipo de cierre.` : '';
  const vs=intencion==="Venta Sutil"?"\nVENTA SUTIL: sin precio. CTA indirecto.":'';
  const em={Negativo:"NEGATIVO: empieza con el error.",["Info Secreta"]:"INFO SECRETA: revela algo contraintuitivo.",Controversial:"CONTROVERSIAL: incomoda a la mayoría."};
  const mm={Aspiración:"ASPIRACIÓN.",Educación:"EDUCACIÓN.",Impacto:"IMPACTO.",Reflejo:"REFLEJO."};
  return "TEMA: "+tema+"\nINTENCIÓN: "+intencion+"\n"+em[estilo]+"\n"+mm[motor]+vs+mc+`

COHERENCIA NARRATIVA (importante): todas las slides deben seguir desarrollando el MISMO ángulo psicológico o argumento concreto que abre la slide 1 — no te desvíes hacia consejos genéricos del tema general. Si la portada habla de un autoengaño o creencia concreta (p. ej. "crees que cobrar poco es humildad, en realidad es miedo"), las slides 2-6 profundizan en ESE mismo argumento específico (por qué pasa, qué lo sostiene, cómo se rompe), no en generalidades sobre el tema que podrían aparecer en cualquier carrusel de precios/ventas/contenido.

Devuelve EXACTAMENTE este formato. Respeta las instrucciones de formato de cada slide:

SLIDE_1_HERO
[Primera parte: afirmación incompleta, corta (idealmente 3-4 palabras, pero SIEMPRE una unidad gramatical completa — nunca cortes a media frase solo por acortar), que genera tensión. DEBE terminar antes del giro semántico.]
ACENTO: [El giro o contradicción que cierra la idea, corto (idealmente 4-6 palabras) PERO ante todo una frase gramaticalmente completa y correcta en español — si acortarla a 5 palabras la deja coja o sin sentido (por ejemplo, un "quién" sin sujeto ni verbo), añade las palabras que hagan falta aunque se pase del conteo orientativo. La corrección gramatical manda siempre sobre el número exacto de palabras. DEBE contradecir o sorprender lo anterior. Solo inclúyelo si el copy lo pide de forma natural; si no aporta, omite la línea ACENTO por completo.]
✓ "Tu clon no puede" / "reemplazarte. Puede."
✓ "No has dejado de publicar" / "por vaga."
✓ "La pregunta equivocada" / "es quién eres tú para no cobrar."
✗ NUNCA cortes en medio de una afirmación sin giro.
✗ NUNCA sacrifiques que la frase tenga sujeto y verbo completos solo por acortar palabras.

SLIDE_2_PROBLEMA
[Párrafo corto de 20-35 palabras. Incluye una situación o ejemplo concreto y reconocible (algo que la lectora haya hecho o pensado literalmente, no una idea abstracta) — que se vea reflejada, no que reciba un concepto. Solo texto.]

SLIDE_3_SOLUCION
[Párrafo corto de 20-35 palabras. Igual que arriba: ancla la idea en un ejemplo o momento concreto, no la dejes flotando como concepto abstracto. Solo texto.]

SLIDE_4_FEATURES
[Título corto en una línea, luego lista con • al inicio de cada ítem. Mínimo 3, máximo 5 ítems. Máximo 5 palabras por ítem.]

SLIDE_5_DETALLES
[Párrafo de 20-35 palabras. Incluye un ejemplo concreto y reconocible, no una afirmación abstracta suelta — la lectora debe poder pensar "esto me pasó a mí" al leerlo. Solo texto.]

SLIDE_6_COMO
[Título corto en una línea, luego pasos numerados 1. 2. 3. Máximo 3 pasos. Máximo 8 palabras por paso.]

SLIDE_7_CTA
[15-20 palabras de cierre con CTA. Si el tema incluye una palabra clave ManyChat, úsala aquí. Si no, usa un CTA genérico como "Escríbenos" o "Cuéntanos en comentarios". El texto sale en peso normal por defecto (ya no todo en negrita): marca en **negrita** solo la palabra clave o la acción concreta que quieres que resalte (por ejemplo **PRECIO** o **Escríbenos**), no la frase entera — así se lee con jerarquía en vez de plana o pesada.]

CAPTION
[Hook en primeras 125 chars, 3-4 párrafos, CTA${PROFILE.firma?", firma: "+PROFILE.firma:""}]

VARIACIONES_GANCHO
1. [fórmula] | [hook alternativo] | [motor]
2. [fórmula] | [hook alternativo] | [motor]
3. [fórmula] | [hook alternativo] | [motor]`;
}

function buildReelP({brand,intencion,estilo,motor,tema}){
  const em={Negativo:"NEGATIVO: empieza con el error o la frustración.",["Info Secreta"]:"INFO SECRETA: revela algo contraintuitivo.",Controversial:"CONTROVERSIAL: incomoda a la mayoría."};
  const mm={Aspiración:"ASPIRACIÓN.",Educación:"EDUCACIÓN.",Impacto:"IMPACTO.",Reflejo:"REFLEJO."};
  return "TEMA: "+tema+"\nINTENCIÓN: "+intencion+"\n"+em[estilo]+"\n"+mm[motor]+`

Escribe el GUION HABLADO de un Reel de 20-35 segundos, pensado para grabarse o narrarse sobre B-roll, NO para carrusel.

REGLAS DE FORMATO (muy importantes):
- Cada línea es UNA frase corta que se dice de un tirón (máximo 12 palabras), pensada para aparecer como una caja de subtítulo en pantalla.
- Una línea por gancho/idea. Nada de párrafos largos, nada de bullets, nada de numeración, nada de etiquetas tipo "Línea 1:".
- Primera línea = el gancho, debe enganchar en el primer segundo.
- Última línea = cierre con llamada a la acción, corta y conversacional (nunca "aprende a construir X que resuene").
- Entre 6 y 10 líneas en total.
- Sin markdown, sin comillas envolventes, sin emojis salvo que aporten muchísimo.

Devuelve SOLO las líneas del guion, una por línea, sin ningún texto adicional antes o después.`;
}

function buildSimpleP(kind,{brand,intencion,estilo,motor,tema}){
  const isKR=brand==="kr";
  const em={Negativo:"NEGATIVO: empieza con el error.",["Info Secreta"]:"INFO SECRETA: revela algo contraintuitivo.",Controversial:"CONTROVERSIAL: incomoda a la mayoría."};
  const mm={Aspiración:"ASPIRACIÓN.",Educación:"EDUCACIÓN.",Impacto:"IMPACTO.",Reflejo:"REFLEJO."};
  const base = "TEMA: "+tema+"\nINTENCIÓN: "+intencion+"\n"+em[estilo]+"\n"+mm[motor]+"\n\n";
  if(kind==="Post-Caption"){
    return base+`Escribe SOLO el caption de un post de Instagram (foto o carrusel ya existente, este texto es el pie de foto). Hook en las primeras 125 caracteres, 3-4 párrafos cortos, CTA conversacional al final${PROFILE.firma?", firma: "+PROFILE.firma:""}. Sin markdown, sin hashtags salvo que se pidan.`;
  }
  if(kind==="Stories"){
    return base+`Escribe una SECUENCIA de 4-6 Stories de Instagram. Cada Story es UNA línea corta (máximo 15 palabras), pensada para una pantalla vertical con poco texto. Una línea por Story, sin numerar, sin etiquetas. La última incluye un sticker de interacción sugerido entre corchetes, por ejemplo [ENCUESTA: Sí / No] o [CAJA DE PREGUNTAS].`;
  }
  if(kind==="Email"){
    return base+`Escribe un email siguiendo la voz de la marca (ver reglas de sistema): arranca desde una experiencia propia concreta, cierre impredecible, y si hay algo que vender aparece como consecuencia natural, nunca como párrafo de venta separado. Incluye asunto y preencabezado al principio, luego el cuerpo.`;
  }
  return base;
}

function buildCaptionFromSlidesP(slidesText, isKR){
  return `Aquí tienes el texto ya escrito de un carrusel de Instagram, slide por slide:

${slidesText}

No modifiques ni reescribas las slides. Tu única tarea es escribir el CAPTION (pie de foto) y las variaciones de gancho para este carrusel ya existente, coherentes con lo que dice.

Devuelve EXACTAMENTE este formato:

CAPTION
[Hook en primeras 125 chars, 3-4 párrafos, CTA${PROFILE.firma?", firma: "+PROFILE.firma:""}]

VARIACIONES_GANCHO
1. [fórmula] | [hook alternativo] | [motor]
2. [fórmula] | [hook alternativo] | [motor]
3. [fórmula] | [hook alternativo] | [motor]`;
}

function parseCaptionOnly(text){
  const cs=text.indexOf("CAPTION"), vs=text.indexOf("VARIACIONES_GANCHO");
  return{
    caption: cs!==-1?text.slice(cs+7,vs!==-1?vs:undefined).trim():"",
    variaciones: vs!==-1?text.slice(vs+18).trim():""
  };
}


function buildP(kind, params){
  if(kind==="Carrusel") return buildCarruselP(params);
  if(kind==="Reel") return buildReelP(params);
  return buildSimpleP(kind, params);
}

function parseC(text){
  const tags=["SLIDE_1_HERO","SLIDE_2_PROBLEMA","SLIDE_3_SOLUCION","SLIDE_4_FEATURES","SLIDE_5_DETALLES","SLIDE_6_COMO","SLIDE_7_CTA"];
  const labels=["HERO","PROBLEMA","SOLUCIÓN","FEATURES","DETALLES","CÓMO","CTA"];
  const slides=tags.map((tag,i)=>{
    const s=text.indexOf(tag);if(s===-1)return{text:"",label:labels[i],bgImg:null,acento:null,showAvatar:true,sizeAdj:1,offsetX:0,offsetY:0,lineOffsets:[],moveMode:"linea",bgVideoURL:null,imgOffsetX:0,imgOffsetY:0,editMode:"texto",textColor:null,stickers:[],titleFont:null,weightOverride:null};
    let end=i<tags.length-1?text.indexOf(tags[i+1]):text.indexOf("CAPTION");
    let raw=text.slice(s+tag.length,end===-1?undefined:end).trim();
    // A veces el modelo añade una línea separadora (---, ***, ___) entre secciones
    // aunque no se le pida; si se cuela al final del texto de una slide, se dibujaría
    // como si fuera contenido real. La quitamos.
    raw=raw.replace(/\n?\s*[-_*]{3,}\s*$/,"").trim();
    let acento=null;
    if(i===0){const am=raw.match(/ACENTO:\s*(.+)/i);if(am){acento=am[1].trim();raw=raw.replace(/ACENTO:\s*.+/i,"").trim();}}
    return{text:raw,label:labels[i],bgImg:null,acento,showAvatar:true,sizeAdj:1,offsetX:0,offsetY:0,lineOffsets:[],moveMode:"linea",bgVideoURL:null,imgOffsetX:0,imgOffsetY:0,editMode:"texto",textColor:null,stickers:[],titleFont:null,weightOverride:null};
  });
  const cs=text.indexOf("CAPTION"),vs=text.indexOf("VARIACIONES_GANCHO");
  return{slides,caption:cs!==-1?text.slice(cs+7,vs!==-1?vs:undefined).trim():"",variaciones:vs!==-1?text.slice(vs+18).trim():""};
}

/* ---------- Modo Copy Exacto: sin API, sin reescritura ---------- */
function parseExact(input){
  let text = String(input||"").trim();
  // Separar CAPTION si existe (y, si también hay VARIACIONES_GANCHO detrás, no se lo lleva por delante)
  let caption = "";
  const capIdx = text.search(/(^|\n)\s*CAPTION\s*:?/i);
  if(capIdx !== -1){
    let rest = text.slice(capIdx).replace(/^\s*/,"").replace(/^CAPTION\s*:?\s*/i,"");
    const varIdx = rest.search(/(^|\n)\s*VARIACIONES_GANCHO\s*:?/i);
    if(varIdx !== -1) rest = rest.slice(0, varIdx);
    caption = rest.trim();
    text = text.slice(0, capIdx).trim();
  }
  // Trocear: 1) marcadores "Slide 1:" / "Sl.1" / "S1"  2) "---"  3) párrafos
  // Si hay marcadores, se corta SOLO por marcadores (los párrafos internos de una slide se respetan)
  const markerRe = /(?:^|\n)\s*s(?:lide|l)?\s*\.?\s*\d+\s*[:.\-)]?[ \t]*/i;
  let blocks;
  if(markerRe.test(text)){
    blocks = text.split(/(?:^|\n)\s*s(?:lide|l)?\s*\.?\s*\d+\s*[:.\-)]?[ \t]*/gi);
  } else if(/\n\s*---+\s*(\n|$)/.test(text)){
    blocks = text.split(/\n\s*---+\s*(?:\n|$)/);
  } else {
    blocks = text.split(/\n\s*\n/);
  }
  blocks = blocks.map(s=>s.trim()).filter(Boolean);
  const slides = blocks.map((raw,i)=>{
    let acento=null;
    if(i===0){
      const am=raw.match(/ACENTO:\s*(.+)/i);
      if(am){acento=am[1].trim();raw=raw.replace(/ACENTO:\s*.+/i,"").trim();}
    }
    const label = i===0 ? "PORTADA" : (i===blocks.length-1 ? "CTA" : "SLIDE "+(i+1));
    return {text:raw,label,bgImg:null,acento,showAvatar:true,sizeAdj:1,offsetX:0,offsetY:0,lineOffsets:[],moveMode:"linea",bgVideoURL:null,imgOffsetX:0,imgOffsetY:0,editMode:"texto",textColor:null,stickers:[],literalFormat:true,titleFont:null,weightOverride:null};
  });
  return {slides,caption,variaciones:""};
}
/* ---------------------------------------------------------------- */

function copyText(text, onDone) {
  const fallback = () => {
    const ta=document.createElement("textarea");ta.value=text;
    ta.style.position="fixed";ta.style.opacity="0";
    document.body.appendChild(ta);ta.select();
    try{document.execCommand("copy");}catch(e){}
    document.body.removeChild(ta);
    onDone();
  };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(onDone).catch(fallback);
  } else fallback();
}

/* ---------- Lector tolerante (el modelo puede añadir texto extra o cambiar etiquetas) ---------- */
const TAGS = ["SLIDE_1_HERO","SLIDE_2_PROBLEMA","SLIDE_3_SOLUCION","SLIDE_4_FEATURES","SLIDE_5_DETALLES","SLIDE_6_COMO","SLIDE_7_CTA"];
const TAG_WORDS = ["HERO","PROBLEMA","SOLUCION","FEATURES","DETALLES","COMO","CTA"];

function normalizeTags(raw){
  let t = String(raw||"");
  // quita cercos de markdown y numeración decorativa alrededor de las etiquetas
  t = t.replace(/^\s*```[a-z]*\s*$/gim, "");
  t = t.replace(/[*_#>`]+/g, (m, off, s) => (/[A-Za-z0-9]/.test(s[off-1]||"") && /[A-Za-z0-9]/.test(s[off+m.length]||"")) ? m : "");
  TAGS.forEach((tag, i) => {
    const word = TAG_WORDS[i];
    const re = new RegExp("^[\\s\\-–—:]*slide\\s*[_\\s\\-–—.:]*"+(i+1)+"\\s*[_\\s\\-–—.:]*(?:"+word+"|"+word.replace("SOLUCION","SOLUCIÓN").replace("COMO","CÓMO")+")?\\s*:?[ \\t]*$", "gim");
    t = t.replace(re, "\n"+tag+"\n");
  });
  t = t.replace(/^[\s\-–—:]*variaciones[_\s\-–—]*gancho\s*:?[ \t]*$/gim, "\nVARIACIONES_GANCHO\n");
  t = t.replace(/^[\s\-–—:]*caption\s*:?[ \t]*$/gim, "\nCAPTION\n");
  return t;
}

export function parseCarruselTolerante(raw){
  const text = normalizeTags(raw);
  const found = TAGS.filter(tag => text.indexOf(tag) !== -1).length;
  if (found >= 3) {
    const out = parseC(text);
    out.slides = out.slides.filter(s => (s.text||"").trim() || (s.acento||"").trim());
    if (out.slides.length >= 3) return out;
  }
  return parseExact(text);
}

export function getProfile(){ return PROFILE; }

export {
  W, H, BRANDS, PROFILE_DEFAULT, applyProfile,
  SlideCanvas, EditPanel,
  sysP, buildCarruselP, buildCaptionFromSlidesP, parseCaptionOnly,
  parseC, parseExact, copyText, dlZip, dlOne, FONT_LOADS, slugify,
};
