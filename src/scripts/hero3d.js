/**
 * The hero scene: Siari Hills seen from the water at the blue hour.
 * The sea and an ember horizon on the left; the coast, Our Lady's hill, lamps on the Walk of
 * Faith, the whitewashed chapel and its octagonal tower on the right; on the roof deck the
 * Divine Mercy, its red and pale rays fanning out over the sea.
 *
 * One WebGL context. Pauses when off-screen or hidden. Cleans up after itself.
 */
import {
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  Shape,
  ShapeGeometry,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';

const hex = (h) => {
  const n = parseInt(h.slice(1), 16);
  return new Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

/* Palette for the scene (sRGB, written straight to the screen). */
const C = {
  zenith: hex('#0a1322'),
  mid: hex('#18294a'),
  horizon: hex('#3b4f72'),
  ember: hex('#e08a5e'),
  rose: hex('#b8707a'),
  seaNear: hex('#081120'),
  seaFar: hex('#1d3150'),
  ridgeFar: hex('#2b3c5a'),
  ridgeMid: hex('#1c2a42'),
  hill: hex('#0f1a28'),
  hillNear: hex('#0b1420'),
  red: hex('#ff5a72'),
  pale: hex('#cdeaff'),
};

const NOISE = /* glsl */ `
  float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<4;i++){ s+=a*vnoise(p); p*=2.03; a*=0.5; } return s; }
`;

/* The sun has set to the west, over the sea: low on the left of the view. */
const SUN_DIR = new Vector3(-0.42, 0.0, -1).normalize();

function skyMaterial(uniforms) {
  return new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main(){ vec4 w = modelMatrix * vec4(position,1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uZenith, uMid, uHorizon, uEmber, uRose, uSun;
      uniform float uTime, uFade;
      varying vec3 vWorld;
      ${NOISE}
      void main(){
        vec3 d = normalize(vWorld - cameraPosition);
        float e = d.y;
        vec3 col = mix(uHorizon, uMid, smoothstep(-0.02, 0.16, e));
        col = mix(col, uZenith, smoothstep(0.12, 0.55, e));
        float az = max(dot(normalize(d.xz), normalize(uSun.xz)), 0.0);
        float low = exp(-max(e, 0.0) * 14.0);
        col += uEmber * pow(az, 10.0) * low * 0.95;
        col += uRose * pow(az, 3.0) * exp(-max(e,0.0)*6.0) * 0.22;
        // thin stratus catching the last light
        float band = smoothstep(0.012, 0.04, e) * (1.0 - smoothstep(0.07, 0.13, e));
        float cl = fbm(vec2(atan(d.x, -d.z) * 9.0 + uTime*0.004, e * 60.0));
        col = mix(col, mix(uHorizon*1.15, uEmber, pow(az, 5.0)), band * smoothstep(0.55, 0.85, cl) * 0.55);
        // stars, high up
        vec2 sp = vec2(atan(d.x, -d.z), e) * vec2(160.0, 160.0);
        vec2 cell = floor(sp);
        float h = hash(cell);
        float star = step(0.985, h) * smoothstep(0.18, 0.5, e);
        float tw = 0.6 + 0.4*sin(uTime*1.3 + h*40.0);
        vec2 f = fract(sp) - 0.5;
        col += vec3(0.85, 0.9, 1.0) * star * tw * smoothstep(0.32, 0.0, length(f)) * 0.8;
        col *= uFade;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

function seaMaterial(uniforms) {
  return new ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main(){ vec4 w = modelMatrix * vec4(position,1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uNear, uFar, uHorizon, uEmber, uRed, uPale, uSun, uStatue;
      uniform float uTime, uFade, uRay;
      varying vec3 vWorld;
      ${NOISE}
      void main(){
        vec3 toFrag = vWorld - cameraPosition;
        float dist = length(toFrag.xz);
        vec3 v = normalize(toFrag);
        vec2 p = vWorld.xz * vec2(0.22, 0.9);
        float w1 = vnoise(p + vec2(uTime*0.12, uTime*0.05));
        float w2 = vnoise(p*2.7 - vec2(uTime*0.09, 0.0));
        float ripple = w1*0.6 + w2*0.4;
        float far = smoothstep(6.0, 260.0, dist);
        vec3 col = mix(uNear, uFar, pow(far, 0.7));
        col = mix(col, uHorizon, smoothstep(0.55, 1.0, far) * 0.65);
        // the glitter path under the afterglow
        float az = max(dot(normalize(v.xz), normalize(uSun.xz)), 0.0);
        float path = pow(az, 140.0 * (0.4 + far));
        float glint = smoothstep(0.52, 0.9, ripple);
        col += uEmber * path * (0.25 + glint * 1.1) * (0.35 + far);
        // the two rays, reflected toward us under the statue
        float dx = vWorld.x - uStatue.x;
        float along = smoothstep(uStatue.z + 6.0, -10.0, vWorld.z) * smoothstep(40.0, uStatue.z + 2.0, vWorld.z);
        float redLane = exp(-pow((dx + 3.2 + (vWorld.z - uStatue.z)*0.06) / 2.2, 2.0));
        float paleLane = exp(-pow((dx + 0.6 + (vWorld.z - uStatue.z)*0.02) / 1.6, 2.0));
        float shimmer = 0.45 + glint * 1.4;
        col += uRed * redLane * along * shimmer * 0.16 * uRay;
        col += uPale * paleLane * along * shimmer * 0.14 * uRay;
        col *= uFade;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

function ridgeMaterial(color, haze, hazeAmount) {
  return new ShaderMaterial({
    uniforms: { uColor: { value: color }, uHaze: { value: haze }, uHazeAmt: { value: hazeAmount }, uFade: { value: 1 }, uTop: { value: 20 } },
    vertexShader: /* glsl */ `
      varying float vY;
      void main(){ vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor, uHaze; uniform float uHazeAmt, uFade, uTop;
      varying float vY;
      void main(){
        float low = 1.0 - smoothstep(0.0, uTop, vY);
        vec3 col = mix(uColor, uHaze, uHazeAmt * (0.35 + 0.65*low));
        gl_FragColor = vec4(col * uFade, 1.0);
      }
    `,
  });
}

/**
 * A ray: a wedge of light from the heart. The across-coordinate is computed from the wedge's own
 * geometry (not from UVs, which shear across a trapezoid's two triangles).
 */
function rayMaterial(color, uniforms, w0, w1, length) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    uniforms: { ...uniforms, uColor: { value: color }, uW0: { value: w0 }, uW1: { value: w1 }, uLen: { value: length } },
    vertexShader: /* glsl */ `
      varying vec2 vLocal;
      void main(){ vLocal = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uTime, uRay, uFade, uW0, uW1, uLen;
      varying vec2 vLocal;
      ${NOISE}
      void main(){
        float t = clamp(-vLocal.y / uLen, 0.0, 1.0);
        float hw = mix(uW0, uW1, t) * 0.5;
        float s = vLocal.x / hw;
        float across = abs(s);
        float edge = 1.0 - smoothstep(0.55, 1.0, across);
        float body = exp(-across * across * 1.6);
        float len = pow(1.0 - t, 1.25) * smoothstep(0.0, 0.03, t);
        // fine streaks of light that drift outward along the ray
        float streak = 0.62 + 0.38 * vnoise(vec2(s * 7.0 + 3.0, t * 3.0 - uTime * 0.16));
        float a = edge * (0.13 + body * 0.34) * len * streak;
        gl_FragColor = vec4(uColor * a * uRay * uFade, a);
      }
    `,
  });
}

function glowMaterial(color, strength) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uColor: { value: color }, uStrength: { value: strength }, uFade: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uStrength, uFade;
      varying vec2 vUv;
      void main(){ float d = length(vUv - 0.5) * 2.0; float a = pow(max(1.0 - d, 0.0), 2.2) * uStrength; gl_FragColor = vec4(uColor * a * uFade, a); }
    `,
  });
}

function pointsMaterial(uniforms, size) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { ...uniforms, uSize: { value: size } },
    vertexShader: /* glsl */ `
      attribute float aSeed; attribute vec3 aColor;
      uniform float uTime, uSize, uPixel;
      varying vec3 vColor; varying float vTw;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPixel * (60.0 / -mv.z);
        vColor = aColor;
        vTw = 0.75 + 0.25 * sin(uTime * (1.2 + aSeed) + aSeed * 20.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uFade;
      varying vec3 vColor; varying float vTw;
      void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = pow(max(1.0 - d, 0.0), 2.0) * vTw; gl_FragColor = vec4(vColor * a * uFade, a); }
    `,
  });
}

/** A silhouette from a list of [x, y] points along its top edge. */
function silhouette(points, bottom = -2) {
  const s = new Shape();
  s.moveTo(points[0][0], bottom);
  for (const [x, y] of points) s.lineTo(x, y);
  s.lineTo(points[points.length - 1][0], bottom);
  s.lineTo(points[0][0], bottom);
  return new ShapeGeometry(s, 1);
}

/** A rolling ridge line from layered sines, deterministic for a given seed. */
function ridgePoints(x0, x1, step, base, amps, seed) {
  const pts = [];
  for (let x = x0; x <= x1; x += step) {
    let y = base;
    amps.forEach(([a, f], i) => (y += a * Math.sin(x * f + seed * (i + 1) * 1.7) + a * 0.35 * Math.sin(x * f * 2.3 + seed * 0.9 + i)));
    pts.push([x, Math.max(y, 0.4)]);
  }
  return pts;
}

/** A thin bright edge along a silhouette: the last light catching the top of the hill. */
function rimStrip(points, width) {
  const pos = [];
  const uv = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    pos.push(ax, ay, 0, bx, by, 0, bx, by - width, 0, ax, ay, 0, bx, by - width, 0, ax, ay - width, 0);
    const u0 = i / (points.length - 1);
    const u1 = (i + 1) / (points.length - 1);
    uv.push(u0, 1, u1, 1, u1, 0, u0, 1, u1, 0, u0, 0);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  return g;
}

function rimMaterial(uniforms) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uEmber; uniform float uFade;
      varying vec2 vUv;
      void main(){ float a = vUv.y * vUv.y * (1.0 - vUv.x * 0.85) * 0.5; gl_FragColor = vec4(uEmber * a * uFade, a); }
    `,
  });
}

/** One coconut palm as a flat silhouette (trunk and fronds). */
function palmGeometry() {
  const s = new Shape();
  s.moveTo(-0.05, 0);
  s.quadraticCurveTo(0.05, 0.8, 0.18, 1.6);
  s.lineTo(0.24, 1.6);
  s.quadraticCurveTo(0.1, 0.8, 0.06, 0);
  s.lineTo(-0.05, 0);
  const g = [new ShapeGeometry(s, 4)];
  const crown = new Vector2(0.21, 1.62);
  const fronds = [
    [-2.6, 0.95],
    [-2.0, 1.05],
    [-1.2, 0.8],
    [-0.4, 0.85],
    [0.3, 1.0],
    [0.95, 0.95],
    [1.7, 0.8],
  ];
  for (const [ang, len] of fronds) {
    const f = new Shape();
    const tip = new Vector2(crown.x + Math.cos(ang + Math.PI / 2) * len, crown.y + Math.sin(ang + Math.PI / 2) * len * 0.75 - len * 0.35);
    const mid = new Vector2((crown.x + tip.x) / 2, Math.max(crown.y, tip.y) + 0.18);
    f.moveTo(crown.x, crown.y);
    f.quadraticCurveTo(mid.x, mid.y + 0.06, tip.x, tip.y);
    f.quadraticCurveTo(mid.x, mid.y - 0.06, crown.x, crown.y - 0.04);
    g.push(new ShapeGeometry(f, 5));
  }
  return mergeFlat(g);
}

function mergeFlat(geoms) {
  let count = 0;
  geoms.forEach((g) => (count += (g.index ? g.index.count : g.attributes.position.count)));
  const pos = new Float32Array(count * 3);
  let o = 0;
  for (const g of geoms) {
    const p = g.attributes.position.array;
    const idx = g.index ? g.index.array : null;
    const n = idx ? idx.length : p.length / 3;
    for (let i = 0; i < n; i++) {
      const k = idx ? idx[i] : i;
      pos[o++] = p[k * 3];
      pos[o++] = p[k * 3 + 1];
      pos[o++] = p[k * 3 + 2];
    }
    g.dispose();
  }
  const out = new BufferGeometry();
  out.setAttribute('position', new BufferAttribute(pos, 3));
  return out;
}

/** The chapel, its tower, the roof deck and the statue, at the hill's summit. */
function buildShrine() {
  const g = new Group();
  const white = new MeshLambertMaterial({ color: '#e9ecf4' });
  const whiteShade = new MeshLambertMaterial({ color: '#cfd6e6' });
  const roofDark = new MeshLambertMaterial({ color: '#3a2326' });
  const glassWarm = new MeshBasicMaterial({ color: '#ffc98e' });
  const band = new MeshBasicMaterial({ color: '#c8304a' });
  const floodWhite = new MeshBasicMaterial({ color: '#f4f6ff' });

  // the hall with its glass walls
  const hall = new Mesh(new BoxGeometry(2.6, 0.78, 1.3), whiteShade);
  hall.position.set(0, 0.39, 0);
  g.add(hall);
  const glass = new Mesh(new PlaneGeometry(2.3, 0.46), glassWarm);
  glass.position.set(0, 0.36, 0.651);
  g.add(glass);
  for (let i = -5; i <= 5; i++) {
    const m = new Mesh(new BoxGeometry(0.035, 0.5, 0.02), white);
    m.position.set(i * 0.21, 0.36, 0.665);
    g.add(m);
  }
  // the roof deck, its railing and the curved canopy with the red lettering band
  const deck = new Mesh(new BoxGeometry(2.9, 0.1, 1.5), white);
  deck.position.set(0, 0.83, 0);
  g.add(deck);
  const canopy = new Mesh(new CylinderGeometry(0.42, 0.42, 2.9, 20, 1, true, Math.PI * 0.5, Math.PI), white);
  canopy.rotation.z = Math.PI / 2;
  canopy.position.set(0, 0.62, 0.75);
  canopy.scale.set(1, 1, 0.55);
  g.add(canopy);
  const lettering = new Mesh(new PlaneGeometry(1.7, 0.09), band);
  lettering.position.set(0, 0.95, 0.76);
  g.add(lettering);
  const rail = new Mesh(new BoxGeometry(2.9, 0.035, 0.035), white);
  rail.position.set(0, 1.05, 0.73);
  g.add(rail);
  const railBack = rail.clone();
  railBack.position.z = -0.73;
  g.add(railBack);

  // the tower, left of the chapel: square base, octagonal storeys, pointed roof, cross
  const tower = new Group();
  const base = new Mesh(new BoxGeometry(0.55, 0.9, 0.55), white);
  base.position.y = 0.45;
  tower.add(base);
  const oct1 = new Mesh(new CylinderGeometry(0.25, 0.27, 0.62, 8), white);
  oct1.position.y = 1.21;
  tower.add(oct1);
  const oct2 = new Mesh(new CylinderGeometry(0.22, 0.24, 0.42, 8), whiteShade);
  oct2.position.y = 1.73;
  tower.add(oct2);
  const roof = new Mesh(new ConeGeometry(0.3, 0.62, 8), roofDark);
  roof.position.y = 2.25;
  tower.add(roof);
  const crossV = new Mesh(new BoxGeometry(0.03, 0.26, 0.03), white);
  crossV.position.y = 2.68;
  tower.add(crossV);
  const crossH = new Mesh(new BoxGeometry(0.15, 0.03, 0.03), white);
  crossH.position.y = 2.72;
  tower.add(crossH);
  for (const y of [1.25, 1.75]) {
    const win = new Mesh(new PlaneGeometry(0.09, 0.16), glassWarm);
    win.position.set(0, y, 0.255);
    tower.add(win);
  }
  tower.position.set(-1.75, 0, 0.05);
  g.add(tower);

  // the Divine Mercy on the roof deck, floodlit
  const statue = new Group();
  const robe = new Mesh(
    new LatheGeometry(
      [new Vector2(0.0, 0), new Vector2(0.27, 0), new Vector2(0.24, 0.35), new Vector2(0.19, 0.8), new Vector2(0.17, 1.05), new Vector2(0.13, 1.18), new Vector2(0.05, 1.22), new Vector2(0, 1.22)],
      20,
    ),
    floodWhite,
  );
  statue.add(robe);
  const head = new Mesh(new SphereGeometry(0.085, 16, 12), floodWhite);
  head.position.y = 1.32;
  statue.add(head);
  const arm = new Mesh(new CylinderGeometry(0.032, 0.04, 0.42, 8), floodWhite);
  arm.position.set(-0.2, 1.22, 0.02);
  arm.rotation.z = 0.55;
  statue.add(arm);
  const ped = new Mesh(new BoxGeometry(0.42, 0.22, 0.42), white);
  ped.position.y = -0.11;
  statue.add(ped);
  statue.position.set(0.15, 0.99, 0);
  statue.scale.setScalar(1.35);
  g.add(statue);

  // the heart, where both rays begin (in group space)
  const heart = new Vector3(0.12, 0.99 + 1.02 * 1.35, 0.12);
  g.userData.heart = heart;
  g.userData.dispose = () => {
    [white, whiteShade, roofDark, glassWarm, band, floodWhite].forEach((m) => m.dispose());
  };
  return g;
}

/** Our Lady on the lower hill: white, on a blue cloud, a ring of a halo. */
function buildMary() {
  const g = new Group();
  const white = new MeshBasicMaterial({ color: '#e8eefb' });
  const blue = new MeshLambertMaterial({ color: '#5d86c4' });
  const ring = new MeshBasicMaterial({ color: '#d7c48c' });
  const body = new Mesh(
    new LatheGeometry([new Vector2(0, 0), new Vector2(0.2, 0), new Vector2(0.17, 0.4), new Vector2(0.12, 0.78), new Vector2(0.07, 0.9), new Vector2(0, 0.95)], 16),
    white,
  );
  body.position.y = 0.22;
  g.add(body);
  const cloud = new Mesh(new SphereGeometry(0.26, 16, 10), blue);
  cloud.scale.set(1.2, 0.55, 1.2);
  cloud.position.y = 0.12;
  g.add(cloud);
  const halo = new Mesh(new TorusGeometry(0.12, 0.012, 6, 28), ring);
  halo.position.y = 1.22;
  g.add(halo);
  g.userData.dispose = () => [white, blue, ring].forEach((m) => m.dispose());
  return g;
}

export function createHeroScene(canvas, { reducedMotion = false, onFirstFrame } = {}) {
  const isSmall = window.matchMedia('(max-width: 760px)').matches;
  const renderer = new WebGLRenderer({ canvas, antialias: !isSmall, alpha: false, powerPreference: 'high-performance' });
  const dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor('#0a1322', 1);

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 2000);

  const uniforms = {
    uTime: { value: 0 },
    uFade: { value: 1 },
    uRay: { value: 0 },
  };

  // sky
  const sky = new Mesh(
    new SphereGeometry(900, 32, 16),
    skyMaterial({
      ...uniforms,
      uZenith: { value: C.zenith },
      uMid: { value: C.mid },
      uHorizon: { value: C.horizon },
      uEmber: { value: C.ember },
      uRose: { value: C.rose },
      uSun: { value: SUN_DIR },
    }),
  );
  scene.add(sky);

  // positions
  const HILL = new Vector3(16, 0, -46);
  const SUMMIT_Y = 9.6;
  const STATUE = new Vector3(HILL.x + 0.2, SUMMIT_Y, HILL.z);

  // sea
  const sea = new Mesh(
    new PlaneGeometry(2400, 1400, 1, 1),
    seaMaterial({
      ...uniforms,
      uNear: { value: C.seaNear },
      uFar: { value: C.seaFar },
      uHorizon: { value: C.horizon },
      uEmber: { value: C.ember },
      uRed: { value: C.red },
      uPale: { value: C.pale },
      uSun: { value: SUN_DIR },
      uStatue: { value: STATUE },
    }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.z = -600;
  scene.add(sea);

  const layers = [];
  const addLayer = (mesh) => {
    layers.push(mesh);
    scene.add(mesh);
    return mesh;
  };

  // far mountains and the middle ridge (land lies to the right of the view)
  const farPts = ridgePoints(-6, 170, 1.5, 11, [[4.2, 0.07], [2.4, 0.19], [0.9, 0.53]], 3.1).map(([x, y]) => [x, y * Math.min(1, Math.max(0.1, (x + 6) / 26))]);
  const far = addLayer(new Mesh(silhouette(farPts), ridgeMaterial(C.ridgeFar, C.horizon, 0.55)));
  far.material.uniforms.uTop.value = 18;
  far.position.set(0, 0, -150);

  const midPts = ridgePoints(4, 110, 1.0, 6.5, [[2.6, 0.11], [1.4, 0.31], [0.5, 0.9]], 7.4).map(([x, y]) => [x, y * Math.min(1, Math.max(0.1, (x - 4) / 16))]);
  const mid = addLayer(new Mesh(silhouette(midPts), ridgeMaterial(C.ridgeMid, C.horizon, 0.35)));
  mid.material.uniforms.uTop.value = 10;
  mid.position.set(0, 0, -95);

  // the shrine hill, with a level summit for the chapel
  const hx = HILL.x;
  const hillPts = [
    [hx - 15, 0.2],
    [hx - 12, 0.9],
    [hx - 9.5, 2.4],
    [hx - 7.5, 4.3],
    [hx - 5.5, 6.4],
    [hx - 3.8, 8.1],
    [hx - 2.6, 9.15],
    [hx - 2.0, SUMMIT_Y],
    [hx + 2.4, SUMMIT_Y],
    [hx + 3.3, 9.2],
    [hx + 5.2, 8.1],
    [hx + 8.0, 6.9],
    [hx + 11, 6.2],
    [hx + 15, 5.4],
    [hx + 19, 6.3],
    [hx + 24, 5.6],
    [hx + 32, 4.4],
    [hx + 45, 4.9],
    [hx + 70, 3.6],
  ];
  const hill = addLayer(new Mesh(silhouette(hillPts), ridgeMaterial(C.hill, C.horizon, 0.12)));
  hill.material.uniforms.uTop.value = 9;
  hill.position.z = HILL.z;
  const rim = new Mesh(rimStrip(hillPts.slice(0, 9), 0.16), rimMaterial({ uEmber: { value: C.ember }, uFade: uniforms.uFade }));
  rim.position.z = HILL.z + 0.05;
  scene.add(rim);

  // Our Lady's lower hill, nearer, to the left of the summit
  const mx = hx - 9.5;
  const maryPts = [
    [mx - 7, 0.1],
    [mx - 4.5, 1.2],
    [mx - 2.5, 2.9],
    [mx - 1.0, 3.9],
    [mx + 0.4, 4.15],
    [mx + 1.6, 3.9],
    [mx + 3.6, 2.6],
    [mx + 6.5, 1.2],
    [mx + 10, 0.4],
  ];
  const maryHill = addLayer(new Mesh(silhouette(maryPts), ridgeMaterial(C.hillNear, C.horizon, 0.08)));
  maryHill.material.uniforms.uTop.value = 5;
  maryHill.position.z = HILL.z + 9;
  const maryRim = new Mesh(rimStrip(maryPts.slice(0, 6), 0.1), rimMaterial({ uEmber: { value: C.ember }, uFade: uniforms.uFade }));
  maryRim.position.z = HILL.z + 9.05;
  scene.add(maryRim);

  // the coast in front: a low dark strip of lowland and shore
  const shorePts = ridgePoints(hx - 18, hx + 80, 1.2, 0.9, [[0.35, 0.4], [0.2, 1.1]], 2.2);
  const shore = addLayer(new Mesh(silhouette(shorePts, -1), ridgeMaterial(hex('#09111c'), C.horizon, 0.05)));
  shore.position.z = HILL.z + 16;

  // lighting for the built forms
  scene.add(new HemisphereLight('#8ea3cf', '#141c2a', 1.35));
  const dusk = new DirectionalLight('#f2b08a', 0.9);
  dusk.position.set(-60, 12, 20);
  scene.add(dusk);

  // the chapel and statue
  const shrine = buildShrine();
  shrine.position.set(hx, SUMMIT_Y, HILL.z + 0.4);
  shrine.rotation.y = -0.38;
  shrine.scale.setScalar(1.25);
  scene.add(shrine);
  shrine.updateMatrixWorld(true);
  const heart = shrine.userData.heart.clone().applyMatrix4(shrine.matrixWorld);

  // Our Lady
  const mary = buildMary();
  mary.position.set(mx + 0.3, 4.12, maryHill.position.z + 0.2);
  mary.rotation.y = -0.7;
  mary.scale.setScalar(1.7);
  scene.add(mary);

  // glows: the floodlit statue, the chapel's warm glass, Our Lady
  const glowGeo = new PlaneGeometry(1, 1);
  const statueGlow = new Mesh(glowGeo, glowMaterial(hex('#dfe9ff'), 0.85));
  statueGlow.position.copy(heart).add(new Vector3(0, 0.2, 0.6));
  statueGlow.scale.setScalar(5.5);
  scene.add(statueGlow);
  const chapelGlow = new Mesh(glowGeo, glowMaterial(hex('#ffb877'), 0.45));
  chapelGlow.position.set(hx, SUMMIT_Y + 0.6, HILL.z + 1.6);
  chapelGlow.scale.set(7, 3, 1);
  scene.add(chapelGlow);
  const maryGlow = new Mesh(glowGeo, glowMaterial(hex('#dfe9ff'), 0.45));
  maryGlow.position.set(mary.position.x, mary.position.y + 1.1, mary.position.z + 0.5);
  maryGlow.scale.setScalar(2.6);
  scene.add(maryGlow);

  // the two rays: red to the left, pale to the right, both reaching out over the sea
  const rays = new Group();
  const makeRay = (color, angle, length, width0, width1) => {
    const geo = new BufferGeometry();
    const p = new Float32Array([-width0 / 2, 0, 0, width0 / 2, 0, 0, width1 / 2, -length, 0, -width1 / 2, -length, 0]);
    geo.setAttribute('position', new BufferAttribute(p, 3));
    geo.setAttribute('uv', new BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    const mesh = new Mesh(geo, rayMaterial(color, uniforms, width0, width1, length));
    mesh.rotation.z = angle;
    return mesh;
  };
  // red to the viewer's left, pale to the right, as on the statue; the fan always faces the viewer
  const redRay = makeRay(C.red, -0.66, 54, 0.3, 22);
  const paleRay = makeRay(C.pale, 0.4, 50, 0.3, 18);
  rays.add(redRay, paleRay);
  rays.position.copy(heart).add(new Vector3(0, 0, 0.8));
  scene.add(rays);

  // lamps along the Walk of Faith and the road
  const lampPts = [];
  const lampCols = [];
  const lampSeeds = [];
  const path = [
    [hx - 1.7, SUMMIT_Y + 0.1, HILL.z + 1.3],
    [hx - 3.0, 8.5, HILL.z + 2.0],
    [hx - 4.4, 7.2, HILL.z + 2.8],
    [hx - 5.6, 5.9, HILL.z + 3.6],
    [hx - 6.8, 4.9, HILL.z + 4.6],
    [mx + 1.4, 3.9, maryHill.position.z + 0.6],
    [mx + 0.9, 3.0, maryHill.position.z + 1.6],
    [mx + 1.8, 2.1, maryHill.position.z + 2.6],
    [mx + 2.9, 1.3, maryHill.position.z + 3.4],
    [mx + 4.0, 0.7, maryHill.position.z + 4.4],
  ];
  path.forEach(([x, y, z], i) => {
    lampPts.push(x, y, z);
    lampCols.push(1.0, 0.78, 0.5);
    lampSeeds.push(Math.random());
    if (i < path.length - 1) {
      const [x2, y2, z2] = path[i + 1];
      lampPts.push((x + x2) / 2, (y + y2) / 2, (z + z2) / 2);
      lampCols.push(1.0, 0.74, 0.46);
      lampSeeds.push(Math.random());
    }
  });
  // the highway along the coast: a few white lights
  for (let i = 0; i < 9; i++) {
    lampPts.push(mx + 6 + i * 4.2, 0.55 + Math.sin(i) * 0.15, shore.position.z + 0.5);
    lampCols.push(0.8, 0.86, 1.0);
    lampSeeds.push(Math.random());
  }
  const lampGeo = new BufferGeometry();
  lampGeo.setAttribute('position', new BufferAttribute(new Float32Array(lampPts), 3));
  lampGeo.setAttribute('aColor', new BufferAttribute(new Float32Array(lampCols), 3));
  lampGeo.setAttribute('aSeed', new BufferAttribute(new Float32Array(lampSeeds), 1));
  const lamps = new Points(lampGeo, pointsMaterial({ uTime: uniforms.uTime, uFade: uniforms.uFade, uPixel: { value: dpr } }, 2.6));
  scene.add(lamps);

  // coconut palms on the slopes and the coast
  const palmGeo = palmGeometry();
  const palmMat = new MeshBasicMaterial({ color: '#0a121d', side: DoubleSide });
  const palmSpots = [
    [hx - 3.4, 8.6, 0.0, 1.3],
    [hx - 4.4, 7.4, 0.4, 1.1],
    [hx + 3.6, 8.9, 0.0, 1.4],
    [hx + 4.4, 8.4, 0.3, 1.2],
    [hx + 9.0, 6.6, 0.0, 1.3],
    [hx + 12.5, 6.0, 0.2, 1.1],
    [mx - 2.6, 2.8, 9.2, 1.0],
    [mx + 2.8, 2.9, 9.2, 1.05],
    [mx + 5.4, 1.4, 9.4, 1.2],
    [hx + 2, 0.9, 16.3, 1.3],
    [hx + 7, 1.0, 16.3, 1.1],
    [hx + 15, 1.1, 16.3, 1.4],
    [hx + 26, 0.9, 16.3, 1.2],
  ];
  const palms = new InstancedMesh(palmGeo, palmMat, palmSpots.length);
  const m4 = new Matrix4();
  const dummy = new Object3D();
  palmSpots.forEach(([x, y, dz, s], i) => {
    dummy.position.set(x, y - 0.1, HILL.z + dz + 0.3);
    dummy.scale.set(s * (i % 2 ? -1 : 1), s, s);
    dummy.updateMatrix();
    m4.copy(dummy.matrix);
    palms.setMatrixAt(i, m4);
  });
  scene.add(palms);

  /* ── Framing: put the statue where the layout wants it on every screen ── */
  const base = new Vector3();
  const look = new Vector3();
  let focus = null;
  function frame(width, height) {
    const aspect = width / height;
    camera.aspect = aspect;
    const portrait = aspect < 0.9;
    camera.fov = portrait ? 46 : aspect < 1.3 ? 38 : 30;
    camera.updateProjectionMatrix();
    base.set(portrait ? 4 : 0, portrait ? 3.4 : 2.4, portrait ? 22 : 30);
    camera.position.copy(base);
    look.copy(STATUE).add(new Vector3(0, 1.4, 0));
    camera.lookAt(look);
    // where the statue should sit on screen (NDC)
    const target = focus ? new Vector2(focus.x, focus.y) : portrait ? new Vector2(0.28, -0.26) : aspect < 1.3 ? new Vector2(0.42, -0.02) : new Vector2(0.44, 0.12);
    const tv = Math.tan((camera.fov * Math.PI) / 360);
    camera.rotateY(Math.atan(target.x * tv * aspect));
    camera.rotateX(Math.atan(-target.y * tv));
    camera.userData.q = camera.quaternion.clone();
    rays.quaternion.copy(camera.quaternion);
  }

  let w = 0;
  let h = 0;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === w && rect.height === h) return;
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    renderer.setSize(w, h, false);
    frame(w, h);
  }

  /* ── Input: the pointer leans the camera; leaving the hero dims the scene ── */
  const pointer = new Vector2();
  const lean = new Vector2();
  let scrollFade = 1;
  const onPointer = (e) => {
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  };
  const onScroll = () => {
    const r = canvas.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
    scrollFade = 1 - p * 0.55;
  };
  if (!reducedMotion) {
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── Loop ── */
  let raf = 0;
  let running = false;
  let started = performance.now();
  let intro = reducedMotion ? 1 : 0;
  let mercyBoost = 1;
  let firstFrameDone = false;

  function render(now) {
    const t = (now - started) / 1000;
    uniforms.uTime.value = reducedMotion ? 12.0 : t;
    if (!reducedMotion) intro = Math.min(1, intro + 0.012);
    const easeIntro = 1 - Math.pow(1 - intro, 3);
    lean.lerp(pointer, 0.045);
    camera.position.set(base.x + lean.x * 1.1, base.y + lean.y * 0.45 + (1 - scrollFade) * 3, base.z);
    if (camera.userData.q) camera.quaternion.copy(camera.userData.q);
    const fade = (0.35 + 0.65 * easeIntro) * scrollFade;
    uniforms.uFade.value = fade;
    [far, mid, hill, maryHill, shore].forEach((m) => (m.material.uniforms.uFade.value = fade));
    [statueGlow, chapelGlow, maryGlow].forEach((m) => (m.material.uniforms.uFade.value = fade));
    const leanBoost = 1 + Math.max(0, -lean.x) * 0.12;
    uniforms.uRay.value = Math.max(0, (easeIntro * 1.35 - 0.35)) * mercyBoost * leanBoost;
    renderer.render(scene, camera);
    if (!firstFrameDone) {
      firstFrameDone = true;
      onFirstFrame?.();
    }
  }

  function loop(now) {
    render(now);
    if (running) raf = requestAnimationFrame(loop);
  }

  const api = {
    start() {
      if (running || reducedMotion) return;
      running = true;
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    renderOnce() {
      resize();
      render(performance.now());
    },
    setFocus(x, y) {
      focus = { x, y };
      w = 0;
      resize();
      if (!running) render(performance.now());
    },
    setHourOfMercy(on) {
      mercyBoost = on ? 1.35 : 1;
      if (!running) api.renderOnce();
    },
    resize() {
      resize();
      if (!running) render(performance.now());
    },
    get running() {
      return running;
    },
    dispose() {
      api.stop();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      });
      shrine.userData.dispose?.();
      mary.userData.dispose?.();
      renderer.dispose();
      renderer.forceContextLoss?.();
    },
  };

  resize();
  return api;
}
