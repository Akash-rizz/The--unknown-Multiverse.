import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

import { OrbitControls } from
"https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js";

import { EffectComposer } from
"https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/postprocessing/EffectComposer.js";

import { RenderPass } from
"https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/postprocessing/RenderPass.js";

import { UnrealBloomPass } from
"https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/postprocessing/UnrealBloomPass.js";

import { OutputPass } from
"https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/postprocessing/OutputPass.js";


/* =========================================================
   THE UNKNOWN — 3D ULTIMATE
   Main Three.js Engine
   ========================================================= */


const $ = (selector) => document.querySelector(selector);


/* ---------------------------------------------------------
   SCENE
--------------------------------------------------------- */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x02030a);

scene.fog = new THREE.FogExp2(
    0x02030a,
    0.0011
);


/* ---------------------------------------------------------
   CAMERA
--------------------------------------------------------- */

const camera = new THREE.PerspectiveCamera(
    52,
    window.innerWidth / window.innerHeight,
    0.1,
    2500
);

camera.position.set(
    34,
    22,
    52
);


/* ---------------------------------------------------------
   RENDERER
--------------------------------------------------------- */

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});

renderer.setPixelRatio(
    Math.min(
        window.devicePixelRatio,
        window.innerWidth < 700 ? 1.25 : 1.8
    )
);

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.outputColorSpace =
    THREE.SRGBColorSpace;

renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 1.08;


/* Add canvas */

const sceneContainer = $("#scene");

if (sceneContainer) {
    sceneContainer.appendChild(
        renderer.domElement
    );
} else {
    document.body.appendChild(
        renderer.domElement
    );
}


/* ---------------------------------------------------------
   CAMERA CONTROLS
--------------------------------------------------------- */

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;

controls.dampingFactor = 0.055;

controls.minDistance = 8;

controls.maxDistance = 260;

controls.enablePan = true;

controls.enableZoom = true;

controls.enableRotate = true;

controls.target.set(
    0,
    0,
    0
);


/* ---------------------------------------------------------
   POST PROCESSING
--------------------------------------------------------- */

const composer = new EffectComposer(
    renderer
);

const renderPass = new RenderPass(
    scene,
    camera
);

composer.addPass(
    renderPass
);


const bloom = new UnrealBloomPass(
    new THREE.Vector2(
        window.innerWidth,
        window.innerHeight
    ),
    0.72,
    0.65,
    0.82
);

composer.addPass(
    bloom
);


composer.addPass(
    new OutputPass()
);


/* ---------------------------------------------------------
   LIGHTING
--------------------------------------------------------- */

const ambientLight =
    new THREE.AmbientLight(
        0x59627c,
        0.25
    );

scene.add(
    ambientLight
);


const sunLight =
    new THREE.PointLight(
        0xffd7a0,
        1600,
        900,
        2
    );

sunLight.position.set(
    0,
    0,
    0
);

scene.add(
    sunLight
);


/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function createMaterial(
    color,
    roughness = 0.75,
    metalness = 0.05,
    emissive = 0x000000,
    emissiveIntensity = 0
) {

    return new THREE.MeshStandardMaterial({

        color: color,

        roughness: roughness,

        metalness: metalness,

        emissive: emissive,

        emissiveIntensity:
            emissiveIntensity

    });
}


function createSphere(
    radius,
    color,
    roughness = 0.8
) {

    return new THREE.Mesh(

        new THREE.SphereGeometry(
            radius,
            32,
            20
        ),

        createMaterial(
            color,
            roughness
        )

    );
}


function createOrbit(
    radius,
    color = 0x30374b
) {

    const geometry =
        new THREE.RingGeometry(
            radius - 0.012,
            radius + 0.012,
            160
        );

    const material =
        new THREE.MeshBasicMaterial({

            color: color,

            transparent: true,

            opacity: 0.32,

            side: THREE.DoubleSide

        });


    const orbit =
        new THREE.Mesh(
            geometry,
            material
        );

    orbit.rotation.x =
        -Math.PI / 2;

    scene.add(
        orbit
    );

    return orbit;
}


/* =========================================================
   STAR FIELD
========================================================= */

function createStars() {

    const count =
        window.innerWidth < 700
            ? 4200
            : 9000;


    const positions =
        new Float32Array(
            count * 3
        );


    const colors =
        new Float32Array(
            count * 3
        );


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const radius =
            THREE.MathUtils.randFloat(
                130,
                1000
            );


        const angle =
            Math.random() *
            Math.PI *
            2;


        const u =
            Math.random() *
            2 -
            1;


        const s =
            Math.sqrt(
                1 - u * u
            );


        positions[i * 3] =
            radius *
            s *
            Math.cos(angle);


        positions[i * 3 + 1] =
            radius *
            u;


        positions[i * 3 + 2] =
            radius *
            s *
            Math.sin(angle);


        const color =
            new THREE.Color();


        color.setHSL(
            0.58 +
            Math.random() * 0.12,

            0.15,

            0.65 +
            Math.random() * 0.3
        );


        colors[i * 3] =
            color.r;

        colors[i * 3 + 1] =
            color.g;

        colors[i * 3 + 2] =
            color.b;

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


    geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(
            colors,
            3
        )
    );


    const material =
        new THREE.PointsMaterial({

            size:
                window.innerWidth < 700
                    ? 1.1
                    : 1.45,

            vertexColors: true,

            transparent: true,

            opacity: 0.9,

            sizeAttenuation: true

        });


    const stars =
        new THREE.Points(
            geometry,
            material
        );


    scene.add(
        stars
    );


    return stars;
}


const starField =
    createStars();


/* =========================================================
   CLICKABLE OBJECT SYSTEM
========================================================= */

const raycaster =
    new THREE.Raycaster();

const pointer =
    new THREE.Vector2();

const clickable = [];


/* =========================================================
   SUN
========================================================= */

function createSun() {

    const group =
        new THREE.Group();


    group.name =
        "SUN";


    const core =
        createSphere(
            5.1,
            0xffa52d,
            0.45
        );


    core.material.emissive.set(
        0xff7a16
    );

    core.material.emissiveIntensity =
        1.7;


    group.add(
        core
    );


    const glow =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                6.1,
                32,
                20
            ),

            new THREE.MeshBasicMaterial({

                color: 0xff8b20,

                transparent: true,

                opacity: 0.12,

                blending:
                    THREE.AdditiveBlending

            })

        );


    group.add(
        glow
    );


    scene.add(
        group
    );


    clickable.push({

        mesh: core,

        name: "SUN",

        tag: "STAR",

        text:
            "A G-type main-sequence star at the center of our planetary system.",

        fact:
            "The Sun contains about 99.8% of the Solar System's mass."

    });


    return group;
}


const sun =
    createSun();


/* =========================================================
   PLANETS
========================================================= */

const planetData = [

    [
        "MERCURY",
        0.75,
        9,
        0.57,
        0x9c9b96
    ],

    [
        "VENUS",
        1.05,
        13,
        0.43,
        0xd7a35a
    ],

    [
        "EARTH",
        1.18,
        17,
        0.34,
        0x4b8fd8
    ],

    [
        "MARS",
        0.92,
        21,
        0.28,
        0xb34c32
    ],

    [
        "JUPITER",
        2.55,
        28,
        0.19,
        0xc58f62
    ],

    [
       
