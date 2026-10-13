import gsap from "gsap";
import * as THREE from "three";
import { COCKPIT, cockpitBox } from "./cockpit";

/*
  Intro strony. Kamera siedzi w kokpicie BMW M4 (zdjęcie w Hero.tsx), tor widać przez przednią szybę.
  0.0–0.6   wnętrze auta wyłania się z ciemności, za szybą zgaszona belka startowa, na zegarach N i 0 km/h
  0.6–2.0   pięć par czerwonych świateł zapala się po kolei (czerwona poświata na kokpicie)
  2.6       nagle wszystkie pomarańczowe
  3.3       zielone = start: auto wystrzeliwuje, rosną prędkość i biegi na zegarach
  6.7       kokpit znika (przelot przez szybę), zostaje sam tor na cały ekran
  7.4       (Hero.tsx) logo Tirenders, tło przygasa, CTA
  ~8.0+     przejazd nocą z łagodnymi zakrętami (pętla), na horyzoncie panorama Warszawy
*/

export type LightsFrame = {
  kmh: number;
  gear: number;
  rpm: number;
  lit: number;
  signal: number;
  cockpit: number; // 1 = kamera w kokpicie, 0 = sam tor
  glow: number; // poświata świateł startowych na wnętrzu auta
  fade: number;
  shake: number;
};

export type LightsOptions = {
  mobile: boolean;
  reducedMotion: boolean;
  onLaunch?: () => void;
  onIntroDone?: () => void;
  onFrame?: (f: LightsFrame) => void;
};

// Wspólne zakrzywienie świata (tor skręca w dal) – ten sam kod w każdym shaderze.
const BEND = /* glsl */ `
  uniform float uCurve;
  vec3 bend(vec3 p) {
    float z = max(0.0, -p.z);
    p.x += uCurve * z * z * 0.0009;
    p.y -= z * z * 0.00003;
    return p;
  }
`;

const NOISE = /* glsl */ `
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1, 0)), c = hash(i + vec2(0, 1)), d = hash(i + vec2(1, 1));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
`;

const ROAD_W = 12;
const SIGNAL_COLORS = [0xff2216, 0xff8a00, 0x1aff5a];
const SIGNAL_VEC = [new THREE.Vector3(1, 0.04, 0.03), new THREE.Vector3(1, 0.45, 0.02), new THREE.Vector3(0.08, 1, 0.3)];
const LIGHT_X = [-2.4, -1.2, 0, 1.2, 2.4];
const GANTRY_Z = -11;
const LAMP_STEP = 24; // co tyle metrów maszt z lampą po obu stronach
const LAMPS = 16;

export class LightsScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(46, 1, 0.1, 400);
  private clock = new THREE.Clock();
  private raf = 0;
  private road: THREE.Mesh;
  private roadU: Record<string, THREE.IUniform>;
  private gantry = new THREE.Group();
  private bulbs: THREE.MeshBasicMaterial[] = [];
  private glows: THREE.Sprite[] = [];
  private streaks: THREE.InstancedMesh;
  private streakData: { x: number; y: number; z: number; len: number; red: boolean; thick: number }[] = [];
  private streakU: Record<string, THREE.IUniform>;
  private haze: THREE.Mesh;
  private poles: number[] = [];
  private skyline!: THREE.Mesh;
  private poleMesh!: THREE.InstancedMesh;
  private tl: gsap.core.Timeline | null = null;
  private launched = false;
  private vw = 1;
  private vh = 1;
  private frame: LightsFrame = { kmh: 0, gear: 0, rpm: 0, lit: 0, signal: 0, cockpit: 1, glow: 0, fade: 0, shake: 0 };

  S = {
    fade: 0,
    lit: 0, // 0..5
    speed: 0, // m/s
    travel: 0,
    fovKick: 0,
    shake: 0,
    curveAmp: 0,
    cruise: 0,
    rev: 0.12, // obroty na postoju (0..1)
    signal: 0, // 0 czerwone, 1 pomarańczowe, 2 zielone
    flash: 0,
    tilt: 1.0, // bez kokpitu kamera patrzy w górę na belkę, po starcie na tor
    cockpit: 1,
    glow: 0,
  };

  constructor(private canvas: HTMLCanvasElement, private o: LightsOptions) {
    const r = new THREE.WebGLRenderer({ canvas, antialias: !o.mobile, powerPreference: "high-performance" });
    r.setPixelRatio(Math.min(window.devicePixelRatio, o.mobile ? 1.3 : 1.75));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.setClearColor(0x000000, 1);
    this.renderer = r;
    this.scene.fog = new THREE.Fog(0x000000, 30, 190);
    this.camera.position.set(0, 1.15, 0);

    // ---------- nawierzchnia ----------
    this.roadU = {
      uTravel: { value: 0 },
      uCurve: { value: 0 },
      uLit: { value: 0 },
      uFade: { value: 0 },
      uTime: { value: 0 },
      uSpeed: { value: 0 },
      uFlash: { value: 0 },
      uGantryZ: { value: GANTRY_Z },
      uHeadOn: { value: 0 },
      uSig: { value: new THREE.Vector3(1, 0.04, 0.03) },
    };
    const roadGeo = new THREE.PlaneGeometry(80, 400, 80, 400);
    roadGeo.rotateX(-Math.PI / 2);
    roadGeo.translate(0, 0, -195);
    this.road = new THREE.Mesh(
      roadGeo,
      new THREE.ShaderMaterial({
        uniforms: this.roadU,
        vertexShader: /* glsl */ `
          ${BEND}
          varying vec3 vP;
          varying float vDepth;
          void main() {
            vP = position;
            vec3 p = bend(position);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            vDepth = -mv.z;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTravel, uLit, uFade, uTime, uSpeed, uFlash, uGantryZ, uHeadOn;
          uniform vec3 uSig;
          varying vec3 vP;
          varying float vDepth;
          ${NOISE}
          void main() {
            float x = vP.x;
            float z = vP.z - uTravel;            // współrzędna toru (przesuwa się z jazdą)
            float ax = abs(x);
            float halfW = ${(ROAD_W / 2).toFixed(1)};

            // asfalt: ziarno + mokre plamy, rozmyte w ruchu
            float blur = clamp(uSpeed / 80.0, 0.0, 1.0);
            float grain = mix(noise(vec2(x * 30.0, z * 30.0)), noise(vec2(x * 30.0, z * 2.0)), blur);
            float wet = smoothstep(0.35, 0.8, noise(vec2(x * 0.25, z * 0.08)));
            vec3 col = vec3(0.0025 + grain * 0.004);

            // linie: krawędzie ciągłe, środek przerywany
            float edge = smoothstep(0.09, 0.05, abs(ax - (halfW - 0.35)));
            float dash = step(0.5, fract(z / 9.0)) * smoothstep(0.09, 0.05, ax);
            float paint = (edge + dash) * (0.65 + grain * 0.3);

            // krawężniki czerwono-białe za linią
            float kerb = step(halfW - 0.1, ax) * step(ax, halfW + 1.1);
            float stripe = step(0.5, fract(z / 2.0));
            vec3 kerbCol = mix(vec3(0.42, 0.015, 0.015), vec3(0.62), stripe) * (0.55 + grain * 0.4);

            // światło: maszty co LAMP_STEP m (plamy uciekają pod kamerę) + własne reflektory po starcie
            float zz = mod(z + ${(LAMP_STEP / 2).toFixed(1)}, ${LAMP_STEP.toFixed(1)}) - ${(LAMP_STEP / 2).toFixed(1)};
            float lamp = exp(-zz * zz * 0.016) * (exp(-pow(ax - halfW, 2.0) * 0.035) * 0.8 + 0.25);
            float head = exp(-x * x * 0.035) * smoothstep(1.5, 7.0, -vP.z) * exp(vP.z * 0.045) * uHeadOn;
            float light = 0.06 + lamp * 1.0 + head * 0.9;
            col += vec3(0.1) * light * (0.4 + grain * 1.2) * (1.0 - wet * 0.4);
            col += vec3(0.75) * paint * light;
            col = mix(col, kerbCol * light, kerb);
            // mokre odbicia lamp: jasne smugi na asfalcie
            col += vec3(0.5, 0.48, 0.45) * lamp * wet * 0.08 * smoothstep(halfW + 1.0, halfW - 3.0, ax);
            float run = step(halfW + 1.1, ax);
            col = mix(col, vec3(0.002 + grain * 0.003) * light, run);

            // światło nad startem: plama pod belką
            float dz = vP.z - (uGantryZ + uTravel);
            float pool = exp(-(x * x) * 0.03 - dz * dz * 0.012) * (0.04 + uLit * 0.0);
            col += vec3(0.6) * pool;

            // czerwone odbicia świateł startowych na mokrym asfalcie: pionowe smugi w stronę kamery
            float refl = 0.0;
            ${LIGHT_X.map((lx, i) => `refl += step(${(i + 0.5).toFixed(1)}, uLit) * exp(-pow((x - ${lx.toFixed(1)}) * 3.2, 2.0)) * smoothstep(-36.0, -2.0, vP.z) * smoothstep(uGantryZ + uTravel - 2.0, uGantryZ + uTravel + 10.0, vP.z);`).join("\n            ")}
            col += uSig * refl * (0.12 + wet * 0.35) * (0.7 + grain * 0.6);

            // iskry wilgoci w czerwieni
            float sp = step(0.992, hash(floor(vec2(x, z) * 50.0)));
            col += uSig * sp * refl * 0.8;

            col += vec3(uFlash * 0.02);
            col *= uFade * smoothstep(${(ROAD_W * 2.6).toFixed(1)}, ${(ROAD_W * 0.9).toFixed(1)}, ax);
            col *= 1.0 - smoothstep(40.0, 190.0, vDepth);
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      }),
    );
    this.scene.add(this.road);

    // ---------- belka startowa ----------
    const housing = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.55, metalness: 0.6 });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.18, 0.3), housing);
    beam.position.set(0, 4.15, 0);
    this.gantry.add(beam);
    for (const sx of [-4.1, 4.1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 4.2, 0.16), housing);
      post.position.set(sx, 2.1, 0);
      this.gantry.add(post);
    }
    const glowTex = radialTexture();
    LIGHT_X.forEach((lx) => {
      const pod = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.55, 0.34), housing);
      pod.position.set(lx, 3.3, 0);
      this.gantry.add(pod);
      for (let row = 0; row < 2; row++) {
        const m = new THREE.MeshBasicMaterial({ color: 0x1a0505, toneMapped: false, fog: false });
        const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), m);
        bulb.position.set(lx, 3.55 - row * 0.52, 0.175);
        this.gantry.add(bulb);
        this.bulbs.push(m);
        const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff1a12, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity: 0 }));
        g.position.copy(bulb.position).setZ(0.25);
        g.scale.setScalar(2.3);
        this.gantry.add(g);
        this.glows.push(g);
      }
    });
    const spot = new THREE.PointLight(0xffffff, 6, 14, 1.6);
    spot.position.set(0, 5.2, 1.2);
    this.gantry.add(spot);
    this.gantry.position.set(0, 0, GANTRY_Z);
    this.scene.add(this.gantry);
    this.scene.add(new THREE.HemisphereLight(0x8a8f99, 0x000000, 0.15));

    // ---------- smugi świateł wzdłuż toru ----------
    // smugi = głowice lamp na masztach + diody na barierach; po starcie rozciągają się w linie
    const N = LAMPS * 2 + (o.mobile ? 60 : 120);
    this.streakU = { uCurve: this.roadU.uCurve, uStretch: { value: 0 }, uFade: { value: 0 } };
    const sg = new THREE.PlaneGeometry(1, 1);
    this.streaks = new THREE.InstancedMesh(
      sg,
      new THREE.ShaderMaterial({
        uniforms: this.streakU,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide, // billboard może odwrócić kolejność wierzchołków
        vertexShader: /* glsl */ `
          ${BEND}
          uniform float uStretch;
          attribute vec3 iColor;
          varying vec3 vColor;
          varying vec2 vUv;
          varying float vDepth;
          void main() {
            vUv = uv;
            vColor = iColor;
            vec3 base = vec3(instanceMatrix[3].xyz);
            float thick = length(instanceMatrix[0].xyz);
            float len = max(thick * 1.2, length(instanceMatrix[1].xyz) * uStretch);
            vec4 va = viewMatrix * vec4(bend(base + vec3(0.0, 0.0, -len)), 1.0);
            vec4 vb = viewMatrix * vec4(bend(base), 1.0);
            vec4 pos = mix(va, vb, position.y + 0.5);
            vec2 dir = normalize(vb.xy - va.xy + vec2(1e-5));
            pos.xy += vec2(-dir.y, dir.x) * position.x * thick;
            vDepth = -pos.z;
            gl_Position = projectionMatrix * pos;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uFade;
          varying vec3 vColor;
          varying vec2 vUv;
          varying float vDepth;
          void main() {
            float a = smoothstep(0.5, 0.0, abs(vUv.x - 0.5)) * smoothstep(0.0, 0.5, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
            a *= 1.0 - smoothstep(80.0, 200.0, vDepth);
            gl_FragColor = vec4(vColor * a * uFade, 1.0);
          }
        `,
      }),
      N,
    );
    const colors = new Float32Array(N * 3);
    let i = 0;
    for (let k = 0; k < LAMPS; k++)
      for (const side of [-1, 1]) {
        this.streakData.push({ x: side * (ROAD_W / 2 - 0.4), y: 5.95, z: -(k * LAMP_STEP), len: 5, red: false, thick: 0.4 });
        colors.set([1, 0.95, 0.85], i++ * 3);
      }
    while (i < N) {
      const side = i % 2 ? 1 : -1;
      const red = Math.random() < 0.5;
      this.streakData.push({ x: side * (ROAD_W / 2 + 2.6 + Math.random() * 0.4), y: 0.55 + (Math.random() < 0.3 ? 0.4 : 0), z: -Math.random() * LAMPS * LAMP_STEP, len: 6 + Math.random() * 6, red, thick: 0.12 });
      colors.set(red ? [1, 0.06, 0.04] : [0.8, 0.82, 0.9], i++ * 3);
    }
    this.streaks.geometry.setAttribute("iColor", new THREE.InstancedBufferAttribute(colors, 3));
    this.streaks.frustumCulled = false;
    this.scene.add(this.streaks);

    // maszty oświetleniowe (sylwetki) – ramię nad tor, głowica to smuga z listy wyżej
    const post = new THREE.BoxGeometry(0.16, 6.3, 0.16).translate(0, 3.15, 0);
    const arm = new THREE.BoxGeometry(1.7, 0.1, 0.12).translate(0.85, 6.2, 0);
    const poleGeo = mergeBoxes([post, arm]);
    this.poleMesh = new THREE.InstancedMesh(
      poleGeo,
      new THREE.ShaderMaterial({
        uniforms: { uCurve: this.roadU.uCurve, uFade: this.streakU.uFade },
        vertexShader: /* glsl */ `
          ${BEND}
          varying float vH;
          varying float vDepth;
          void main() {
            vec4 w = instanceMatrix * vec4(position, 1.0);
            vH = position.y;
            vec4 mv = viewMatrix * vec4(bend(w.xyz), 1.0);
            vDepth = -mv.z;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uFade;
          varying float vH;
          varying float vDepth;
          void main() {
            float c = 0.012 + smoothstep(4.5, 6.2, vH) * 0.05;
            c *= 1.0 - smoothstep(60.0, 190.0, vDepth);
            gl_FragColor = vec4(vec3(c) * uFade, 1.0);
          }
        `,
      }),
      LAMPS * 2,
    );
    for (let k = 0; k < LAMPS; k++) this.poles.push(-(ROAD_W / 2 + 1.3), ROAD_W / 2 + 1.3);
    this.poleMesh.frustumCulled = false;
    this.scene.add(this.poleMesh);

    // panorama Warszawy na horyzoncie: łuna miasta + sylwetki wieżowców i Pałac Kultury
    this.skyline = new THREE.Mesh(
      new THREE.PlaneGeometry(520, 90, 60, 1),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uCurve: this.roadU.uCurve, uFade: { value: 0 }, uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          ${BEND}
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec4 w = modelMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * viewMatrix * vec4(bend(w.xyz), 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uFade, uTime;
          varying vec2 vUv;
          ${NOISE}
          // wysokość zabudowy (0..1 wysokości planszy) w punkcie x
          float city(float x) {
            float cell = floor(x * 140.0);
            float h = 0.03 + hash(vec2(cell, 3.0)) * 0.05;
            if (hash(vec2(cell, 7.0)) > 0.86) h += 0.06 + hash(vec2(cell, 9.0)) * 0.08; // wieżowce
            // Pałac Kultury i Nauki: stopnie, wieża, iglica
            float d = abs(x - 0.47);
            float pk = 0.0;
            pk = max(pk, step(d, 0.022) * 0.07);
            pk = max(pk, step(d, 0.014) * 0.11);
            pk = max(pk, step(d, 0.009) * 0.16);
            pk = max(pk, step(d, 0.006) * 0.2);
            pk = max(pk, step(d, 0.0035) * 0.235);
            pk = max(pk, step(d, 0.0009) * 0.29);
            // Varso Tower: najwyższy budynek w UE
            float v = abs(x - 0.535);
            pk = max(pk, step(v, 0.004) * 0.24);
            pk = max(pk, step(v, 0.0007) * 0.31);
            return max(h, pk);
          }
          void main() {
            float y = vUv.y;
            float glow = exp(-y * 7.0) * 0.32 + exp(-y * 2.5) * 0.05;
            vec3 sky = vec3(0.35, 0.18, 0.16) * glow;
            float h = city(vUv.x) + 0.02;
            float b = step(y, h);
            // światła w oknach
            vec2 g = floor(vec2(vUv.x * 900.0, y * 300.0));
            float win = step(0.965, hash(g)) * step(0.5, fract(vUv.x * 900.0)) * step(0.4, fract(y * 300.0));
            vec3 col = mix(sky, vec3(0.006) + vec3(0.9, 0.75, 0.5) * win * 0.5, b);
            // czerwone światła ostrzegawcze na czubkach
            float tip = step(0.22, h - 0.02) * smoothstep(0.004, 0.0, abs(y - h + 0.002)) * (0.6 + 0.4 * sin(uTime * 2.0 + vUv.x * 50.0));
            col += vec3(1.0, 0.05, 0.03) * tip * 0.6;
            float a = uFade;
            gl_FragColor = vec4(col * a, a);
          }
        `,
      }),
    );
    this.skyline.position.set(0, 43, -188);
    this.scene.add(this.skyline);

    // mgła/dym przy ziemi na horyzoncie
    this.haze = new THREE.Mesh(
      new THREE.PlaneGeometry(220, 40),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uFade: { value: 0 }, uRed: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime, uFade, uRed; varying vec2 vUv;
          ${NOISE}
          void main() {
            vec2 p = vUv * vec2(9.0, 2.0);
            float f = noise(p + vec2(uTime * 0.05, 0.0)) * noise(p * 2.1 - vec2(uTime * 0.03, 0.0));
            float mask = smoothstep(0.0, 0.3, vUv.y) * smoothstep(0.75, 0.32, vUv.y);
            vec3 c = mix(vec3(0.5), vec3(1.0, 0.1, 0.06), uRed);
            gl_FragColor = vec4(c * f * mask * 0.22 * uFade, 1.0);
          }
        `,
      }),
    );
    this.haze.position.set(0, 6, -120);
    this.scene.add(this.haze);

    this.resize();
    window.addEventListener("resize", this.onResize);
    this.layoutStreaks();
    this.timeline();
    this.loop();
  }

  private timeline() {
    const S = this.S;
    const tl = gsap.timeline({ onComplete: () => this.o.onIntroDone?.() });
    this.tl = tl;
    tl.to(S, { fade: 1, duration: 1.2, ease: "power2.out" }, 0);
    // czerwone zapalają się po kolei → nagle wszystkie pomarańczowe → zielone = start
    for (let i = 1; i <= 5; i++) tl.set(S, { lit: i }, 0.6 + (i - 1) * 0.35);
    for (let i = 1; i <= 5; i++) tl.to(S, { glow: i / 5, duration: 0.18, ease: "power2.out" }, 0.6 + (i - 1) * 0.35);
    tl.to(S, { rev: 0.58, duration: 1.1, ease: "power2.out" }, 1.4); // kierowca trzyma obroty przed startem
    tl.set(S, { signal: 1 }, 2.6);
    const out = 3.3;
    tl.set(S, { signal: 2 }, out);
    tl.call(() => {
      this.launched = true;
      this.o.onLaunch?.();
    }, [], out);
    tl.to(S, { flash: 1, duration: 0.06 }, out);
    tl.to(S, { flash: 0, duration: 0.5 }, out + 0.06);
    tl.to(S, { speed: 78, duration: 4.4, ease: "power2.out" }, out);
    tl.to(S, { fovKick: 1, duration: 0.6, ease: "power3.out" }, out);
    tl.to(S, { fovKick: 0.45, duration: 3.5, ease: "sine.inOut" }, out + 0.8);
    tl.to(S, { tilt: -0.05, duration: 1.3, ease: "power2.inOut" }, out);
    tl.to(S, { shake: 1, duration: 0.2 }, out);
    tl.to(S, { shake: 0.25, duration: 2.5 }, out + 0.4);
    tl.to(S, { glow: 0, duration: 1.4, ease: "power2.out" }, out + 0.15);
    // kokpit znika: kamera przelatuje przez szybę i zostaje sam tor
    tl.to(S, { cockpit: 0, duration: 1.3, ease: "power2.inOut" }, out + COCKPIT.exitAt);
    // przejście w spokojny przejazd z zakrętami
    tl.to(S, { speed: 52, duration: 2.5, ease: "sine.inOut" }, out + 4.6);
    tl.to(S, { curveAmp: 1, cruise: 1, duration: 3, ease: "sine.inOut" }, out + 4.2);
    if (this.o.reducedMotion) {
      tl.progress(1);
      this.launched = true;
      this.o.onLaunch?.();
    }
  }

  skip() {
    if (!this.tl || this.tl.progress() >= 1) return;
    this.tl.progress(1);
    if (!this.launched) {
      this.launched = true;
      this.o.onLaunch?.();
    }
  }

  private onResize = () => this.resize();

  private resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.vw = w;
    this.vh = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private layoutStreaks() {
    const m = new THREE.Matrix4();
    this.streakData.forEach((s, i) => {
      m.makeScale(s.thick, s.len, 1);
      m.setPosition(s.x, s.y, s.z);
      this.streaks.setMatrixAt(i, m);
    });
    this.streaks.instanceMatrix.needsUpdate = true;
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    this.S.travel += this.S.speed * dt;
    this.update(dt, t);
    this.renderer.render(this.scene, this.camera);
  };

  private gearOf(kmh: number) {
    const top = [0, 62, 104, 146, 190, 236, 300];
    let g = 1;
    while (g < 6 && kmh > top[g]) g++;
    const lo = top[g - 1];
    const hi = top[g];
    return { gear: kmh < 1 ? 0 : g, rpm: kmh < 1 ? 900 + this.S.rev * 6500 : 3600 + ((kmh - lo) / (hi - lo)) * 4200 };
  }

  private update(dt: number, t: number) {
    const S = this.S;
    const u = this.roadU;
    u.uTime.value = t;
    u.uFade.value = S.fade;
    u.uTravel.value = S.travel;
    u.uSpeed.value = S.speed;
    u.uFlash.value = S.flash;
    u.uLit.value = S.lit;
    (u.uSig.value as THREE.Vector3).copy(SIGNAL_VEC[S.signal]);
    u.uCurve.value = Math.sin(t * 0.16) * 1.1 * S.curveAmp + Math.sin(t * 0.07 + 1.3) * 0.5 * S.curveAmp;

    // belka odjeżdża za kamerę po starcie
    this.gantry.position.z = GANTRY_Z + S.travel;
    this.gantry.visible = this.gantry.position.z < 6;
    u.uGantryZ.value = GANTRY_Z;
    this.bulbs.forEach((m, i) => {
      const on = S.lit >= Math.floor(i / 2) + 1;
      const col = SIGNAL_COLORS[S.signal];
      m.color.setHex(on ? col : 0x140606);
      this.glows[i].material.color.setHex(col);
      this.glows[i].material.opacity = on ? 0.95 : 0;
    });

    // smugi: przewijanie z prędkością, zawijanie w dal
    const m = new THREE.Matrix4();
    const stretch = Math.min(1, S.speed / 70);
    this.streakU.uStretch.value = stretch * 1.6;
    this.streakU.uFade.value = S.fade * (0.55 + stretch * 0.45);
    this.poles.forEach((p, k) => {
      const span = LAMPS * LAMP_STEP;
      const z = (((((-(Math.floor(k / 2)) * LAMP_STEP + S.travel) - 12) % span) + span) % span) - span + 12;
      m.makeScale(p < 0 ? 1 : -1, 1, 1);
      m.setPosition(p, 0, z);
      this.poleMesh.setMatrixAt(k, m);
    });
    this.poleMesh.instanceMatrix.needsUpdate = true;
    u.uHeadOn.value = this.launched ? 1 : 0.15;
    this.streakData.forEach((s, i) => {
      const span = LAMPS * LAMP_STEP;
      let z = s.z + S.travel;
      z = ((((z - 12) % span) + span) % span) - span + 12;
      m.makeScale(s.thick, s.len, 1);
      m.setPosition(s.x, s.y, z);
      this.streaks.setMatrixAt(i, m);
    });
    this.streaks.instanceMatrix.needsUpdate = true;

    const sk = this.skyline.material as THREE.ShaderMaterial;
    sk.uniforms.uFade.value = S.fade;
    sk.uniforms.uTime.value = t;
    const hz = this.haze.material as THREE.ShaderMaterial;
    hz.uniforms.uTime.value = t;
    hz.uniforms.uFade.value = S.fade;
    hz.uniforms.uRed.value = this.launched ? 0 : S.lit / 5;

    // kamera: niska, jak z kokpitu; kopnięcie FOV przy starcie, wstrząsy, przechył w zakrętach
    // w kokpicie: kadr przesunięty tak, żeby środek widoku wypadał na wprost kierowcy w szybie,
    // a FOV dobrany do wysokości szyby; przy znikaniu kokpitu płynnie wraca do pełnego ekranu
    const cam = this.camera;
    const C = S.cockpit;
    const portrait = cam.aspect < 1;
    const baseFov = portrait ? 66 : 46;
    const box = cockpitBox(this.vw, this.vh);
    const glass = COCKPIT.glassH * box.s;
    const cockpitFov = (2 * Math.atan(Math.tan((15 * Math.PI) / 180) * (this.vh / glass)) * 180) / Math.PI;
    cam.fov = baseFov + (cockpitFov - baseFov) * C + S.fovKick * 16 * (1 - 0.6 * C);
    const dx = (box.x + COCKPIT.aimX * box.s - this.vw / 2) * C;
    const dy = (box.y + COCKPIT.aimY * box.s - this.vh / 2) * C;
    cam.setViewOffset(this.vw, this.vh, -dx, -dy, this.vw, this.vh);
    const sh = S.shake * (0.012 + stretch * 0.01);
    cam.position.set((Math.random() - 0.5) * sh, 1.15 + (Math.random() - 0.5) * sh, 0);
    const lookAhead = 30;
    const curveX = u.uCurve.value * lookAhead * lookAhead * 0.0009 * 0.35;
    cam.lookAt(curveX, 1.15 + S.tilt * (1 - C), -lookAhead);
    cam.rotation.z += -u.uCurve.value * 0.03 * S.cruise;

    const kmh = S.speed * 3.6;
    const g = this.gearOf(kmh);
    const f = this.frame;
    f.kmh = kmh;
    f.gear = g.gear;
    f.rpm = g.rpm;
    f.lit = S.lit;
    f.signal = S.signal;
    f.cockpit = C;
    f.glow = S.glow;
    f.fade = S.fade;
    f.shake = S.shake;
    this.o.onFrame?.(f);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    this.tl?.kill();
    this.renderer.dispose();
  }
}

function mergeBoxes(geos: THREE.BufferGeometry[]) {
  const pos: number[] = [];
  const idx: number[] = [];
  let off = 0;
  for (const g of geos) {
    const p = g.getAttribute("position").array;
    pos.push(...p);
    g.index!.array.forEach((v) => idx.push(v + off));
    off += p.length / 3;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setIndex(idx);
  return out;
}

function radialTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.15, "rgba(255,255,255,0.8)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.16)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
