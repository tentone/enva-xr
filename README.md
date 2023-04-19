# Enva-XR - Environment Aware Augmented Reality

- Web-based framework for environment-aware rendering and interaction in augmented reality based on [WebXR](https://www.w3.org/TR/webxr/) using [three.js](https://threejs.org/)
- The framework handles  geometry occlusions, matches the lighting of the environment, casts shadows, and provides physics interaction with real-world objects.
- Material from three.js can be reused the shader code required for AR occlusion is injected into the existing shaders using the `onBeforeCompile` callback.
- Capable of obtaining over 20 frames per second even on middle-range devices.
- [WebXR AR](https://immersive-web.github.io/webxr-ar-module/) features supported by the framework
  - [Lighting Estimation](https://immersive-web.github.io/lighting-estimation/)
  - [Depth Sensing Module](https://immersive-web.github.io/depth-sensing/)
  - [Hit Test](https://immersive-web.github.io/hit-test/)
  - [DOM Overlay](https://immersive-web.github.io/dom-overlays/)
  - [Anchors](https://immersive-web.github.io/anchors/)
  - [Plane Detection](https://immersive-web.github.io/real-world-geometry/plane-detection.html)

<img src="https://raw.githubusercontent.com/tentone/ar-occlusion/main/readme/screenshot/a.jpg" width="133"><img src="https://raw.githubusercontent.com/tentone/ar-occlusion/main/readme/screenshot/b.jpg" width="133"><img src="https://raw.githubusercontent.com/tentone/ar-occlusion/main/readme/screenshot/f.jpg" width="133"><img src="https://raw.githubusercontent.com/tentone/ar-occlusion/main/readme/screenshot/e.jpg" width="133"><img src="https://raw.githubusercontent.com/tentone/ar-occlusion/main/readme/screenshot/c.jpg" width="133"><img src="https://raw.githubusercontent.com/tentone/ar-occlusion/main/readme/screenshot/d.jpg" width="133">



## Getting Started

- Download the repository from git `gh repo clone tentone/enva-xr`
- Install [Node](https://nodejs.org/en/) and [NPM](https://www.npmjs.com/).
- Ensure that your browser is compatible with WebXR and check features support (e.g. `depth-estimation`, `hit-test`, `lighting`).
- Install dependencies from NPM by running `npm install` and start the code running `npm run start`


## Usage Example

 - Bellow is a simple usage example of the library the `ARRenderer` is responsible for most of the work required to setup the AR scene.
 - The `ARRenderer` receives a configuration object that indicates wich WebXR features should be enabled.
 - To enable AR rendering on existing `three.js` materials the `AugmentedMaterial.transform()` method should be used to transform regular materials into AR materials.
 - The example bellow demonstrates how to create a simple AR scene with occlusion and lighting enabled.
 - `LightProbe` object replicates the envornment lighting and position main light source position and direction. Internaly contains a three.js LightProbe and DirectionalLight with shadow casting enabled by default. 

``` typescript
const renderer = new ARRenderer({
  depthSensing: true,
  depthTexture: true,
  lightProbe: true
});

let material: any = new MeshPhysicalMaterial({color: (Math.random() * 0xFFFFFF)});
material = AugmentedMaterial.transform(material);

let box = new Mesh(new BoxGeometry(), material);
box.receiveShadow = true;
box.castShadow = true;
renderer.scene.add(box);

const probe = new LightProbe();
renderer.scene.add(probe);

const floor = new FloorPlane();
renderer.scene.add(floor);

renderer.onFrame = function(time: number, renderer: ARRenderer) {
  box.rotation.x += 0.01;
};

renderer.start();
```



## Rendering

- Depth data provided by WebXR can be used for occlusion in the 3D scene.
- Occlusion is calculated in the shader code injected using the `AugmentedMaterial.transform()` method.
- To enable realistic rendering of the scene the `MeshPhysicalMaterial` material should be used alonside PBR assets. 

<img src="https://raw.githubusercontent.com/tentone/ar-occlusion/main/readme/rendering.png" width="600">


## Physics

- [cannon.js](https://schteppe.github.io/cannon.js/) can be used for physics interaction between objects.
- The  `VoxelEnvironment` provides a probabilistic voxel based model that maps the environment from depth data that is updated every frame.
- Alternativelly physics can rely on plane detection using the `FloorPlane` or `Planes` objects.
- Currently performance is limited might be improved using [WebXR Real World Geometry](https://github.com/immersive-web/real-world-geometry) API

<img src="https://raw.githubusercontent.com/tentone/ar-occlusion/main/readme/physics.png" width="600">

## License

- The code from the project is MIT licensed. The license is available on the project repository,
