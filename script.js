import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/postprocessing/OutputPass.js";

/* =========================================================
   THE UNKNOWN — 3D OBSERVATORY
   Main Three.js engine
   ========================================================= */

const sceneContainer = document.getElementById("scene");

const sceneTitle = document.getElementById("sceneTitle");
const sceneText = document.getElementById("sceneText");
const modeEl = document.getElementById("mode");
const objectsEl = document.getElementById("objects");
const fpsEl = document.getElementById("fps");

const boot = document.getElementById("boot");
const hud = document.getElementById("hud");
const homeOverlay = document.getElementById("homeOverlay");

const inspect = document.getElementById("inspect");
const inspectName = document.getElementById("inspectName");
const inspectText = document.getElementById("inspectText");
const inspectFact = document.getElementById("inspectFact");
const inspectTag = document.getElementById("inspectTag");

const autoBtn = document.getElementById("auto");
const resetBtn = document.getElementById("reset");
const qualityBtn = document.getElementById("quality");

const closeInspectBtn = document.getElementById("closeInspect");

/* =========================================================
   BASIC STATE
   ========================================================= */

let currentView = "home";
let autoOrbit = false;
let qualityMode = "auto";

let interactiveObjects = [];
let activeSceneObjects = [];

let solarSystemGroup;
let blackHoleGroup;
let dnaGroup;
let quantumGroup;
let aiGroup;

let clock = new THREE.Clock();
let elapsed = 0;

let frames = 0;
let lastFPSUpdate = performance.now();

/* =========================================================
   RENDERER
   ========================================================= */

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio || 1, 2)
);

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.setClearColor(0x02030a, 1);

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

sceneContainer.appendChild(renderer.domElement);

/* =========================================================
   SCENE
   ========================================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x02030a);

scene.fog = new THREE.FogExp2(
  0x02030a,
  0.00075
);

/* =========================================================
   CAMERA
   ========================================================= */

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);

camera.position.set(
  0,
  32,
  75
);

/* =========================================================
   CONTROLS
   ========================================================= */

const controls = new OrbitControls(
  camera,
  renderer.domElement
);

controls.enableDamping = true;
controls.dampingFactor = 0.055;

controls.enablePan = true;

controls.minDistance = 4;
controls.maxDistance = 900;

controls.target.set(0, 0, 0);

/* =========================================================
   POST PROCESSING
   ========================================================= */

let composer = null;

try {
  composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(
    scene,
    camera
  );

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(
      window.innerWidth,
      window.innerHeight
    ),
    0.7,
    0.7,
    0.35
  );

  bloomPass.threshold = 0.05;
  bloomPass.strength = 0.75;
  bloomPass.radius = 0.65;

  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
} catch (error) {
  console.warn(
    "Post-processing unavailable. Using normal renderer.",
    error
  );

  composer = null;
}

/* =========================================================
   LIGHTS
   ========================================================= */

const ambientLight = new THREE.AmbientLight(
  0x9ba8ff,
  0.32
);

scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(
  0xffffff,
  1.4
);

mainLight.position.set(
  80,
  120,
  100
);

scene.add(mainLight);

/* =========================================================
   STARFIELD
   ========================================================= */

function createStarfield() {

  const count =
    qualityMode === "low"
      ? 2500
      : 6500;

  const positions = new Float32Array(
    count * 3
  );

  const sizes = new Float32Array(
    count
  );

  for (let i = 0; i < count; i++) {

    const radius =
      500 +
      Math.random() * 1800;

    const theta =
      Math.random() * Math.PI * 2;

    const phi =
      Math.acos(
        2 * Math.random() - 1
      );

    positions[i * 3] =
      radius *
      Math.sin(phi) *
      Math.cos(theta);

    positions[i * 3 + 1] =
      radius *
      Math.cos(phi);

    positions[i * 3 + 2] =
      radius *
      Math.sin(phi) *
      Math.sin(theta);

    sizes[i] =
      0.5 +
      Math.random() * 2.5;
  }

  const geometry =
    new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      positions,
      3
    )
  );

  const material =
    new THREE.PointsMaterial({
      color: 0xe7edff,
      size: 1.5,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true
    });

  const stars =
    new THREE.Points(
      geometry,
      material
    );

  stars.name = "Deep Space Starfield";

  scene.add(stars);

  activeSceneObjects.push(stars);

  return stars;
}

const starfield = createStarfield();

/* =========================================================
   HELPERS
   ========================================================= */

function addInteractive(
  object,
  name,
  text,
  fact,
  tag = "OBJECT"
) {

  object.userData.inspectable = true;

  object.userData.info = {
    name,
    text,
    fact,
    tag
  };

  interactiveObjects.push(object);
}

function clearWorld() {

  const keep = [
    starfield
  ];

  [...scene.children].forEach(
    child => {

      if (
        child !== starfield &&
        child !== ambientLight &&
        child !== mainLight
      ) {

        scene.remove(child);

        disposeObject(child);
      }
    }
  );

  interactiveObjects = [];

  activeSceneObjects = keep.slice();
}

function disposeObject(object) {

  object.traverse(
    child => {

      if (child.geometry) {
        child.geometry.dispose();
      }

      if (child.material) {

        if (
          Array.isArray(
            child.material
          )
        ) {

          child.material.forEach(
            material => {

              if (material.map) {
                material.map.dispose();
              }

              material.dispose();
            }
          );

        } else {

          if (child.material.map) {
            child.material.map.dispose();
          }

          child.material.dispose();
        }
      }
    }
  );
}

function resetCamera(
  position = [0, 32, 75],
  target = [0, 0, 0]
) {

  camera.position.set(
    position[0],
    position[1],
    position[2]
  );

  controls.target.set(
    target[0],
    target[1],
    target[2]
  );

  controls.update();
}

function setSceneInfo(
  title,
  description,
  mode
) {

  sceneTitle.textContent = title;
  sceneText.textContent = description;
  modeEl.textContent = mode;
}

function updateObjectCount() {

  objectsEl.textContent =
    String(
      Math.max(
        0,
        interactiveObjects.length
      )
    ).padStart(2, "0");
}

/* =========================================================
   MATERIAL HELPERS
   ========================================================= */

function glowMaterial(
  color,
  intensity = 1
) {

  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.35,
    metalness: 0.15
  });
}

/* =========================================================
   SOLAR SYSTEM
   ========================================================= */

function createSolarSystem() {

  clearWorld();

  solarSystemGroup =
    new THREE.Group();

  scene.add(solarSystemGroup);

  /* SUN */

  const sunGeometry =
    new THREE.SphereGeometry(
      8,
      64,
      64
    );

  const sunMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xffc35c,
      emissive: 0xff8c18,
      emissiveIntensity: 2.8,
      roughness: 0.5
    });

  const sun =
    new THREE.Mesh(
      sunGeometry,
      sunMaterial
    );

  sun.name = "Sun";

  solarSystemGroup.add(sun);

  addInteractive(
    sun,
    "THE SUN",
    "The star at the center of our Solar System. Its gravity dominates planetary motion.",
    "The Sun contains more than 99% of the Solar System's total mass.",
    "STAR"
  );

  const sunLight =
    new THREE.PointLight(
      0xffd28a,
      500,
      1000
    );

  sunLight.position.set(
    0,
    0,
    0
  );

  solarSystemGroup.add(
    sunLight
  );

  /* PLANETS */

  const planets = [
    {
      name: "MERCURY",
      radius: 1.0,
      distance: 14,
      color: 0x8e8275,
      speed: 0.9
    },
    {
      name: "VENUS",
      radius: 1.45,
      distance: 19,
      color: 0xd8ad72,
      speed: 0.72
    },
    {
      name: "EARTH",
      radius: 1.65,
      distance: 25,
      color: 0x3c78b8,
      speed: 0.58
    },
    {
      name: "MARS",
      radius: 1.25,
      distance: 31,
      color: 0xb9553c,
      speed: 0.47
    },
    {
      name: "JUPITER",
      radius: 4.2,
      distance: 43,
      color: 0xc69b76,
      speed: 0.30
    },
    {
      name: "SATURN",
      radius: 3.5,
      distance: 57,
      color: 0xd1b982,
      speed: 0.23
    },
    {
      name: "URANUS",
      radius: 2.4,
      distance: 70,
      color: 0x75cbd1,
      speed: 0.18
    },
    {
      name: "NEPTUNE",
      radius: 2.35,
      distance: 83,
      color: 0x4169d1,
      speed: 0.14
    }
  ];

  planets.forEach(
    data => {

      const orbit =
        new THREE.Group();

      orbit.userData.angle =
        Math.random() *
        Math.PI *
        2;

      orbit.userData.distance =
        data.distance;

      orbit.userData.speed =
        data.speed;

      solarSystemGroup.add(
        orbit
      );

      /* ORBIT LINE */

      const orbitCurve =
        new THREE.EllipseCurve(
          0,
          0,
          data.distance,
          data.distance
        );

      const orbitPoints =
        orbitCurve.getPoints(
          180
        );

      const orbitGeometry =
        new THREE.BufferGeometry().setFromPoints(
          orbitPoints.map(
            p =>
              new THREE.Vector3(
                p.x,
                0,
                p.y
              )
          )
        );

      const orbitMaterial =
        new THREE.LineBasicMaterial({
          color: 0x44506e,
          transparent: true,
          opacity: 0.28
        });

      const orbitLine =
        new THREE.Line(
          orbitGeometry,
          orbitMaterial
        );

      solarSystemGroup.add(
        orbitLine
      );

      /* PLANET */

      const geometry =
        new THREE.SphereGeometry(
          data.radius,
          48,
          48
        );

      const material =
        new THREE.MeshStandardMaterial({
          color: data.color,
          roughness: 0.75,
          metalness: 0.05
        });

      const planet =
        new THREE.Mesh(
          geometry,
          material
        );

      planet.position.x =
        data.distance;

      orbit.add(
        planet
      );

      planet.userData.orbit =
        orbit;

      planet.userData.rotationSpeed =
        0.25 +
        Math.random() * 0.8;

      addInteractive(
        planet,
        data.name,
        `${data.name} — a conceptual 3D representation designed for exploration.`,
        `Orbital distance and size are compressed for an interactive web experience.`,
        "PLANET"
      );

      /* SATURN RINGS */

      if (
        data.name === "SATURN"
      ) {

        const ringGeometry =
          new THREE.RingGeometry(
            4.5,
            7,
            96
          );

        const ringMaterial =
          new THREE.MeshBasicMaterial({
            color: 0xc9b998,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.72
          });

        const rings =
          new THREE.Mesh(
            ringGeometry,
            ringMaterial
          );

        rings.rotation.x =
          Math.PI / 2.25;

        planet.add(
          rings
        );
      }

      /* EARTH MOON */

      if (
        data.name === "EARTH"
      ) {

        const moonOrbit =
          new THREE.Group();

        planet.add(
          moonOrbit
        );

        const moon =
          new THREE.Mesh(
            new THREE.SphereGeometry(
              0.43,
              32,
              32
            ),
            new THREE.MeshStandardMaterial({
              color: 0x9a9a9a,
              roughness: 0.95
            })
          );

        moon.position.x =
          3.5;

        moonOrbit.add(
          moon
        );

        moonOrbit.userData.speed =
          1.2;

        addInteractive(
          moon,
          "THE MOON",
          "Earth's natural satellite, shown orbiting the Earth.",
          "The Moon completes one orbit around Earth in about 27.3 days.",
          "SATELLITE"
        );

        /* ARTIFICIAL SATELLITE */

        const satelliteOrbit =
          new THREE.Group();

        planet.add(
          satelliteOrbit
        );

        const satellite =
          new THREE.Mesh(
            new THREE.BoxGeometry(
              0.18,
              0.18,
              0.5
            ),
            new THREE.MeshStandardMaterial({
              color: 0xe8e8e8,
              metalness: 0.8,
              roughness: 0.25
            })
          );

        satellite.position.x =
          4.7;

        satelliteOrbit.add(
          satellite
        );

        satelliteOrbit.userData.speed =
          2.0;

        addInteractive(
          satellite,
          "ARTIFICIAL SATELLITE",
          "A small conceptual spacecraft orbiting Earth.",
          "Artificial satellites are used for communication, navigation, observation and science.",
          "SPACECRAFT"
        );
      }
    }
  );

  /* ASTEROID BELT */

  const asteroidGroup =
    new THREE.Group();

  solarSystemGroup.add(
    asteroidGroup
  );

  for (
    let i = 0;
    i < 450;
    i++
  ) {

    const angle =
      Math.random() *
      Math.PI *
      2;

    const radius =
      35 +
      Math.random() *
      4;

    const y =
      (Math.random() - 0.5) *
      1.8;

    const asteroid =
      new THREE.Mesh(
        new THREE.IcosahedronGeometry(
          0.06 +
          Math.random() * 0.18,
          0
        ),
        new THREE.MeshStandardMaterial({
          color: 0x777777,
          roughness: 1
        })
      );

    asteroid.position.set(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius
    );

    asteroid.rotation.set(
      Math.random(),
      Math.random(),
      Math.random()
    );

    asteroidGroup.add(
      asteroid
    );
  }

  addInteractive(
    asteroidGroup,
    "ASTEROID BELT",
    "A dense conceptual belt of small rocky bodies between Mars and Jupiter.",
    "The actual asteroid belt contains millions of objects.",
    "REGION"
  );

  setSceneInfo(
    "SOLAR SYSTEM",
    "A compressed interactive model of our planetary neighborhood.",
    "OBSERVATORY"
  );

  resetCamera(
    [0, 45, 115],
    [0, 0, 0]
  );
}

/* =========================================================
   BLACK HOLE
   ========================================================= */

function createBlackHole() {

  clearWorld();

  blackHoleGroup =
    new THREE.Group();

  scene.add(
    blackHoleGroup
  );

  /* EVENT HORIZON */

  const horizon =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        10,
        64,
        64
      ),
      new THREE.MeshBasicMaterial({
        color: 0x000000
      })
    );

  blackHoleGroup.add(
    horizon
  );

  addInteractive(
    horizon,
    "EVENT HORIZON",
    "The boundary beyond which light cannot escape according to classical general relativity.",
    "The event horizon is not a physical surface you could stand on.",
    "BLACK HOLE"
  );

  /* GLOWING DISK */

  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const inner =
      12 +
      i * 1.8;

    const outer =
      inner + 3.5;

    const disk =
      new THREE.Mesh(
        new THREE.RingGeometry(
          inner,
          outer,
          128
        ),
        new THREE.MeshBasicMaterial({
          color:
            i < 3
              ? 0xffd36b
              : 0xff5d2a,
          transparent: true,
          opacity:
            0.38 -
            i * 0.035,
          side:
            THREE.DoubleSide
        })
      );

    disk.rotation.x =
      Math.PI / 2;

    disk.rotation.z =
      i * 0.08;

    blackHoleGroup.add(
      disk
    );
  }

  /* PARTICLE DISK */

  const particleCount =
    qualityMode === "low"
      ? 700
      : 1800;

  const positions =
    new Float32Array(
      particleCount * 3
    );

  for (
    let i = 0;
    i < particleCount;
    i++
  ) {

    const radius =
      13 +
      Math.random() * 25;

    const angle =
      Math.random() *
      Math.PI *
      2;

    positions[i * 3] =
      Math.cos(angle) *
      radius;

    positions[i * 3 + 1] =
      (Math.random() - 0.5) *
      1.2;

    positions[i * 3 + 2] =
      Math.sin(angle) *
      radius;
  }

  const geometry =
    new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      positions,
      3
    )
  );

  const material =
    new THREE.PointsMaterial({
      color: 0xff9d54,
      size: 0.12,
      transparent: true,
      opacity: 0.85
    });

  const particles =
    new THREE.Points(
      geometry,
      material
    );

  blackHoleGroup.add(
    particles
  );

  activeSceneObjects.push(
    blackHoleGroup
  );

  setSceneInfo(
    "BLACK HOLE",
    "A visual model of an extreme gravitational environment.",
    "GRAVITY WELL"
  );

  resetCamera(
    [0, 35, 70],
    [0, 0, 0]
  );
}

/* =========================================================
   DNA
   ========================================================= */

function createDNA() {

  clearWorld();

  dnaGroup =
    new THREE.Group();

  scene.add(
    dnaGroup
  );

  const radius = 7;
  const height = 42;
  const turns = 4;

  const steps = 220;

  for (
    let i = 0;
    i < steps;
    i++
  ) {

    const t =
      i / (steps - 1);

    const y =
      -height / 2 +
      t * height;

    const angle =
      t *
      Math.PI *
      2 *
      turns;

    const x1 =
      Math.cos(angle) *
      radius;

    const z1 =
      Math.sin(angle) *
      radius;

    const x2 =
      Math.cos(angle + Math.PI) *
      radius;

    const z2 =
      Math.sin(angle + Math.PI) *
      radius;

    const sphere1 =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.32,
          16,
          16
        ),
        glowMaterial(
          0x66aaff,
          0.7
        )
      );

    sphere1.position.set(
      x1,
      y,
      z1
    );

    dnaGroup.add(
      sphere1
    );

    const sphere2 =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.32,
          16,
          16
        ),
        glowMaterial(
          0xff6688,
          0.7
        )
      );

    sphere2.position.set(
      x2,
      y,
      z2
    );

    dnaGroup.add(
      sphere2
    );

    if (
      i % 8 === 0
    ) {

      const points = [
        new THREE.Vector3(
          x1,
          y,
          z1
        ),
        new THREE.Vector3(
          x2,
          y,
          z2
        )
      ];

      const geometry =
        new THREE.BufferGeometry()
          .setFromPoints(
            points
          );

      const material =
        new THREE.LineBasicMaterial({
          color: 0xb7c5ff,
          transparent: true,
          opacity: 0.65
        });

      const rung =
        new THREE.Line(
          geometry,
          material
        );

      dnaGroup.add(
        rung
      );
    }
  }

  addInteractive(
    dnaGroup,
    "DNA DOUBLE HELIX",
    "A conceptual 3D visualization of the molecular structure carrying biological information.",
    "DNA stores genetic information using sequences of four nucleotide bases.",
    "LIFE"
  );

  setSceneInfo(
    "DNA / LIFE",
    "A 3D molecular-inspired journey through biological information.",
    "LIFE ENGINE"
  );

  resetCamera(
    [0, 5, 72],
    [0, 0, 0]
  );
}

/* =========================================================
   QUANTUM CORE
   ========================================================= */

function createQuantum() {

  clearWorld();

  quantumGroup =
    new THREE.Group();

  scene.add(
    quantumGroup
  );

  const core =
    new THREE.Mesh(
      new THREE.IcosahedronGeometry(
        7,
        3
      ),
      new THREE.MeshStandardMaterial({
        color: 0x6f7cff,
        emissive: 0x3b4fff,
        emissiveIntensity: 1.7,
        transparent: true,
        opacity: 0.65,
        wireframe: true
      })
    );

  quantumGroup.add(
    core
  );

  addInteractive(
    core,
    "QUANTUM CORE",
    "A conceptual visualization inspired by quantum-state uncertainty and probability.",
    "Quantum systems can exhibit behavior that differs radically from everyday classical intuition.",
    "QUANTUM"
  );

  for (
    let ring = 0;
    ring < 6;
    ring++
  ) {

    const radius =
      10 +
      ring * 3.5;

    const geometry =
      new THREE.TorusGeometry(
        radius,
        0.08,
        8,
        160
      );

    const material =
      new THREE.MeshBasicMaterial({
        color:
          ring % 2
            ? 0xff6be8
            : 0x69c8ff,
        transparent: true,
        opacity: 0.65
      });

    const torus =
      new THREE.Mesh(
        geometry,
        material
      );

    torus.rotation.x =
      Math.random() * Math.PI;

    torus.rotation.y =
      Math.random() * Math.PI;

    quantumGroup.add(
      torus
    );
  }

  const particles = [];

  for (
    let i = 0;
    i < 350;
    i++
  ) {

    const p =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.11,
          8,
          8
        ),
        new THREE.MeshBasicMaterial({
          color:
            i % 2
              ? 0x6fd7ff
              : 0xff6be8
        })
      );

    const radius =
      12 +
      Math.random() * 25;

    const angle =
      Math.random() *
      Math.PI *
      2;

    p.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 20,
      Math.sin(angle) * radius
    );

    quantumGroup.add(
      p
    );

    particles.push(p);
  }

  activeSceneObjects.push(
    quantumGroup
  );

  setSceneInfo(
    "QUANTUM LAB",
    "A visual playground for concepts such as superposition, probability and entanglement.",
    "QUANTUM"
  );

  resetCamera(
    [0, 20, 70],
    [0, 0, 0]
  );
}

/* =========================================================
   AI CORE
   ========================================================= */

function createAI() {

  clearWorld();

  aiGroup =
    new THREE.Group();

  scene.add(
    aiGroup
  );

  const layers = [
    5,
    8,
    10,
    8,
    5
  ];

  const nodes = [];

  layers.forEach(
    (count, layerIndex) => {

      const layer =
        [];

      for (
        let i = 0;
        i < count;
        i++
      ) {

        const node =
          new THREE.Mesh(
            new THREE.SphereGeometry(
              0.65,
              24,
              24
            ),
            glowMaterial(
              layerIndex % 2
                ? 0xff6be8
                : 0x6fbaff,
              1.2
            )
          );

        const y =
          (i -
            (count - 1) / 2) *
          4;

        const x =
          (layerIndex -
            (layers.length - 1) / 2) *
          13;

        node.position.set(
          x,
          y,
          0
        );

        aiGroup.add(
          node
        );

        layer.push(node);
      }

      nodes.push(layer);
    }
  );

  for (
    let l = 0;
    l < nodes.length - 1;
    l++
  ) {

    nodes[l].forEach(
      a => {

        nodes[l + 1].forEach(
          b => {

            const geometry =
              new THREE.BufferGeometry()
                .setFromPoints([
                  a.position,
                  b.position
                ]);

            const material =
              new THREE.LineBasicMaterial({
                color: 0x4b75b8,
                transparent: true,
                opacity: 0.22
              });

            const line =
              new THREE.Line(
                geometry,
                material
              );

            aiGroup.add(
              line
            );
          }
        );
      }
    );
  }

  addInteractive(
    aiGroup,
    "AI NEURAL CORE",
    "A stylized network showing how connected computational units can be organized into layers.",
    "Modern neural networks are mathematical models inspired loosely by biological neurons.",
    "ARTIFICIAL INTELLIGENCE"
  );

  setSceneInfo(
    "AI CORE",
    "A 3D visualization inspired by neural networks and machine learning.",
    "INTELLIGENCE"
  );

  resetCamera(
    [0, 12, 75],
    [0, 0, 0]
  );
}

/* =========================================================
   VIEW SWITCHING
   ========================================================= */

function showView(
  view
) {

  currentView = view;

  homeOverlay.classList.toggle(
    "hidden",
    view !== "home"
  );

  document
    .querySelectorAll(
      "#nav button"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.view === view
        );
      }
    );

  if (
    view === "home"
  ) {

    clearWorld();

    setSceneInfo(
      "THE UNKNOWN",
      "A living 3D map of ideas we can observe, model and still fail to fully explain.",
      "OBSERVATORY"
    );

    resetCamera(
      [0, 32, 75],
      [0, 0, 0]
    );

  } else if (
    view === "solar"
  ) {

    createSolarSystem();

  } else if (
    view === "blackhole"
  ) {

    createBlackHole();

  } else if (
    view === "dna"
  ) {

    createDNA();

  } else if (
    view === "quantum"
  ) {

    createQuantum();

  } else if (
    view === "ai"
  ) {

    createAI();
  }

  updateObjectCount();
}

/* =========================================================
   NAVIGATION
   ========================================================= */

document
  .querySelectorAll(
    "[data-view]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          showView(
            button.dataset.view
          );
        }
      );
    }
  );

/* =========================================================
   AUTO ORBIT
   ========================================================= */

if (autoBtn) {

  autoBtn.addEventListener(
    "click",
    () => {

      autoOrbit =
        !autoOrbit;

      controls.autoRotate =
        autoOrbit;

      controls.autoRotateSpeed =
        0.7;

      const bold =
        autoBtn.querySelector(
          "b"
        );

      if (bold) {
        bold.textContent =
          autoOrbit
            ? "ON"
            : "OFF";
      }
    }
  );
}

/* =========================================================
   RESET
   ========================================================= */

if (resetBtn) {

  resetBtn.addEventListener(
    "click",
    () => {

      if (
        currentView === "solar"
      ) {

        resetCamera(
          [0, 45, 115],
          [0, 0, 0]
        );

      } else {

        resetCamera(
          [0, 32, 75],
          [0, 0, 0]
        );
      }
    }
  );
}

/* =========================================================
   QUALITY
   ========================================================= */

if (qualityBtn) {

  qualityBtn.addEventListener(
    "click",
    () => {

      if (
        qualityMode === "auto"
      ) {

        qualityMode = "high";

      } else if (
        qualityMode === "high"
      ) {

        qualityMode = "low";

      } else {

        qualityMode = "auto";
      }

      const bold =
        qualityBtn.querySelector(
          "b"
        );

      if (bold) {
        bold.textContent =
          qualityMode.toUpperCase();
      }

      renderer.setPixelRatio(
        qualityMode === "low"
          ? 1
          : Math.min(
              window.devicePixelRatio || 1,
              qualityMode === "high"
                ? 2
                : 1.5
            )
      );
    }
  );
}

/* =========================================================
   INSPECT OBJECT
   ========================================================= */

const raycaster =
  new THREE.Raycaster();

const pointer =
  new THREE.Vector2();

function inspectObject(
  object
) {

  if (
    !object ||
    !object.userData ||
    !object.userData.info
  ) {
    return;
  }

  const info =
    object.userData.info;

  inspectTag.textContent =
    info.tag;

  inspectName.textContent =
    info.name;

  inspectText.textContent =
    info.text;

  inspectFact.textContent =
    info.fact;

  inspect.classList.remove(
    "hidden"
  );
}

function pointerFromEvent(
  event
) {

  const rect =
    renderer.domElement.getBoundingClientRect();

  pointer.x =
    ((event.clientX - rect.left) /
      rect.width) *
      2 -
    1;

  pointer.y =
    -(
      (event.clientY - rect.top) /
      rect.height
    ) *
      2 +
    1;
}

renderer.domElement.addEventListener(
  "pointerdown",
  event => {

    pointerFromEvent(
      event
    );

    raycaster.setFromCamera(
      pointer,
      camera
    );

    const hits =
      raycaster.intersectObjects(
        interactiveObjects,
        true
      );

    if (
      hits.length
    ) {

      let object =
        hits[0].object;

      while (
        object &&
        !object.userData.info
      ) {

        object =
          object.parent;
      }

      if (
        object
      ) {
        inspectObject(
          object
        );
      }
    }
  }
);

/* =========================================================
   CLOSE INSPECT
   ========================================================= */

if (closeInspectBtn) {

  closeInspectBtn.addEventListener(
    "click",
    () => {

      inspect.classList.add(
        "hidden"
      );
    }
  );
}

/* =========================================================
   ANIMATION
   ========================================================= */

function animateSolar() {

  if (
    !solarSystemGroup
  ) {
    return;
  }

  solarSystemGroup.rotation.y +=
    0.0008;

  solarSystemGroup.traverse(
    object => {

      if (
        object.isMesh &&
        object.geometry &&
        object.geometry.type ===
          "SphereGeometry"
      ) {

        object.rotation.y +=
          0.003;
      }

      if (
        object.userData &&
        object.userData.orbit
      ) {

        const orbit =
          object.userData.orbit;

        orbit.userData.angle +=
          orbit.userData.speed *
          0.0007;

        object.position.x =
          Math.cos(
            orbit.userData.angle
          ) *
          orbit.userData.distance;

        object.position.z =
          Math.sin(
            orbit.userData.angle
          ) *
          orbit.userData.distance;
      }
    }
  );

  /* MOON + SATELLITE */

  solarSystemGroup.traverse(
    object => {

      if (
        object.userData &&
        object.userData.speed &&
        object.parent
      ) {

        object.rotation.y +=
          object.userData.speed *
          0.01;
      }
    }
  );
}

function animateBlackHole() {

  if (
    !blackHoleGroup
  ) {
    return;
  }

  blackHoleGroup.rotation.y +=
    0.0015;

  blackHoleGroup.rotation.z =
    Math.sin(
      elapsed * 0.15
    ) *
    0.03;
}

function animateDNA() {

  if (
    !dnaGroup
  ) {
    return;
  }

  dnaGroup.rotation.y +=
    0.006;

  dnaGroup.position.y =
    Math.sin(
      elapsed * 0.8
    ) *
    0.8;
}

function animateQuantum() {

  if (
    !quantumGroup
  ) {
    return;
  }

  quantumGroup.rotation.y +=
    0.004;

  quantumGroup.rotation.x =
    Math.sin(
      elapsed * 0.4
    ) *
    0.18;
}

function animateAI() {

  if (
    !aiGroup
  ) {
    return;
  }

  aiGroup.rotation.y =
    Math.sin(
      elapsed * 0.3
    ) *
    0.12;

  aiGroup.position.y =
    Math.sin(
      elapsed * 0.8
    ) *
    0.8;
}

/* =========================================================
   MAIN LOOP
   ========================================================= */

function animate() {

  requestAnimationFrame(
    animate
  );

  const delta =
    clock.getDelta();

  elapsed += delta;

  if (
    starfield
  ) {

    starfield.rotation.y +=
      delta * 0.003;

    starfield.rotation.x +=
      delta * 0.0005;
  }

  animateSolar();
  animateBlackHole();
  animateDNA();
  animateQuantum();
  animateAI();

  controls.update();

  if (
    composer
  ) {

    composer.render();

  } else {

    renderer.render(
      scene,
      camera
    );
  }

  /* FPS */

  frames++;

  const now =
    performance.now();

  if (
    now -
      lastFPSUpdate >
    1000
  ) {

    const fps =
      Math.round(
        frames *
          1000 /
          (now -
            lastFPSUpdate)
      );

    if (fpsEl) {
      fpsEl.textContent =
        `${fps} FPS`;
    }

    frames = 0;

    lastFPSUpdate =
      now;
  }
}

animate();

/* =========================================================
   RESIZE
   ========================================================= */

window.addEventListener(
  "resize",
  () => {

    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    if (
      composer
    ) {

      composer.setSize(
        window.innerWidth,
        window.innerHeight
      );
    }
  }
);

/* =========================================================
   BOOT
   ========================================================= */

function finishBoot() {

  setTimeout(
    () => {

      boot.classList.add(
        "hidden"
      );

      hud.classList.add(
        "ready"
      );

      showView(
        "home"
      );

    },
    1600
  );
}

finishBoot();

console.log(
  "%c THE UNKNOWN // 3D OBSERVATORY ",
  "color:#8ea7ff;font-size:16px;font-weight:bold;"
);

console.log(
  "Three.js engine initialized."
);
