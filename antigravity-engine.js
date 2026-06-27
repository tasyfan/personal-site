/* Generated from Desktop/Antigravity-Animation-Design.
 * Original source is preserved in design-sources/antigravity-animation-design.
 * Do not edit this generated file directly; run npm run import:antigravity.
 */
;(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || typeof THREE === 'undefined') return;

  try {
    class JA {
          constructor() {
            this.MAX_VERTICES = 256;
            this.MAX_VERTICES_MASK = this.MAX_VERTICES - 1;
            this.amplitude = 1;
            this.scale = 1;
            this.r = [];
            for (var e = 0; e < this.MAX_VERTICES; ++e) {
              this.r.push(Math.random());
            }
          }
          getVal(e) {
            var t = e * this.scale,
                i = Math.floor(t),
                r = t - i,
                o = r * r * (3 - 2 * r),
                s = i % this.MAX_VERTICES_MASK,
                a = (s + 1) % this.MAX_VERTICES_MASK,
                l = this.lerp(this.r[s], this.r[a], o);
            return l * this.amplitude;
          }
          lerp(e, t, i) {
            return e * (1 - i) + t * i;
          }
        }
    
        // Helper functions
        function mapRange(n, e, t, i, r) {
          return (n - e) * (r - i) / (t - e) + i;
        }
    
        // Poisson Disk Sampling
        function poissonDiskSampling(width, height, minDistance, maxDistance, tries) {
          const r = minDistance + Math.random() * (maxDistance - minDistance);
          const cellSize = r / Math.sqrt(2);
          const gridWidth = Math.ceil(width / cellSize);
          const gridHeight = Math.ceil(height / cellSize);
          const grid = new Array(gridWidth * gridHeight).fill(null);
          const points = [];
          const active = [];
    
          function insertPoint(p) {
            points.push(p);
            active.push(p);
            const col = Math.floor(p[0] / cellSize);
            const row = Math.floor(p[1] / cellSize);
            grid[col + row * gridWidth] = p;
          }
    
          insertPoint([Math.random() * width, Math.random() * height]);
    
          while (active.length > 0) {
            const idx = Math.floor(Math.random() * active.length);
            const p = active[idx];
            let found = false;
    
            for (let i = 0; i < tries; i++) {
              const angle = Math.random() * Math.PI * 2;
              const dist = r + Math.random() * r;
              const q = [p[0] + Math.cos(angle) * dist, p[1] + Math.sin(angle) * dist];
    
              if (q[0] >= 0 && q[0] < width && q[1] >= 0 && q[1] < height) {
                const col = Math.floor(q[0] / cellSize);
                const row = Math.floor(q[1] / cellSize);
                let tooClose = false;
    
                for (let x = Math.max(0, col - 2); x <= Math.min(gridWidth - 1, col + 2); x++) {
                  for (let y = Math.max(0, row - 2); y <= Math.min(gridHeight - 1, row + 2); y++) {
                    const neighbor = grid[x + y * gridWidth];
                    if (neighbor) {
                      const dx = neighbor[0] - q[0];
                      const dy = neighbor[1] - q[1];
                      if (dx * dx + dy * dy < r * r) {
                        tooClose = true;
                        break;
                      }
                    }
                  }
                  if (tooClose) break;
                }
    
                if (!tooClose) {
                  insertPoint(q);
                  found = true;
                  break;
                }
              }
            }
    
            if (!found) {
              active.splice(idx, 1);
            }
          }
    
          return points;
        }
    
        function drawClaude(ctx) {
          ctx.clearRect(0, 0, 512, 512);
          ctx.save();
          ctx.translate(64, 64);
          ctx.scale(16, 16);
          ctx.fillStyle = "#ffffff";
          const path = new Path2D("m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z");
          ctx.fill(path);
          ctx.restore();
        }
    
        function drawChatGPT(ctx) {
          ctx.clearRect(0, 0, 512, 512);
          ctx.save();
          ctx.translate(64, 64);
          ctx.scale(16, 16);
          ctx.fillStyle = "#ffffff";
          const path = new Path2D("M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z");
          ctx.fill(path);
          ctx.restore();
        }
    
        function drawGemini(ctx) {
          ctx.clearRect(0, 0, 512, 512);
          ctx.save();
          ctx.translate(256, 256);
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          const R = 170;
          ctx.moveTo(0, -R);
          ctx.quadraticCurveTo(0, 0, R, 0);
          ctx.quadraticCurveTo(0, 0, 0, R);
          ctx.quadraticCurveTo(0, 0, -R, 0);
          ctx.quadraticCurveTo(0, 0, 0, -R);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
    
        function generateTargetTexture(drawFn) {
          const canvas = document.createElement("canvas");
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext("2d");
          drawFn(ctx);
          const imgData = ctx.getImageData(0, 0, 512, 512).data;
          const targets = [];
          for (let y = 0; y < 512; y++) {
            for (let x = 0; x < 512; x++) {
              const idx = (y * 512 + x) * 4;
              const alpha = imgData[idx + 3];
              if (alpha > 30) {
                const nx = (x / 512) * 2 - 1;
                const ny = -((y / 512) * 2 - 1);
                targets.push({ x: nx, y: ny });
              }
            }
          }
          if (targets.length === 0) {
            for (let i = 0; i < 128 * 128; i++) {
              targets.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 });
            }
          }
          
          // Shuffle targets array
          for (let i = targets.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = targets[i];
            targets[i] = targets[j];
            targets[j] = temp;
          }
          
          const texArray = new Float32Array(128 * 128 * 4);
          for (let i = 0; i < 128 * 128; i++) {
            const tPoint = targets[i % targets.length];
            const jitterX = (Math.random() - 0.5) * 0.006;
            const jitterY = (Math.random() - 0.5) * 0.006;
            const idx = i * 4;
            texArray[idx + 0] = tPoint.x * 0.42 + jitterX;
            texArray[idx + 1] = tPoint.y * 0.42 + jitterY;
            texArray[idx + 2] = 0;
            texArray[idx + 3] = 0;
          }
          const dataTex = new THREE.DataTexture(texArray, 128, 128, THREE.RGBAFormat, THREE.FloatType);
          dataTex.needsUpdate = true;
          return dataTex;
        }
    
        // GLSL Shader Source Code
        const snoiseGLSL = `
          vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
          vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
          float permute(float x){return floor(mod(((x*34.0)+1.0)*x, 289.0));}
          vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
          float taylorInvSqrt(float r){return 1.79284291400159 - 0.85373472095314 * r;}
    
          float snoise(vec2 v){
            const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m ; m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
          }
    
          float snoise(vec3 v){
            const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
            const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
            vec3 i  = floor(v + dot(v, C.yyy) );
            vec3 x0 =   v - i + dot(i, C.xxx) ;
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min( g.xyz, l.zxy );
            vec3 i2 = max( g.xyz, l.zxy );
            vec3 x1 = x0 - i1 + 1.0 * C.xxx;
            vec3 x2 = x0 - i2 + 2.0 * C.xxx;
            vec3 x3 = x0 - 1. + 3.0 * C.xxx;
            i = mod(i, 289.0 );
            vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
            float n_ = 1.0/7.0;
            vec3  ns = n_ * D.wyz - D.xzx;
            vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_ );
            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            vec4 b0 = vec4( x.xy, y.xy );
            vec4 b1 = vec4( x.zw, y.zw );
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
            vec3 p0 = vec3(a0.xy,h.x);
            vec3 p1 = vec3(a0.zw,h.y);
            vec3 p2 = vec3(a1.xy,h.z);
            vec3 p3 = vec3(a1.zw,h.w);
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
            p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
          }
    
          vec4 grad4(float j, vec4 ip){
            const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
            vec4 p,s;
            p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
            p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
            s = vec4(lessThan(p, vec4(0.0)));
            p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;
            return p;
          }
    
          float snoise(vec4 v){
            const vec2  C = vec2( 0.138196601125010504, 0.309016994374947451);
            vec4 i  = floor(v + dot(v, C.yyyy) );
            vec4 x0 = v -   i + dot(i, C.xxxx);
            vec4 i0;
            vec3 isX = step( x0.yzw, x0.xxx );
            vec3 isYZ = step( x0.zww, x0.yyz );
            i0.x = isX.x + isX.y + isX.z; i0.yzw = 1.0 - isX;
            i0.y += isYZ.x + isYZ.y; i0.zw += 1.0 - isYZ.xy;
            i0.z += isYZ.z; i0.w += 1.0 - isYZ.z;
            vec4 i3 = clamp( i0, 0.0, 1.0 );
            vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
            vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );
            vec4 x1 = x0 - i1 + 1.0 * C.xxxx;
            vec4 x2 = x0 - i2 + 2.0 * C.xxxx;
            vec4 x3 = x0 - i3 + 3.0 * C.xxxx;
            vec4 x4 = x0 - 1.0 + 4.0 * C.xxxx;
            i = mod(i, 289.0);
            float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
            vec4 j1 = permute( permute( permute( permute (i.w + vec4(i1.w, i2.w, i3.w, 1.0 )) + i.z + vec4(i1.z, i2.z, i3.z, 1.0 )) + i.y + vec4(i1.y, i2.y, i3.y, 1.0 )) + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));
            vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;
            vec4 p0 = grad4(j0,   ip); vec4 p1 = grad4(j1.x, ip); vec4 p2 = grad4(j1.y, ip); vec4 p3 = grad4(j1.z, ip); vec4 p4 = grad4(j1.w, ip);
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
            p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w; p4 *= taylorInvSqrt(dot(p4,p4));
            vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
            vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);
            m0 = m0 * m0; m1 = m1 * m1;
            return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 ))) + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;
          }
        `;
    
        const simVertexShader = `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `;
    
        const simFragmentShader = `
          precision highp float;
          varying vec2 vUv;
          uniform sampler2D uPosition;
          uniform sampler2D uPosRefs;
          uniform vec2 uRingPos;
          uniform float uTime;
          uniform float uDeltaTime;
          uniform float uRingRadius;
          uniform float uRingWidth;
          uniform float uRingWidth2;
          uniform float uRingDisplacement;
          uniform vec2 uMouseVelocity;
          uniform vec4 uObstacles[4];
          uniform int uObstacleCount;
          uniform sampler2D uTargetPos;
          uniform sampler2D uPrevTargetPos;
          uniform float uTransitionProgress;
          uniform float uMorphProgress;
          uniform float uTargetScale;
    
          ${snoiseGLSL}
    
          void main() {
            vec2 simTexCoords = gl_FragCoord.xy / vec2(128.0, 128.0);
            vec4 pFrame = texture2D(uPosition, simTexCoords);
    
            float scale = pFrame.z;
            float velocity = pFrame.w;
            vec2 refPos = texture2D(uPosRefs, simTexCoords).xy;
    
            float time = uTime * .5;
            vec2 curentPos = refPos;
    
            vec2 pos = pFrame.xy;
            pos *= .8;
    
            float dist = distance(curentPos.xy, uRingPos);
            float noise0 = snoise(vec3(curentPos.xy * .2 + vec2(18.4924, 72.9744), time * 0.5));
            float dist1 = distance(curentPos.xy + (noise0 * .005), uRingPos);
    
            float t = smoothstep(uRingRadius - (uRingWidth * 2.), uRingRadius, dist) - smoothstep(uRingRadius, uRingRadius + uRingWidth, dist1);
            float t2 = smoothstep(uRingRadius - (uRingWidth2 * 2.), uRingRadius, dist) - smoothstep(uRingRadius, uRingRadius + uRingWidth2, dist1);
            float t3 = smoothstep(uRingRadius + uRingWidth2, uRingRadius, dist);
    
            t = pow(t, 2.);
            t2 = pow(t2, 3.);
    
            t += t2 * 3.;
            t += t3 * .4;
            t += snoise(vec3(curentPos.xy * 30. + vec2(11.4924, 12.9744), time * 0.5)) * t3 * .5;
    
            float nS = snoise(vec3(curentPos.xy * 2. + vec2(18.4924, 72.9744), time * 0.5));
            t += pow((nS + 1.5) * .5, 2.) * .6;
    
            float noise1 = snoise(vec3(curentPos.xy * 4. + vec2(88.494, 32.4397), time * 0.35));
            float noise2 = snoise(vec3(curentPos.xy * 4. + vec2(50.904, 120.947), time * 0.35));
            float noise3 = snoise(vec3(curentPos.xy * 20. + vec2(18.4924, 72.9744), time * .5));
            float noise4 = snoise(vec3(curentPos.xy * 20. + vec2(50.904, 120.947), time * .5));
    
            vec2 disp = vec2(noise1, noise2) * .03;
            disp += vec2(noise3, noise4) * .005;
    
            disp.x += sin((refPos.x * 20.) + (time * 4.)) * .02 * clamp(dist, 0., 1.);
            disp.y += cos((refPos.y * 20.) + (time * 3.)) * .02 * clamp(dist, 0., 1.);
    
            pos -= (uRingPos - (curentPos + disp)) * pow(t2, .75) * uRingDisplacement;
    
            // Feature 1: Fluid Tangential Vortex Field
            vec2 toCenter = curentPos.xy - uRingPos;
            float distToMouse = length(toCenter);
            if (distToMouse > 0.001) {
              vec2 tangent = vec2(-toCenter.y, toCenter.x) / distToMouse;
              float mouseSpeed = length(uMouseVelocity);
              float vortexStrength = mouseSpeed * 0.5 + 0.05;
              float vortexFalloff = smoothstep(0.6, 0.0, distToMouse);
              float crossDir = sign(toCenter.x * uMouseVelocity.y - toCenter.y * uMouseVelocity.x);
              if (crossDir == 0.0) crossDir = 1.0;
              pos += tangent * t2 * vortexStrength * vortexFalloff * crossDir * 0.3;
            }
    
            // Feature 3: DOM Element Physical Avoidance Force Field
            vec2 particleWorld = curentPos + disp + (pos * .25);
            vec2 obstacleForce = vec2(0.0);
            float margin = 0.04;
            for (int i = 0; i < 4; i++) {
              if (i >= uObstacleCount) break;
              vec4 obs = uObstacles[i];
              float cx = (obs.x + obs.z) * 0.5;
              float cy = (obs.y + obs.w) * 0.5;
              float rx = (obs.z - obs.x) * 0.5;
              float ry = (obs.w - obs.y) * 0.5;
              float dx = particleWorld.x - cx;
              float dy = particleWorld.y - cy;
              float distX = abs(dx) - rx;
              float distY = abs(dy) - ry;
              if (distX < margin && distY < margin) {
                vec2 pushDir = vec2(0.0);
                float forceScale = 0.0;
                if (distX > distY) {
                  pushDir.x = sign(dx);
                  if (distX > 0.0) {
                    forceScale = smoothstep(margin, 0.0, distX);
                  } else {
                    forceScale = 1.0 - distX * 5.0;
                  }
                } else {
                  pushDir.y = sign(dy);
                  if (distY > 0.0) {
                    forceScale = smoothstep(margin, 0.0, distY);
                  } else {
                    forceScale = 1.0 - distY * 5.0;
                  }
                }
                obstacleForce += pushDir * forceScale * 0.08;
              }
            }
            pos += obstacleForce;
    
            float scaleDiff = t - scale;
            scaleDiff *= .2;
            scale += scaleDiff;
    
            // Morphing mix with explosion transition blast
            vec4 prevTargetData = texture2D(uPrevTargetPos, simTexCoords);
            vec4 targetData = texture2D(uTargetPos, simTexCoords);
            vec2 prevTargetPos = prevTargetData.xy;
            vec2 targetPos = targetData.xy;
    
            // 基于粒子纹理坐标噪波计算个性化起步延迟，制造分批凝聚的云雾流光感
            float myDelay = snoise(vec3(simTexCoords * 12.0, 88.15)) * 0.18 + 0.18; // 范围在 0.0 到 0.36 之间
            float myMorphProgress = smoothstep(0.0, 1.0, clamp((uMorphProgress - myDelay) / (1.0 - 0.36), 0.0, 1.0));
            float myTransitionProgress = smoothstep(0.0, 1.0, clamp((uTransitionProgress - myDelay) / (1.0 - 0.36), 0.0, 1.0));
    
            // Smooth transition target mixing with sequential delays
            vec2 mixedTarget = mix(prevTargetPos, targetPos, myTransitionProgress) * uTargetScale;
    
            // Dynamic transition explosion blast force
            float t_p = uTransitionProgress;
            float explosionForce = sin(pow(t_p, 0.8) * 3.14159265) * 1.5;
    
            // Compute radial outward push and turbulent noise vector
            vec2 toCenterExplode = refPos.xy;
            vec2 radialForce = normalize(toCenterExplode + vec2(0.0001));
            float noiseValX = snoise(refPos * 12.0 + vec2(uTime * 0.05, 11.23));
            float noiseValY = snoise(refPos * 12.0 + vec2(23.45, uTime * 0.05));
            vec2 randomForce = vec2(noiseValX, noiseValY);
    
            vec2 explosionOffset = (radialForce * 0.35 + randomForce * 0.25) * explosionForce;
    
            vec2 nextPos = curentPos + disp + (pos * .25);
            vec2 finalPos = mix(nextPos, mixedTarget, myMorphProgress) + explosionOffset * myMorphProgress;
    
            // Particle pulse expansion and speed wake during transition blast
            scale += explosionForce * 0.5 * myMorphProgress;
    
            velocity *= .5;
            velocity += scale * .25;
            velocity += explosionForce * 0.2 * myMorphProgress;
    
            gl_FragColor = vec4(finalPos, scale, velocity);
          }
        `;
    
        const renderVertexShader = `
          attribute vec4 seeds;
          uniform sampler2D uPosition;
          uniform float uTime;
          uniform float uParticleScale;
          uniform float uPixelRatio;
          uniform int uColorScheme;
          uniform float uIsHovering;
          uniform float uPulseProgress;
    
          varying vec4 vSeeds;
          varying float vVelocity;
          varying vec2 vLocalPos;
          varying vec2 vScreenPos;
          varying float vScale;
    
          ${snoiseGLSL}
    
          void main() {
            vec4 pos = texture2D(uPosition, uv);
            vSeeds = seeds;
    
            float noiseX = snoise(vec3(vec2(pos.xy * 10.), uTime * .2 + 100.));
            float noiseY = snoise(vec3(vec2(pos.xy * 10.), uTime * .2));
    
            float noiseX2 = snoise(vec3(vec2(pos.xy * .5), uTime * .15 + 45.));
            float noiseY2 = snoise(vec3(vec2(pos.xy * .5), uTime * .15 + 87.));
    
            // make a smooth disc pulse wave
            float cDist = length(pos.xy) * 1.;
            float progress = uPulseProgress;
            float t = smoothstep(progress - .25, progress, cDist) - smoothstep(progress, progress + .25, cDist);
            t *= smoothstep(1., .0, cDist);
            pos.xy *= 1. + (t * .02);
    
            float dist = smoothstep(0., 0.9, pos.w);
            dist = mix(0., dist, uIsHovering);
    
            pos.y += noiseY * 0.005 * dist;
            pos.x += noiseX * 0.005 * dist;
            pos.y += noiseY2 * 0.02;
            pos.x += noiseX2 * 0.02;
    
            vVelocity = pos.w;
            vScale = pos.z;
            vLocalPos = pos.xy;
            vec4 viewSpace = modelViewMatrix * vec4(vec3(pos.xy, 0.), 1.0);
    
            gl_Position = projectionMatrix * viewSpace;
            vScreenPos = gl_Position.xy;
    
            float minScale = .25;
            minScale += float(uColorScheme) * .75;
            gl_PointSize = ((vScale * 9.5) * (uPixelRatio * 0.5) * uParticleScale) + (minScale * uPixelRatio);
          }
        `;
    
        const renderFragmentShader = `
          precision highp float;
    
          varying vec4 vSeeds;
          varying vec2 vScreenPos;
          varying vec2 vLocalPos;
          varying float vScale;
          varying float vVelocity;
    
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          uniform vec3 uColor3;
          uniform vec2 uRingPos;
          uniform vec2 uRez;
          uniform float uAlpha;
          uniform float uTime;
          uniform int uColorScheme;
          uniform float uMorphProgress;
    
          ${snoiseGLSL}
    
          #define PI 3.1415926535897932384626433832795
    
          float sdRoundBox( in vec2 p, in vec2 b, in vec4 r )
          {
              r.xy = (p.x>0.0)?r.xy : r.zw;
              r.x  = (p.y>0.0)?r.x  : r.y;
              vec2 q = abs(p)-b+r.x;
              return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r.x;
          }
    
          // rotate uv by angle
          vec2 rotate(vec2 v, float a) {
              float s = sin(a);
              float c = cos(a);
              mat2 m = mat2(c, s, -s, c);
              return m * v;
          }
    
          void main() {
              float uBorderSize = 0.2;
              float ratio = uRez.x / uRez.y;
    
              // Noise
              float noiseAngle = snoise(vec3(vLocalPos * 10. + vec2(18.4924, 72.9744), uTime * .85));
              float noiseColor = snoise(vec3(vLocalPos * 2. + vec2(74.664, 91.556), uTime * .5));
              noiseColor = (noiseColor + 1.) * .5;
    
              // get angle between
              float angle = atan(vLocalPos.y - uRingPos.y, vLocalPos.x - uRingPos.x);
    
              vec2 uv = gl_PointCoord.xy;
              uv -= vec2(0.5);
              uv.y *= -1.;
              uv = rotate(uv, -angle + (noiseAngle * .5));
    
              float h = 0.8; // adjust position of middleColor
              float progress = smoothstep(0., .75, pow(noiseColor, 2.));
              vec3 col = mix(mix(uColor1, uColor2, progress/h), mix(uColor2, uColor3, (progress - h)/(1.0 - h)), step(h, progress));
              vec3 color = col;
    
              float rounded = sdRoundBox(uv, vec2(0.5, 0.2), vec4(.25));
              rounded = smoothstep(.1, 0., rounded);
    
              // 计算与避障环的距离进行淡出，只在跟随状态(free)下生效
              float distToRing = distance(vLocalPos, uRingPos);
              float ringFade = smoothstep(0.45, 0.15, distToRing); // 0.15以内完全显示，0.45以外完全淡出
              
              // 使用 uMorphProgress 在跟随形态(0.0)与图案形态(1.0)之间平滑混合淡出因子
              float finalFade = mix(ringFade, 1.0, uMorphProgress);
    
              float a = uAlpha * rounded * smoothstep(0.1, 0.2, vScale) * finalFade;
    
              if(a < 0.01){
                  discard;
              }
    
              color = clamp(color, 0., 1.);
              color = mix(color, color * clamp(vVelocity, 0., 1.), float(uColorScheme));
    
              gl_FragColor = vec4(color, clamp(a, 0., 1.));
          }
        `;
    
        // ── Application Initialization & Main Loop ──
    
        // Parameters with live-binding
        const customTextures = {};
        let webglGenerateTargetTexture = null;

        const CONFIG = {
          density: window.innerWidth <= 768 ? 105 : 180,
          easing: 0.15,
          scale: window.innerWidth <= 768 ? 0.88 : 0.72,
          colorPreset: 'google',
          bgMode: 'dark',
          shape: 'free'
        };
    
        const colorPalettes = {
          google: {
            dark: { color1: '#aecbfa', color2: '#bada4c', color3: '#e35058', uColorScheme: 0 },
            light: { color1: '#676A72', color2: '#FF4641', color3: '#346BF1', uColorScheme: 0 }
          },
          black: {
            dark: { color1: '#ffffff', color2: '#e5e5e7', color3: '#a1a1a6', uColorScheme: 0 },
            light: { color1: '#1d1d1f', color2: '#2d2d2f', color3: '#48484a', uColorScheme: 0 }
          },
          white: {
            dark: { color1: '#ffffff', color2: '#f5f5f7', color3: '#d2d2d7', uColorScheme: 0 },
            light: { color1: '#a1a1a6', color2: '#e5e5e7', color3: '#ffffff', uColorScheme: 0 }
          },
          sunset: {
            dark: { color1: '#ffb347', color2: '#ffcc33', color3: '#ff8c00', uColorScheme: 0 },
            light: { color1: '#e65100', color2: '#f57c00', color3: '#ffb74d', uColorScheme: 0 }
          },
          aurora: {
            dark: { color1: '#00e676', color2: '#00f5d4', color3: '#005f73', uColorScheme: 0 },
            light: { color1: '#00796b', color2: '#009688', color3: '#4db6ac', uColorScheme: 0 }
          },
          pastel: {
            dark: { color1: '#b0bec5', color2: '#d1c4e9', color3: '#a3b19b', uColorScheme: 0 },
            light: { color1: '#37474f', color2: '#5e35b1', color3: '#80cbc4', uColorScheme: 0 }
          }
        };
    
        let engineRestartRequested = false;
    
        function initWebGLAntigravityParticles() {
          const canvas = document.getElementById("antigravityCanvas");
          if (!canvas) return;
    
          const width = window.innerWidth;
          const height = window.innerHeight;
          const dpr = Math.min(1.25, window.devicePixelRatio || 1);
    
          const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: false,
            alpha: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: false,
            stencil: false,
            precision: "highp"
          });
          renderer.setSize(width, height);
          renderer.setPixelRatio(dpr);
          renderer.autoClear = false;
    
          const scene = new THREE.Scene();
          const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
          camera.position.z = 3.5;
    
          // Generate initial particles via Poisson Disk Sampling
          const minD = mapRange(CONFIG.density, 0, 300, 10, 2);
          const maxD = mapRange(CONFIG.density, 0, 300, 11, 3);
          const sampledPoints = poissonDiskSampling(500, 500, minD, maxD, 20);
          const pointsData = [];
          for (let i = 0; i < sampledPoints.length; i++) {
            pointsData.push(sampledPoints[i][0] - 250, sampledPoints[i][1] - 250);
          }
          const count = Math.min(128 * 128, pointsData.length / 2);
    
          // Setup initial DataTexture for FBO GPGPU simulation
          const textureArray = new Float32Array(128 * 128 * 4);
          for (let i = 0; i < count; i++) {
            const idx = i * 4;
            textureArray[idx + 0] = pointsData[i * 2 + 0] / 250;
            textureArray[idx + 1] = pointsData[i * 2 + 1] / 250;
            textureArray[idx + 2] = 0;
            textureArray[idx + 3] = 0;
          }
          const posTex = new THREE.DataTexture(textureArray, 128, 128, THREE.RGBAFormat, THREE.FloatType);
          posTex.needsUpdate = true;
    
          // Target textures for morphing
          webglGenerateTargetTexture = generateTargetTexture;
          const claudeTex = generateTargetTexture(drawClaude);
          const chatgptTex = generateTargetTexture(drawChatGPT);
          const geminiTex = generateTargetTexture(drawGemini);
    
          // 根据当前 CONFIG.shape 状态进行重建状态继承，防止改变密度重建引擎时形态重置为 free
          let initialTargetTex = posTex;
          let initialMorphProgress = 0.0;
          if (CONFIG.shape === 'claude') {
            initialTargetTex = claudeTex;
            initialMorphProgress = 1.0;
          } else if (CONFIG.shape === 'chatgpt') {
            initialTargetTex = chatgptTex;
            initialMorphProgress = 1.0;
          } else if (CONFIG.shape === 'gemini') {
            initialTargetTex = geminiTex;
            initialMorphProgress = 1.0;
          } else if (customTextures[CONFIG.shape]) {
            initialTargetTex = customTextures[CONFIG.shape];
            initialMorphProgress = 1.0;
          }
    
          // Double Buffering (Ping-Pong FBO RenderTargets)
          const fboOptions = {
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            depthBuffer: false,
            stencilBuffer: false
          };
          let rt1 = new THREE.WebGLRenderTarget(128, 128, fboOptions);
          let rt2 = new THREE.WebGLRenderTarget(128, 128, fboOptions);
    
          // Warm up render targets
          renderer.setRenderTarget(rt1);
          renderer.setClearColor(0, 0);
          renderer.clear();
          renderer.setRenderTarget(rt2);
          renderer.setClearColor(0, 0);
          renderer.clear();
          renderer.setRenderTarget(null);
    
          // Setup GPGPU Simulation scene & orthographic camera
          const simScene = new THREE.Scene();
          const simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
          const simMaterial = new THREE.ShaderMaterial({
            uniforms: {
              uPosition: { value: posTex },
              uPosRefs: { value: posTex },
              uRingPos: { value: new THREE.Vector2(-10, -10) },
              uRingRadius: { value: 0.2 },
              uDeltaTime: { value: 0 },
              uRingWidth: { value: 0.107 },
              uRingWidth2: { value: 0.05 },
              uRingDisplacement: { value: 0.15 },
              uTime: { value: 0 },
              uMouseVelocity: { value: new THREE.Vector2(0, 0) },
              uObstacles: { value: [new THREE.Vector4(-10,-10,-10,-10), new THREE.Vector4(-10,-10,-10,-10), new THREE.Vector4(-10,-10,-10,-10), new THREE.Vector4(-10,-10,-10,-10)] },
              uObstacleCount: { value: 0 },
              uTargetPos: { value: initialTargetTex },
              uPrevTargetPos: { value: initialTargetTex },
              uTransitionProgress: { value: 1.0 },
              uMorphProgress: { value: initialMorphProgress },
              uTargetScale: { value: 1.0 }
            },
            vertexShader: simVertexShader,
            fragmentShader: simFragmentShader
          });
          const simMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simMaterial);
          simScene.add(simMesh);
    
          // Setup main Points Particle Geometry
          const geometry = new THREE.BufferGeometry();
          const uvs = new Float32Array(count * 2);
          const positions = new Float32Array(count * 3);
          const seeds = new Float32Array(count * 4);
          for (let s = 0; s < count; s++) {
            const a = s % 128;
            const l = Math.floor(s / 128);
            uvs[s * 2] = a / 128;
            uvs[s * 2 + 1] = l / 128;
            seeds[s * 4] = Math.random();
            seeds[s * 4 + 1] = Math.random();
            seeds[s * 4 + 2] = Math.random();
            seeds[s * 4 + 3] = Math.random();
          }
          geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
          geometry.setAttribute("seeds", new THREE.BufferAttribute(seeds, 4));
    
          // Color palette assignment
          const activePalette = colorPalettes[CONFIG.colorPreset] || colorPalettes.google;
          const palette = CONFIG.bgMode === 'light' ? activePalette.light : activePalette.dark;
    
          // Particle render material (interaction-only CA)
          const renderMaterial = new THREE.ShaderMaterial({
            uniforms: {
              uPosition: { value: posTex },
              uTime: { value: 0 },
              uColor1: { value: new THREE.Color(palette.color1) },
              uColor2: { value: new THREE.Color(palette.color2) },
              uColor3: { value: new THREE.Color(palette.color3) },
              uAlpha: { value: 1.0 },
              uRingPos: { value: new THREE.Vector2(-10, -10) },
              uRez: { value: new THREE.Vector2(width, height) },
              uParticleScale: { value: CONFIG.scale },
              uPixelRatio: { value: dpr },
              uColorScheme: { value: palette.uColorScheme },
              uIsHovering: { value: 0.0 },
              uPulseProgress: { value: 0.0 },
              uMorphProgress: { value: 0.0 }
            },
            vertexShader: renderVertexShader,
            fragmentShader: renderFragmentShader,
            transparent: true,
            depthTest: false,
            depthWrite: false
          });
    
          const mesh = new THREE.Points(geometry, renderMaterial);
          mesh.position.set(0, 0, 0);
          mesh.scale.set(5, 5, 5);
          scene.add(mesh);
    
          // Mouse tracking on Overlay div + velocity computation
          const mouse = new THREE.Vector2(-10, -10);
          const ringPos = new THREE.Vector2(0, 0);
          const cursorPos = new THREE.Vector2(0, 0);
          const prevMouse = new THREE.Vector2(-10, -10);
          const mouseVelocity = new THREE.Vector2(0, 0);
          const smoothMouseVelocity = new THREE.Vector2(0, 0);
          const simplexNoise1D = new JA();
          let lastTime = 0;
          let everRendered = false;
          const clock = new THREE.Clock();
          let animationFrameId = null;
    
          let hoverProgress = 0.0;
          let pulseProgress = 0.0;
          let wasIntersecting = false;
    
          let currentMorphProgress = initialMorphProgress;
          let targetMorphProgress = initialMorphProgress;
          let prevShape = CONFIG.shape;
          let transitionProgress = 1.0;
          let isTransitioning = false;
    
          const overlay = window;
          
          overlay.addEventListener("mousemove", (e) => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
          });
    
          overlay.addEventListener("mouseleave", () => {
            mouse.x = -10;
            mouse.y = -10;
          });
    
          // Touch support
          overlay.addEventListener("touchmove", (e) => {
            if (e.touches.length > 0) {
              mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
              mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
            }
          }, { passive: true });
    
          overlay.addEventListener("touchend", () => {
            mouse.x = -10;
            mouse.y = -10;
          });
    
          // DOM Obstacle boundary capture
          const obstacleData = [];
          function captureObstacles() {
            obstacleData.length = 0;
            const selectors = ['.site-header', '.hero-copy', '.modal-content', '.report-share-dialog'];
            const aspect = window.innerWidth / window.innerHeight;
            const H = 3.5 * 0.36397023;
            const W = H * aspect;
            const meshOffset = (typeof mesh !== 'undefined' && mesh) ? mesh.position.x / 5.0 : 0;
            for (const sel of selectors) {
              const el = document.querySelector(sel);
              if (!el || el.offsetWidth === 0 || el.classList.contains('collapsed')) continue;
              const rect = el.getBoundingClientRect();
              const ndcLeft = (rect.left / window.innerWidth) * 2 - 1;
              const ndcRight = (rect.right / window.innerWidth) * 2 - 1;
              const ndcTop = -(rect.top / window.innerHeight) * 2 + 1;
              const ndcBottom = -(rect.bottom / window.innerHeight) * 2 + 1;
              const simScale = 0.175 / 5.0;
              const minX = ndcLeft * W * simScale - meshOffset;
              const maxX = ndcRight * W * simScale - meshOffset;
              const minY = ndcBottom * H * simScale;
              const maxY = ndcTop * H * simScale;
              obstacleData.push(new THREE.Vector4(minX, minY, maxX, maxY));
              if (obstacleData.length >= 4) break;
            }
          }
          window.captureWebGLObstacles = captureObstacles;
          let obstacleTimer = 0;
    
          function resize() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const pxRatio = window.devicePixelRatio || 1;
    
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
    
            renderMaterial.uniforms.uRez.value.set(w, h);
            renderMaterial.uniforms.uPixelRatio.value = Math.min(1.25, pxRatio);
            captureObstacles();
          }
    
          window.addEventListener("resize", resize);
          resize();
    
          function loop() {
            if (engineRestartRequested) {
              window.removeEventListener("resize", resize);
              geometry.dispose();
              renderMaterial.dispose();
              simMaterial.dispose();
              rt1.dispose();
              rt2.dispose();
              posTex.dispose();
              renderer.dispose();
              
              engineRestartRequested = false;
              initWebGLAntigravityParticles();
              return;
            }
    
            animationFrameId = requestAnimationFrame(loop);
    
            const time = clock.getElapsedTime();
            const dt = Math.min(0.05, time - lastTime);
            lastTime = time;
    
            // 获取控制面板右侧的像素宽度（展开/收缩过渡中会平滑变化）
            const panelEl = document.querySelector('.control-panel');
            const panelRight = panelEl ? Math.max(0, panelEl.getBoundingClientRect().right) : 0;
    
            // 计算当前三维投影平面尺寸
            const aspect = window.innerWidth / window.innerHeight;
            const cameraH = 3.5 * 0.36397023; // 3.5 * tan(20deg)
            const cameraW = cameraH * aspect;
    
            // 根据面板宽度计算世界坐标偏移量，应用给整个粒子网格 mesh.position.x
            const worldOffsetX = (panelRight / window.innerHeight) * cameraH;
            if (typeof mesh !== 'undefined' && mesh) {
              mesh.position.x = worldOffsetX;
            }
    
            // 计算除了控制面板以外的可用宽度
            const availWidth = 2.0 * (cameraW - worldOffsetX);
    
            // 动态计算在当前视口比例下的 Logo 凝聚缩放因子
            // 保证垂直方向高度占比不超过可视高度 of 65%，水平方向宽度占比不超过可用宽度的 70%
            const maxRadiusY = cameraH * 0.76;
            const maxRadiusX = (cameraW - worldOffsetX) * 0.86;
            const targetScale = Math.min(maxRadiusY, maxRadiusX) / 1.22; // 降低基准除数，使凝聚出的图腾放大约 30%
            simMaterial.uniforms.uTargetScale.value = targetScale;
    
            // Mouse velocity computation (smooth)
            if (mouse.x > -2 && prevMouse.x > -2) {
              mouseVelocity.set(mouse.x - prevMouse.x, mouse.y - prevMouse.y);
            } else {
              mouseVelocity.set(0, 0);
            }
            prevMouse.copy(mouse);
            smoothMouseVelocity.lerp(mouseVelocity, 0.15);
    
            // Algebraic inverse perspective projection (0 CPU delay, 100% frame rate)
            const worldX = mouse.x * cameraW;
            const worldY = mouse.y * cameraH;
            const isIntersecting = mouse.x > -2;
    
            // 因为 mesh.position.x 平移了，交互时需要使用局部空间坐标
            const localWorldX = worldX - ((typeof mesh !== 'undefined' && mesh) ? mesh.position.x : 0);
    
            const t = (simplexNoise1D.getVal(time * 0.66 + 94.234) - 0.5) * 2;
            const i = (simplexNoise1D.getVal(time * 0.75 + 21.028) - 0.5) * 2;
    
            if (isIntersecting) {
              cursorPos.set(localWorldX * 0.175 + t * 0.1, worldY * 0.175 + i * 0.1);
              ringPos.set(ringPos.x + (cursorPos.x - ringPos.x) * CONFIG.easing, ringPos.y + (cursorPos.y - ringPos.y) * CONFIG.easing);
              
              if (!wasIntersecting) {
                pulseProgress = 0.0;
              }
              hoverProgress += (1.0 - hoverProgress) * 0.08;
              pulseProgress += (1.0 - pulseProgress) * 0.04;
            } else {
              cursorPos.set(t * 0.2 - ((typeof mesh !== 'undefined' && mesh) ? mesh.position.x : 0) * 0.175, i * 0.1);
              ringPos.set(ringPos.x + (cursorPos.x - ringPos.x) * 0.02, ringPos.y + (cursorPos.y - ringPos.y) * 0.02);
              
              hoverProgress += (0.0 - hoverProgress) * 0.08;
              pulseProgress += (0.0 - pulseProgress) * 0.08;
            }
            wasIntersecting = isIntersecting;
    
            // Live update non-geometry parameters
            const activePalette = colorPalettes[CONFIG.colorPreset] || colorPalettes.google;
            const palette = CONFIG.bgMode === 'light' ? activePalette.light : activePalette.dark;
            renderMaterial.uniforms.uColor1.value.set(palette.color1);
            renderMaterial.uniforms.uColor2.value.set(palette.color2);
            renderMaterial.uniforms.uColor3.value.set(palette.color3);
            renderMaterial.uniforms.uColorScheme.value = palette.uColorScheme;
            renderMaterial.uniforms.uParticleScale.value = CONFIG.scale;
    
            // Update shape morph target based on CONFIG and transition progress
            if (CONFIG.shape !== prevShape) {
              let prevTex = posTex;
              if (prevShape === 'claude') prevTex = claudeTex;
              else if (prevShape === 'chatgpt') prevTex = chatgptTex;
              else if (prevShape === 'gemini') prevTex = geminiTex;
              else if (customTextures[prevShape]) prevTex = customTextures[prevShape];
              simMaterial.uniforms.uPrevTargetPos.value = prevTex;
    
              let nextTex = posTex;
              if (CONFIG.shape === 'claude') nextTex = claudeTex;
              else if (CONFIG.shape === 'chatgpt') nextTex = chatgptTex;
              else if (CONFIG.shape === 'gemini') nextTex = geminiTex;
              else if (customTextures[CONFIG.shape]) nextTex = customTextures[CONFIG.shape];
              simMaterial.uniforms.uTargetPos.value = nextTex;
    
              transitionProgress = 0.0;
              isTransitioning = true;
              prevShape = CONFIG.shape;
            }
    
            if (isTransitioning) {
              transitionProgress += dt * 0.8;
              if (transitionProgress >= 1.0) {
                transitionProgress = 1.0;
                isTransitioning = false;
              }
            }
            simMaterial.uniforms.uTransitionProgress.value = transitionProgress;
    
            if (CONFIG.shape === 'free') {
              targetMorphProgress = 0.0;
            } else {
              targetMorphProgress = 1.0;
            }
    
            // 每一帧捕获 DOM 避障以确保与控制面板过渡动画完美同步
            captureObstacles();
    
            // Smooth transition for morph progress
            currentMorphProgress += (targetMorphProgress - currentMorphProgress) * 0.05;
            simMaterial.uniforms.uMorphProgress.value = currentMorphProgress;
            window.debugProgress = currentMorphProgress;
            window.debugTarget = targetMorphProgress;
    
            // Simulation GPGPU step
            simMaterial.uniforms.uPosition.value = everRendered ? rt1.texture : posTex;
            simMaterial.uniforms.uTime.value = time;
            simMaterial.uniforms.uDeltaTime.value = dt;
            simMaterial.uniforms.uRingRadius.value = 0.175 + Math.sin(time * 1.0) * 0.03 + Math.cos(time * 3.0) * 0.02;
            simMaterial.uniforms.uRingPos.value = ringPos;
            simMaterial.uniforms.uMouseVelocity.value.copy(smoothMouseVelocity);
            // Update obstacle uniforms
            const obsArr = simMaterial.uniforms.uObstacles.value;
            for (let oi = 0; oi < 4; oi++) {
              if (oi < obstacleData.length) {
                obsArr[oi].copy(obstacleData[oi]);
              } else {
                obsArr[oi].set(-10, -10, -10, -10);
              }
            }
            simMaterial.uniforms.uObstacleCount.value = obstacleData.length;
    
            renderer.setRenderTarget(rt2);
            renderer.render(simScene, simCamera);
            renderer.setRenderTarget(null);
    
            // Render step
            renderMaterial.uniforms.uPosition.value = everRendered ? rt2.texture : posTex;
            renderMaterial.uniforms.uTime.value = time;
            renderMaterial.uniforms.uRingPos.value = ringPos;
            renderMaterial.uniforms.uIsHovering.value = hoverProgress;
            renderMaterial.uniforms.uPulseProgress.value = pulseProgress;
            renderMaterial.uniforms.uMorphProgress.value = currentMorphProgress;
    
            renderer.clear();
            renderer.render(scene, camera);
    
            // Swap ping-pong
            const temp = rt1;
            rt1 = rt2;
            rt2 = temp;
            everRendered = true;
          }
    
          loop();
        }

    initWebGLAntigravityParticles();
    document.documentElement.classList.add('antigravity-ready');
    window.__northstarAntigravity = {
      source: 'Antigravity-Animation-Design V6',
      config: CONFIG,
      setCustomShape(name, drawFn) {
        if (!customTextures[name] && webglGenerateTargetTexture) {
          customTextures[name] = webglGenerateTargetTexture(drawFn);
        }
        CONFIG.shape = name;
      },
      clearCustomShape() {
        CONFIG.shape = 'free';
      }
    };
  } catch (error) {
    console.error('Antigravity WebGL initialization failed:', error);
    document.documentElement.classList.add('antigravity-fallback');
  }
})();
