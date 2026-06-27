const canvas = document.querySelector("#fx");
const ctx = canvas.getContext("2d", { alpha: true });

const colors = ["#4285f4", "#ea4335", "#fbbc04", "#34a853"];
const darkColors = ["#8a4fff", "#00f0ff", "#ffd54f", "#ffffff", "#88c8f7", "#b4a0e5"];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
const state = {
  frame: 0,
  particles: [],
  ripples: [],
  pointer: { x: innerWidth * 0.5, y: innerHeight * 0.5 },
  running: true,
  lastTouchAt: 0,
  pattern: {
    type: null,        // 'text', 'constellation', 'wuxing'
    name: null,        // 例如 'INFP', 'Aries', 'fire'
    points: [],        // 目标相对坐标 [{x, y, isBright, nodeIndex}]
    strength: 0.0      // 凝聚插值强度 (0.0 到 1.0)
  }
};

function drawConstellationPattern(ctx, name) {
  ctx.clearRect(0, 0, 512, 512);
  ctx.save();

  // 1. 设置极粗的线宽和圆角，保证凝聚出的 3D 图腾厚实、明显、边界清晰
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 32;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (name === 'Aries') { // 白羊座 ♈
    // 左半边角
    ctx.beginPath();
    ctx.moveTo(256, 370);
    ctx.quadraticCurveTo(240, 210, 150, 190);
    ctx.quadraticCurveTo(100, 180, 120, 235);
    ctx.quadraticCurveTo(140, 275, 180, 225);
    ctx.stroke();

    // 右半边角
    ctx.beginPath();
    ctx.moveTo(256, 370);
    ctx.quadraticCurveTo(272, 210, 362, 190);
    ctx.quadraticCurveTo(412, 180, 392, 235);
    ctx.quadraticCurveTo(372, 275, 332, 225);
    ctx.stroke();

  } else if (name === 'Taurus') { // 金牛座 ♉
    // 头部圆圈
    ctx.beginPath();
    ctx.arc(256, 315, 75, 0, Math.PI * 2);
    ctx.stroke();

    // 牛角弯弧
    ctx.beginPath();
    ctx.moveTo(140, 155);
    ctx.quadraticCurveTo(256, 260, 372, 155);
    ctx.stroke();

  } else if (name === 'Gemini') { // 双子座 ♊
    // 左、右平行竖柱
    ctx.beginPath();
    ctx.moveTo(200, 160); ctx.lineTo(200, 352);
    ctx.moveTo(312, 160); ctx.lineTo(312, 352);
    ctx.stroke();

    // 上、下装饰横弧
    ctx.beginPath();
    ctx.arc(256, 175, 90, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(256, 337, 90, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

  } else if (name === 'Cancer') { // 巨蟹座 ♋
    ctx.lineWidth = 28;
    // 右上圆圈与左伸尾巴
    ctx.beginPath();
    ctx.arc(320, 200, 48, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(320, 152);
    ctx.quadraticCurveTo(160, 152, 160, 220);
    ctx.stroke();

    // 左下圆圈与右伸尾巴
    ctx.beginPath();
    ctx.arc(192, 312, 48, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(192, 360);
    ctx.quadraticCurveTo(352, 360, 352, 292);
    ctx.stroke();

  } else if (name === 'Leo') { // 狮子座 ♌
    ctx.lineWidth = 30;
    ctx.beginPath();
    ctx.arc(160, 300, 36, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(196, 300);
    ctx.bezierCurveTo(240, 300, 240, 140, 320, 140);
    ctx.bezierCurveTo(390, 140, 410, 350, 350, 350);
    ctx.bezierCurveTo(320, 350, 310, 300, 330, 280);
    ctx.stroke();

  } else if (name === 'Virgo') { // 处女座 ♍
    ctx.lineWidth = 26;
    ctx.beginPath();
    // 第一竖
    ctx.moveTo(140, 180);
    ctx.lineTo(140, 330);

    // 第二竖（拱门）
    ctx.moveTo(140, 230);
    ctx.quadraticCurveTo(180, 160, 210, 230);
    ctx.lineTo(210, 330);

    // 第三竖连折线（穿环尾巴）
    ctx.moveTo(210, 230);
    ctx.quadraticCurveTo(250, 160, 280, 230);
    ctx.lineTo(280, 300);
    ctx.quadraticCurveTo(280, 380, 340, 380);
    ctx.quadraticCurveTo(380, 380, 380, 320);
    ctx.quadraticCurveTo(380, 260, 310, 260);
    ctx.quadraticCurveTo(270, 260, 290, 330);
    ctx.lineTo(330, 390);
    ctx.stroke();

  } else if (name === 'Libra') { // 天秤座 ♎
    // 下底横线
    ctx.beginPath();
    ctx.moveTo(120, 360);
    ctx.lineTo(392, 360);
    ctx.stroke();

    // 上Ω拱形线
    ctx.beginPath();
    ctx.moveTo(120, 290);
    ctx.lineTo(190, 290);
    ctx.arc(256, 290, 66, Math.PI, 0, false);
    ctx.lineTo(392, 290);
    ctx.stroke();

  } else if (name === 'Scorpio') { // 天蝎座 ♏
    ctx.lineWidth = 26;
    ctx.beginPath();
    // 第一竖
    ctx.moveTo(140, 180);
    ctx.lineTo(140, 340);

    // 第二竖（拱门）
    ctx.moveTo(140, 230);
    ctx.quadraticCurveTo(180, 160, 210, 230);
    ctx.lineTo(210, 340);

    // 第三竖连天蝎尖刺尾巴
    ctx.moveTo(210, 230);
    ctx.quadraticCurveTo(250, 160, 280, 230);
    ctx.lineTo(280, 310);
    ctx.quadraticCurveTo(280, 370, 330, 370);
    ctx.lineTo(360, 320);
    ctx.stroke();

    // 实心锐利箭头
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(330, 330);
    ctx.lineTo(380, 310);
    ctx.lineTo(365, 360);
    ctx.closePath();
    ctx.fill();

  } else if (name === 'Sagittarius') { // 射手座 ♐
    // 斜长箭身
    ctx.beginPath();
    ctx.moveTo(150, 362);
    ctx.lineTo(362, 150);
    ctx.stroke();

    // 箭头外折线
    ctx.beginPath();
    ctx.moveTo(300, 150);
    ctx.lineTo(362, 150);
    ctx.lineTo(362, 212);
    ctx.stroke();

    // 横栏木
    ctx.beginPath();
    ctx.moveTo(210, 260);
    ctx.lineTo(290, 340);
    ctx.stroke();

  } else if (name === 'Capricorn') { // 摩羯座 ♑
    ctx.lineWidth = 28;
    ctx.beginPath();
    // 左侧的 V 字形牛角
    ctx.moveTo(140, 200);
    ctx.lineTo(185, 300);
    ctx.lineTo(225, 200);
    // 右侧向上拱起的环与交叉鱼尾
    ctx.quadraticCurveTo(260, 130, 300, 200);
    ctx.lineTo(300, 290);
    ctx.quadraticCurveTo(300, 360, 350, 360);
    ctx.quadraticCurveTo(390, 360, 390, 310);
    ctx.quadraticCurveTo(390, 260, 345, 260);
    ctx.quadraticCurveTo(320, 260, 330, 300);
    ctx.lineTo(365, 370);
    ctx.stroke();

  } else if (name === 'Aquarius') { // 水瓶座 ♒
    // 双道平行锯齿折线
    ctx.beginPath();
    ctx.moveTo(120, 210);
    ctx.lineTo(165, 175); ctx.lineTo(210, 210);
    ctx.lineTo(255, 175); ctx.lineTo(300, 210);
    ctx.lineTo(345, 175); ctx.lineTo(390, 210);

    ctx.moveTo(120, 300);
    ctx.lineTo(165, 265); ctx.lineTo(210, 300);
    ctx.lineTo(255, 265); ctx.lineTo(300, 300);
    ctx.lineTo(345, 265); ctx.lineTo(390, 300);
    ctx.stroke();

  } else if (name === 'Pisces') { // 双鱼座 ♓
    // 完美的二次贝塞尔对称弧线与中央斜插横梁，100% 呼应主流 Pisces 图腾 (圆弧向内凹陷)
    ctx.beginPath();
    // 左半边圆弧 (向内/右凹陷，开口朝左)
    ctx.moveTo(160, 130);
    ctx.quadraticCurveTo(220, 256, 160, 382);
    // 右半边圆弧 (向内/左凹陷，开口朝右)
    ctx.moveTo(352, 130);
    ctx.quadraticCurveTo(292, 256, 352, 382);
    ctx.stroke();

    // 贯穿中轴的横向线段
    ctx.beginPath();
    ctx.moveTo(105, 256);
    ctx.lineTo(407, 256);
    ctx.stroke();
  }

  ctx.restore();
}

// 高精细度 Canvas 几何图形与图腾绘制函数（用于提取精美的粒子云图腾）
function drawHeart(ctx) {
  ctx.clearRect(0, 0, 512, 512);
  ctx.save();
  ctx.translate(256, 210);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(0, -50);
  ctx.bezierCurveTo(-140, -180, -250, -40, 0, 180);
  ctx.bezierCurveTo(250, -40, 140, -180, 0, -50);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawAstrologyWheel(ctx) {
  ctx.clearRect(0, 0, 512, 512);
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3.5;
  
  // 外环
  ctx.beginPath();
  ctx.arc(256, 256, 175, 0, Math.PI * 2);
  ctx.stroke();
  
  // 内环
  ctx.beginPath();
  ctx.arc(256, 256, 125, 0, Math.PI * 2);
  ctx.stroke();

  // 十二宫射线分割
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30) * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(angle) * 125, 256 + Math.sin(angle) * 125);
    ctx.lineTo(256 + Math.cos(angle) * 175, 256 + Math.sin(angle) * 175);
    ctx.stroke();
  }

  // 核心星图星辉（采用类似于 Gemini 的四角星芒，科技占星感十足）
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  const R = 48;
  ctx.moveTo(256, 256 - R);
  ctx.quadraticCurveTo(256, 256, 256 + R, 256);
  ctx.quadraticCurveTo(256, 256, 256, 256 + R);
  ctx.quadraticCurveTo(256, 256, 256 - R, 256);
  ctx.quadraticCurveTo(256, 256, 256, 256 - R);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWood(ctx) {
  ctx.clearRect(0, 0, 512, 512);
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 22;
  ctx.lineCap = "round";
  
  // 树干
  ctx.beginPath();
  ctx.moveTo(256, 420);
  ctx.lineTo(256, 200);
  ctx.stroke();
  
  // 左分支
  ctx.beginPath();
  ctx.moveTo(256, 310);
  ctx.quadraticCurveTo(170, 270, 140, 190);
  ctx.stroke();
  
  // 右分支
  ctx.beginPath();
  ctx.moveTo(256, 310);
  ctx.quadraticCurveTo(342, 270, 372, 190);
  ctx.stroke();

  // 顶部分叉
  ctx.beginPath();
  ctx.moveTo(256, 200);
  ctx.lineTo(190, 110);
  ctx.moveTo(256, 200);
  ctx.lineTo(322, 110);
  ctx.stroke();
  ctx.restore();
}

function drawFire(ctx) {
  ctx.clearRect(0, 0, 512, 512);
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(256, 430);
  // 左侧火焰大弧度
  ctx.bezierCurveTo(100, 340, 120, 160, 256, 50);
  // 回卷气旋
  ctx.bezierCurveTo(180, 170, 290, 230, 256, 310);
  // 右侧小跃火
  ctx.bezierCurveTo(330, 270, 380, 330, 256, 430);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawEarth(ctx) {
  ctx.clearRect(0, 0, 512, 512);
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  // 描绘连绵高耸的山脉轮廓
  ctx.moveTo(40, 390);
  ctx.lineTo(150, 220);
  ctx.lineTo(240, 340);
  ctx.lineTo(320, 140);
  ctx.lineTo(400, 280);
  ctx.lineTo(470, 390);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMetal(ctx) {
  ctx.clearRect(0, 0, 512, 512);
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 18;
  ctx.lineJoin = "round";
  
  // 钻石上半部
  ctx.beginPath();
  ctx.moveTo(160, 180);
  ctx.lineTo(352, 180);
  ctx.lineTo(436, 240);
  ctx.lineTo(76, 240);
  ctx.closePath();
  ctx.stroke();

  // 钻石底尖
  ctx.beginPath();
  ctx.moveTo(76, 240);
  ctx.lineTo(256, 420);
  ctx.lineTo(436, 240);
  ctx.stroke();

  // 结晶刻面
  ctx.beginPath();
  ctx.moveTo(160, 180);
  ctx.lineTo(256, 240);
  ctx.lineTo(352, 180);
  ctx.moveTo(256, 240);
  ctx.lineTo(256, 420);
  ctx.moveTo(76, 240);
  ctx.lineTo(256, 240);
  ctx.lineTo(436, 240);
  ctx.stroke();
  ctx.restore();
}

function drawWater(ctx) {
  ctx.clearRect(0, 0, 512, 512);
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  // 水滴轮廓
  ctx.moveTo(256, 70);
  ctx.bezierCurveTo(120, 230, 120, 430, 256, 430);
  ctx.bezierCurveTo(392, 430, 392, 230, 256, 70);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function roundedRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawEnneagramSymbol(ctx, dominant) {
  ctx.clearRect(0, 0, 512, 512);
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const cx = 256;
  const cy = 256;
  const R = 150;
  const nodes = {};

  for (let i = 1; i <= 9; i++) {
    const angle = -Math.PI / 2 + (i - 9) * (Math.PI * 2 / 9);
    nodes[i] = {
      x: cx + Math.cos(angle) * R,
      y: cy + Math.sin(angle) * R
    };
  }

  // 1. Outer circle
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Triangle 9-3-6-9
  ctx.beginPath();
  ctx.moveTo(nodes[9].x, nodes[9].y);
  ctx.lineTo(nodes[3].x, nodes[3].y);
  ctx.lineTo(nodes[6].x, nodes[6].y);
  ctx.closePath();
  ctx.stroke();

  // 3. Hexad 1-4-2-8-5-7-1
  ctx.beginPath();
  ctx.moveTo(nodes[1].x, nodes[1].y);
  ctx.lineTo(nodes[4].x, nodes[4].y);
  ctx.lineTo(nodes[2].x, nodes[2].y);
  ctx.lineTo(nodes[8].x, nodes[8].y);
  ctx.lineTo(nodes[5].x, nodes[5].y);
  ctx.lineTo(nodes[7].x, nodes[7].y);
  ctx.closePath();
  ctx.stroke();

  // 4. Highlight dominant node
  const dom = parseInt(dominant);
  if (dom >= 1 && dom <= 9) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(nodes[dom].x, nodes[dom].y, 24, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Center number
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 72px 'Inter', 'Outfit', 'PingFang SC', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(dominant, cx, cy);

  ctx.restore();
}

function drawTarotCards(ctx, name) {
  ctx.clearRect(0, 0, 512, 512);
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  let reversedList = [false, false, false];
  try {
    reversedList = JSON.parse(name);
  } catch (e) {}

  const drawCardFrame = (cx, cy, w, h) => {
    ctx.beginPath();
    roundedRect(ctx, cx - w/2, cy - h/2, w, h, 12);
    ctx.stroke();
    ctx.beginPath();
    roundedRect(ctx, cx - w/2 + 6, cy - h/2 + 6, w - 12, h - 12, 6);
    ctx.stroke();
  };

  const w = 90, h = 150;

  // Card 1: Past
  const cx1 = 130, cy1 = 256;
  drawCardFrame(cx1, cy1, w, h);
  ctx.save();
  ctx.translate(cx1, cy1);
  if (reversedList[0]) ctx.rotate(Math.PI);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-4, 0, 20, -Math.PI/2, Math.PI/2, false);
  ctx.arc(4, 0, 20, Math.PI/2, -Math.PI/2, true);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Card 2: Present
  const cx2 = 256, cy2 = 256;
  drawCardFrame(cx2, cy2, w, h);
  ctx.save();
  ctx.translate(cx2, cy2);
  if (reversedList[1]) ctx.rotate(Math.PI);
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI*2);
  ctx.fill();
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 18, Math.sin(angle) * 18);
    ctx.lineTo(Math.cos(angle) * 26, Math.sin(angle) * 26);
    ctx.stroke();
  }
  ctx.restore();

  // Card 3: Future
  const cx3 = 382, cy3 = 256;
  drawCardFrame(cx3, cy3, w, h);
  ctx.save();
  ctx.translate(cx3, cy3);
  if (reversedList[2]) ctx.rotate(Math.PI);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  const rOuter = 22;
  const rInner = 9;
  for (let i = 0; i < 5; i++) {
    const a1 = -Math.PI/2 + i * Math.PI * 2 / 5;
    const a2 = -Math.PI/2 + (i + 0.5) * Math.PI * 2 / 5;
    if (i === 0) ctx.moveTo(Math.cos(a1) * rOuter, Math.sin(a1) * rOuter);
    else ctx.lineTo(Math.cos(a1) * rOuter, Math.sin(a1) * rOuter);
    ctx.lineTo(Math.cos(a2) * rInner, Math.sin(a2) * rInner);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawDarkTriangle(ctx, dominant) {
  ctx.clearRect(0, 0, 512, 512);
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const pN = { x: 256, y: 140 };
  const pM = { x: 130, y: 350 };
  const pP = { x: 382, y: 350 };

  ctx.beginPath();
  ctx.moveTo(pN.x, pN.y);
  ctx.lineTo(pM.x, pM.y);
  ctx.lineTo(pP.x, pP.y);
  ctx.closePath();
  ctx.stroke();

  let activePt = pN;
  let labelPos = { x: 256, y: 95 };
  let mPos = { x: 80, y: 375 };
  let pPos = { x: 432, y: 375 };

  if (dominant === 'Machiavellianism') {
    activePt = pM;
  } else if (dominant === 'Psychopathy') {
    activePt = pP;
  }

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(activePt.x, activePt.y, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "bold 24px 'Inter', 'Outfit', 'PingFang SC', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (dominant === 'Machiavellianism') {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px 'Inter', 'Outfit', 'PingFang SC', sans-serif";
  }
  ctx.fillText("马基", mPos.x, mPos.y);

  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "bold 24px 'Inter', 'Outfit', 'PingFang SC', sans-serif";
  if (dominant === 'Psychopathy') {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px 'Inter', 'Outfit', 'PingFang SC', sans-serif";
  }
  ctx.fillText("反社", pPos.x, pPos.y);

  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "bold 24px 'Inter', 'Outfit', 'PingFang SC', sans-serif";
  if (dominant === 'Narcissism') {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px 'Inter', 'Outfit', 'PingFang SC', sans-serif";
  }
  ctx.fillText("自恋", labelPos.x, labelPos.y);

  ctx.restore();
}

function drawHumanDesignBody(ctx, type) {
  ctx.clearRect(0, 0, 512, 512);
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const centers = {
    1: { x: 256, y: 70, type: 'up-tri', s: 16 },
    2: { x: 256, y: 120, type: 'down-tri', s: 20 },
    3: { x: 256, y: 180, type: 'square', s: 24 },
    4: { x: 256, y: 250, type: 'diamond', s: 24 },
    5: { x: 310, y: 275, type: 'up-tri', s: 14 },
    6: { x: 256, y: 330, type: 'square', s: 28 },
    7: { x: 190, y: 330, type: 'left-tri', s: 20 },
    8: { x: 322, y: 330, type: 'right-tri', s: 20 },
    9: { x: 256, y: 420, type: 'square', s: 28 }
  };

  let defined = [];
  if (type === '生产者') {
    defined = [3, 4, 6, 9];
  } else if (type === '显示生产者') {
    defined = [3, 4, 6];
  } else if (type === '显示者') {
    defined = [3, 5, 9];
  } else if (type === '投射者') {
    defined = [1, 2, 4];
  } else if (type === '反映者') {
    defined = [];
  }

  const isDefined = (id) => defined.includes(id);

  const channels = [
    [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [4, 7], [4, 8],
    [7, 6], [8, 6], [7, 9], [8, 9], [6, 9]
  ];

  channels.forEach(([c1, c2]) => {
    const p1 = centers[c1];
    const p2 = centers[c2];
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    if (isDefined(c1) && isDefined(c2)) {
      ctx.lineWidth = 12;
      ctx.strokeStyle = "#ffffff";
    } else {
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    }
    ctx.stroke();
  });

  Object.entries(centers).forEach(([idStr, c]) => {
    const id = parseInt(idStr);
    const { x, y, type: shapeType, s } = c;
    
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;

    ctx.beginPath();
    if (shapeType === 'square') {
      ctx.rect(x - s, y - s, s * 2, s * 2);
    } else if (shapeType === 'diamond') {
      ctx.moveTo(x, y - s * 1.3);
      ctx.lineTo(x + s * 1.3, y);
      ctx.lineTo(x, y + s * 1.3);
      ctx.lineTo(x - s * 1.3, y);
      ctx.closePath();
    } else if (shapeType === 'up-tri') {
      ctx.moveTo(x, y - s * 1.2);
      ctx.lineTo(x + s, y + s * 0.8);
      ctx.lineTo(x - s, y + s * 0.8);
      ctx.closePath();
    } else if (shapeType === 'down-tri') {
      ctx.moveTo(x, y + s * 1.2);
      ctx.lineTo(x + s, y - s * 0.8);
      ctx.lineTo(x - s, y - s * 0.8);
      ctx.closePath();
    } else if (shapeType === 'left-tri') {
      ctx.moveTo(x - s * 1.2, y);
      ctx.lineTo(x + s * 0.8, y - s);
      ctx.lineTo(x + s * 0.8, y + s);
      ctx.closePath();
    } else if (shapeType === 'right-tri') {
      ctx.moveTo(x + s * 1.2, y);
      ctx.lineTo(x - s * 0.8, y - s);
      ctx.lineTo(x - s * 0.8, y + s);
      ctx.closePath();
    }

    if (isDefined(id)) {
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }
    ctx.stroke();
  });

  ctx.restore();
}

function isCompactViewport() {
  return innerWidth <= 768 || coarsePointer;
}

function getMaxParticles() {
  if (reduceMotion) return 36;
  return isCompactViewport() ? 120 : 280;
}

const DPR_LIMIT = 1.25;

function isDarkMode() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, DPR_LIMIT);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function spawn(x, y, amount = 1, force = 1, isAmbient = false) {
  const room = getMaxParticles() - state.particles.length;
  const count = Math.max(0, Math.min(amount, room));
  const currentColors = isDarkMode() ? darkColors : colors;

  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (0.08 + Math.random() * 0.45) * force;
    state.particles.push({
      x,
      y,
      originX: x,
      originY: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      age: 0,
      life: isAmbient ? Infinity : (180 + Math.random() * 200),
      size: 0.6 + Math.random() * 2.0,
      color: currentColors[Math.floor(Math.random() * currentColors.length)],
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.02 + Math.random() * 0.04,
      targetX: null,
      targetY: null,
      isBright: false,
      nodeIndex: null
    });
  }
}

function seed() {
  state.particles = [];
  const amount = reduceMotion ? 24 : (isCompactViewport() ? 70 : 180);
  for (let i = 0; i < amount; i += 1) {
    spawn(Math.random() * innerWidth, Math.random() * innerHeight, 1, 0.1, true);
  }
}

function getDisplacedPoint(x, y) {
  if (reduceMotion) return { x, y };

  let dx = state.pointer.x - x;
  let dy = state.pointer.y - y;
  let dist = Math.sqrt(dx * dx + dy * dy);
  
  let targetX = x;
  let targetY = y;

  const gravityRadius = isCompactViewport() ? 160 : 200;
  if (dist < gravityRadius && dist > 0.1) {
    const pull = Math.pow(1 - dist / gravityRadius, 2) * (isCompactViewport() ? 10 : 16);
    targetX += (dx / dist) * pull;
    targetY += (dy / dist) * pull;
  }

  for (const ripple of state.ripples) {
    const rdx = x - ripple.x;
    const rdy = y - ripple.y;
    const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
    
    const waveFrontThickness = 50;
    const diff = Math.abs(rdist - ripple.radius);
    if (diff < waveFrontThickness) {
      const waveForce = (1 - diff / waveFrontThickness) * ripple.alpha * 15;
      if (rdist > 0.1) {
        targetX += (rdx / rdist) * waveForce;
        targetY += (rdy / rdist) * waveForce;
      }
    }
  }

  return { x: targetX, y: targetY };
}

function drawGravityGrid() {
  if (reduceMotion) return;
  // 当粒子凝聚特效高度激活时，降低物理网格线的对比度，避免视觉干扰
  const fade = state.pattern.strength || 0.0;
  const spacing = isCompactViewport() ? 86 : 60;
  const cols = Math.ceil(innerWidth / spacing) + 1;
  const rows = Math.ceil(innerHeight / spacing) + 1;
  const dark = isDarkMode();
  
  ctx.strokeStyle = dark 
    ? `rgba(0, 240, 255, ${0.04 * (1 - fade * 0.7)})` 
    : `rgba(66, 133, 244, ${0.04 * (1 - fade * 0.7)})`;
  ctx.lineWidth = 0.5;

  for (let r = 0; r < rows; r++) {
    ctx.beginPath();
    for (let c = 0; c < cols; c++) {
      const gx = c * spacing;
      const gy = r * spacing;
      const disp = getDisplacedPoint(gx, gy);
      if (c === 0) ctx.moveTo(disp.x, disp.y);
      else ctx.lineTo(disp.x, disp.y);
    }
    ctx.stroke();
  }

  for (let c = 0; c < cols; c++) {
    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
      const gx = c * spacing;
      const gy = r * spacing;
      const disp = getDisplacedPoint(gx, gy);
      if (r === 0) ctx.moveTo(disp.x, disp.y);
      else ctx.lineTo(disp.x, disp.y);
    }
    ctx.stroke();
  }
}

function drawParticle(particle) {
  const alpha = Math.max(0, 1 - particle.age / particle.life);
  const pulse = 0.5 + Math.sin(particle.twinkle) * 0.5;
  
  // 凝聚的主星点亮度增强，粒子尺寸相应扩大
  const isBright = particle.isBright && (state.pattern.strength > 0.5);
  const baseAlpha = isDarkMode() ? 0.85 : 0.6;
  ctx.globalAlpha = isBright 
    ? alpha * (0.6 + pulse * 0.4) 
    : alpha * pulse * baseAlpha;

  ctx.fillStyle = isBright 
    ? (isDarkMode() ? "#00f0ff" : "#4285f4") 
    : particle.color;

  const currentSize = isBright 
    ? particle.size * 2.2 
    : particle.size;

  ctx.beginPath();
  ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
  ctx.fill();
}

function updateAutoPointer() {
  if (!isCompactViewport() || reduceMotion) return;
  // 如果图案凝聚特效高度激活，暂停自动指针的波澜，以维持字形安静
  if (state.pattern.strength > 0.8) return;

  const time = state.frame * 0.012;
  const centerX = innerWidth * 0.5;
  const centerY = innerHeight * 0.42;
  const radiusX = Math.min(innerWidth * 0.26, 110);
  const radiusY = Math.min(innerHeight * 0.12, 90);
  state.pointer.x = centerX + Math.cos(time) * radiusX + Math.sin(time * 0.47) * 24;
  state.pointer.y = centerY + Math.sin(time * 0.82) * radiusY;

  if (state.frame % 120 === 0 && state.ripples.length < 2) {
    state.ripples.push({
      x: state.pointer.x,
      y: state.pointer.y,
      radius: 4,
      maxRadius: 150,
      speed: 2.4,
      alpha: 1.0
    });
  }
}

// 通用高精度像素点阵采样器
function getTexturePoints(drawFn) {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 160;
  tempCanvas.height = 160;
  const tctx = tempCanvas.getContext("2d");
  
  drawFn(tctx);

  const imgData = tctx.getImageData(0, 0, 160, 160);
  const rawPoints = [];
  const step = isCompactViewport() ? 5 : 4; // 步长决定点阵致密度

  for (let y = 0; y < 160; y += step) {
    for (let x = 0; x < 160; x += step) {
      const alpha = imgData.data[(y * 160 + x) * 4 + 3];
      if (alpha > 100) {
        rawPoints.push({
          x: x - 80,
          y: y - 80,
          isBright: Math.random() > 0.82 // 约18%的概率产生高亮粒子
        });
      }
    }
  }

  // 限制粒子点数，防止性能开销过大
  const maxPoints = isCompactViewport() ? 130 : 240;
  if (rawPoints.length > maxPoints) {
    const shuffled = [...rawPoints].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, maxPoints);
  }
  return rawPoints;
}

// 基于采样器的文本提取
function getTextPoints(text) {
  return getTexturePoints((tctx) => {
    tctx.fillStyle = "#fff";
    tctx.font = "bold 26px 'Inter', 'Outfit', 'PingFang SC', sans-serif";
    tctx.textAlign = "center";
    tctx.textBaseline = "middle";
    tctx.fillText(text, 80, 80);
  });
}

function setPattern(type, name) {
  if (reduceMotion) return;
  state.pattern.type = type;
  state.pattern.name = name;
  state.pattern.strength = 0.0;

  const wasStopped = !state.running;
  state.running = true;

  const agCanvas = document.getElementById('antigravityCanvas');
  const fxCanvas = document.getElementById('fx');
  if (agCanvas) {
    agCanvas.style.transition = 'opacity 0.8s ease';
    agCanvas.style.opacity = '0.62'; // 常规凝聚态半透明，确保文字可读性的同时背景更加清晰明显
  }
  if (fxCanvas) {
    fxCanvas.style.transition = 'opacity 0.8s ease';
    fxCanvas.style.opacity = '0'; // 彻底淡出 2D canvas，防止任何 2D 粒子残留或乱线干扰 3D 图腾
  }

  // ─── 核心：触发 WebGL 3D 浮雕级粒子凝聚 ───
  if (window.__northstarAntigravity) {
    if (type === 'text') {
      if (name === '❤') {
        window.__northstarAntigravity.setCustomShape('heart', drawHeart);
      } else {
        window.__northstarAntigravity.setCustomShape(name, (tctx) => {
          tctx.clearRect(0, 0, 512, 512);
          tctx.save();
          tctx.fillStyle = "#ffffff";
          tctx.font = "bold 96px 'Inter', 'Outfit', 'PingFang SC', sans-serif";
          tctx.textAlign = "center";
          tctx.textBaseline = "middle";
          tctx.fillText(name, 256, 256);
          tctx.restore();
        });
      }
    } else if (type === 'constellation') {
      window.__northstarAntigravity.setCustomShape(name, (tctx) => drawConstellationPattern(tctx, name));
    } else if (type === 'wuxing') {
      let drawFn = null;
      if (name === 'wood') drawFn = drawWood;
      else if (name === 'fire') drawFn = drawFire;
      else if (name === 'earth') drawFn = drawEarth;
      else if (name === 'metal') drawFn = drawMetal;
      else if (name === 'water') drawFn = drawWater;
      if (drawFn) {
        window.__northstarAntigravity.setCustomShape(name, drawFn);
      }
    } else if (type === 'enneagram') {
      window.__northstarAntigravity.setCustomShape(name, (tctx) => drawEnneagramSymbol(tctx, name));
    } else if (type === 'tarot') {
      window.__northstarAntigravity.setCustomShape(name, (tctx) => drawTarotCards(tctx, name));
    } else if (type === 'darktriad') {
      window.__northstarAntigravity.setCustomShape(name, (tctx) => drawDarkTriangle(tctx, name));
    } else if (type === 'humandesign') {
      window.__northstarAntigravity.setCustomShape(name, (tctx) => drawHumanDesignBody(tctx, name));
    }
  }

  state.pattern.points = [];

  // 清空 2D 粒子绑定，彻底杜绝任何历史残留
  state.particles.forEach((particle) => {
    particle.targetX = null;
    particle.targetY = null;
    particle.isBright = false;
    particle.nodeIndex = null;
  });

  // 凝聚时触发一波华丽的微小引力波涟漪
  if (state.ripples.length < 3) {
    state.ripples.push({
      x: innerWidth * 0.5,
      y: innerHeight * 0.42,
      radius: 5,
      maxRadius: isCompactViewport() ? 190 : 280,
      speed: 4.5,
      alpha: 1.0
    });
  }

  if (wasStopped) {
    tick();
  }
}

function clearPattern() {
  state.pattern.type = null;
  state.pattern.name = null;
  state.pattern.points = [];
  state.pattern.strength = 0.0;

  const agCanvas = document.getElementById('antigravityCanvas');
  const fxCanvas = document.getElementById('fx');
  const hasReady = document.documentElement.classList.contains("antigravity-ready");
  
  // ─── 核心：释放 3D WebGL 形态 ───
  if (window.__northstarAntigravity) {
    window.__northstarAntigravity.clearCustomShape();
  }

  if (agCanvas && hasReady) {
    agCanvas.style.opacity = '1';
  }
  if (fxCanvas && hasReady) {
    fxCanvas.style.opacity = '1'; // 恢复 2D 粒子普通背景的完整显示
  }

  // 释放粒子束缚，重回普通背景尘粒，设置随机生命期衰变
  state.particles.forEach((particle) => {
    particle.targetX = null;
    particle.targetY = null;
    particle.isBright = false;
    particle.nodeIndex = null;
    if (particle.life === Infinity) {
      particle.life = 180 + Math.random() * 200;
      particle.age = 0;
    }
  });
}

function tick() {
  if (!state.running) return;
  if (document.documentElement.classList.contains("antigravity-ready") && !state.pattern.type) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    state.running = false;
    return;
  }

  state.frame += 1;
  updateAutoPointer();
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  ctx.globalCompositeOperation = "source-over";

  const dark = isDarkMode();
  const strength = state.pattern.strength;

  // 1. 绘制引力空间网格
  drawGravityGrid();

  // 2. 绘制扩散波纹
  state.ripples = state.ripples.filter(ripple => {
    ripple.radius += ripple.speed;
    ripple.alpha = 1 - (ripple.radius / ripple.maxRadius);
    
    ctx.strokeStyle = dark ? `rgba(0, 240, 255, ${ripple.alpha * 0.15})` : `rgba(66, 133, 244, ${ripple.alpha * 0.1})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    ctx.stroke();

    return ripple.radius < ripple.maxRadius;
  });

  // 3. 绘制星线（图腾模式由密集粒子自勾勒，不需要生硬折线连线）
  if (state.pattern.type && state.pattern.type !== 'text') {
    // 密集图腾模式自发光，直接呈现高清晰度粒子形态
  } else {
    // 常规模式：在邻近粒子之间绘制淡光星轨连线
    if (!reduceMotion && state.particles.length > 1 && !isCompactViewport()) {
      const lineFade = 1 - strength * 0.8; // 凝聚程度高时，减弱乱线连接，使字形清晰
      ctx.lineWidth = dark ? 0.5 : 0.4;
      for (let i = 0; i < state.particles.length; i += 1) {
        for (let j = i + 1; j < state.particles.length; j += 1) {
          const p1 = state.particles[i];
          const p2 = state.particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          const limit = dark ? 100 : 80;
          if (dist < limit) {
            const alpha = (1 - dist / limit) * 0.22 * lineFade;
            if (alpha > 0.01) {
              ctx.globalAlpha = alpha;
              ctx.strokeStyle = dark ? "rgba(0, 240, 255, 0.25)" : "rgba(66, 133, 244, 0.18)";
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }
    }
  }

  // 4. 自发产生新背景尘埃
  if (!reduceMotion && state.frame % (isCompactViewport() ? 12 : 6) === 0) {
    const centerX = innerWidth * 0.5;
    const centerY = innerHeight * 0.42;
    const radius = Math.min(innerWidth, innerHeight) * (0.2 + Math.random() * 0.26);
    const angle = performance.now() * 0.0001 + Math.random() * Math.PI * 2;
    spawn(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius * 0.42, 1, 0.3);
  }

  // 5. 更新并渲染所有粒子
  state.particles = state.particles.filter((particle) => {
    particle.age += 1;
    particle.twinkle += particle.twinkleSpeed;
    
    // 微漂移轨迹计算
    const driftRadius = particle.life === Infinity ? 12 : 0;
    const driftSpeed = 0.008;
    const driftX = particle.originX + Math.sin(state.frame * driftSpeed + particle.twinkle) * driftRadius;
    const driftY = particle.originY + Math.cos(state.frame * driftSpeed + particle.twinkle) * driftRadius;

    // 默认回弹拉力
    const homeDx = driftX - particle.x;
    const homeDy = driftY - particle.y;
    let restoreStrength = 0.015;

    // 鼠标引力响应计算
    if (state.pointer.x && state.pointer.y && strength < 0.8) {
      const dx = particle.x - state.pointer.x;
      const dy = particle.y - state.pointer.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const pointerRadius = isCompactViewport() ? 190 : 260;
      if (dist < pointerRadius && dist > 2) {
        const nx = dx / dist;
        const ny = dy / dist;
        
        const targetR = isCompactViewport() ? 54 : 70;
        const diff = dist - targetR;
        const influence = Math.pow(1 - dist / pointerRadius, 1.5);
        const radialForce = -diff * 0.06 * influence; 
        
        const swirlSpeed = 0.003;
        const tx = -ny * swirlSpeed;
        const ty = nx * swirlSpeed;

        particle.vx += nx * radialForce + tx;
        particle.vy += ny * radialForce + ty;

        restoreStrength *= (1 - influence);
      }
    }

    // 叠加默认拉力
    particle.vx += homeDx * restoreStrength;
    particle.vy += homeDy * restoreStrength;

    // 叠加凝聚引力
    if (particle.targetX !== null && particle.targetX !== undefined) {
      const targetDx = particle.targetX - particle.x;
      const targetDy = particle.targetY - particle.y;
      
      // 随着插值强度的提升，增加向目标的吸附力，同时弱化其他微扰力
      const factor = 0.052 * strength;
      particle.vx = particle.vx * (1 - strength) + targetDx * factor;
      particle.vy = particle.vy * (1 - strength) + targetDy * factor;
    }

    particle.x += particle.vx;
    particle.y += particle.vy;

    // 稳定摩擦系数
    particle.vx *= 0.94;
    particle.vy *= 0.94;

    drawParticle(particle);

    return (particle.life === Infinity || particle.age < particle.life) && 
           particle.x > -40 && particle.x < innerWidth + 40 && 
           particle.y > -40 && particle.y < innerHeight + 40;
  });

  // 平滑推进凝聚强度的插值器
  if (state.pattern.points.length > 0) {
    state.pattern.strength = Math.min(1.0, state.pattern.strength + 0.022);
  }

  window.__particleCount = state.particles.length;
  requestAnimationFrame(tick);
}

window.addEventListener("resize", () => {
  resize();
  seed();
  // 屏幕缩放时若在凝聚状态，清空以防坐标错乱
  if (state.pattern.points.length > 0) {
    clearPattern();
  }
});

function moveGravityPoint(clientX, clientY, options = {}) {
  // 如果凝聚特效完全开启，屏蔽鼠标引起的涟漪和爆炸粒子，防止字形被震散
  if (state.pattern.strength > 0.8) return;

  const dx = clientX - state.pointer.x;
  const dy = clientY - state.pointer.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  state.pointer.x = clientX;
  state.pointer.y = clientY;

  const rippleLimit = isCompactViewport() ? 3 : 6;
  const rippleMinDistance = isCompactViewport() ? 28 : 18;
  if (options.ripple !== false && dist > rippleMinDistance && state.ripples.length < rippleLimit) {
    state.ripples.push({
      x: clientX,
      y: clientY,
      radius: 4,
      maxRadius: isCompactViewport() ? 170 : 240,
      speed: isCompactViewport() ? 2.8 : 3.5,
      alpha: 1.0
    });
  }

  const spawnEvery = isCompactViewport() ? 4 : 2;
  if (!reduceMotion && options.spawn !== false && state.frame % spawnEvery === 0) {
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = angle1 + Math.PI;
    const r = isCompactViewport() ? 52 : 70;
    spawn(clientX + Math.cos(angle1) * r, clientY + Math.sin(angle1) * r, 1, isCompactViewport() ? 0.28 : 0.4);
    if (!isCompactViewport()) {
      spawn(clientX + Math.cos(angle2) * r, clientY + Math.sin(angle2) * r, 1, 0.4);
    }
  }
}

window.addEventListener("pointermove", (event) => {
  if (isCompactViewport()) return;
  if (event.pointerType === "touch" && Date.now() - state.lastTouchAt < 80) return;
  moveGravityPoint(event.clientX, event.clientY);
});

window.addEventListener("touchstart", (event) => {
  if (isCompactViewport()) return;
  const touch = event.touches && event.touches[0];
  if (!touch) return;
  state.lastTouchAt = Date.now();
  moveGravityPoint(touch.clientX, touch.clientY, { ripple: true, spawn: true });
}, { passive: true });

window.addEventListener("touchmove", (event) => {
  if (isCompactViewport()) return;
  const touch = event.touches && event.touches[0];
  if (!touch) return;
  state.lastTouchAt = Date.now();
  moveGravityPoint(touch.clientX, touch.clientY, { ripple: true, spawn: true });
}, { passive: true });

window.__northstarFx = {
  getState() {
    return {
      particles: state.particles.length,
      ripples: state.ripples.length,
      pointer: { ...state.pointer },
      compact: isCompactViewport(),
      patternType: state.pattern.type,
      patternName: state.pattern.name,
      strength: state.pattern.strength
    };
  },
  moveGravityPoint,
  setPattern,
  clearPattern
};

document.addEventListener("visibilitychange", () => {
  state.running = !document.hidden;
  if (state.running) requestAnimationFrame(tick);
});

resize();
seed();
requestAnimationFrame(tick);
