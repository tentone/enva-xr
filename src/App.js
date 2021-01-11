import {Vector3, Vector2, Mesh, Euler, WebGLRenderer, Scene, PerspectiveCamera,
	MeshNormalMaterial, SphereBufferGeometry, DirectionalLight,
	LightProbe, MeshBasicMaterial, MeshDepthMaterial, Matrix4} from "three";
import {XRManager} from "./utils/XRManager.js";
import {GUIUtils} from "./utils/GUIUtils.js";
import {ObjectUtils} from "./utils/ObjectUtils.js";
import {Cursor} from "./object/Cursor.js";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {World, Sphere, NaiveBroadphase, SplitSolver, GSSolver, Body, Plane, Vec3, Quaternion} from "cannon";
import {PhysicsObject} from "./object/PhysicsObject.js";
import {DepthCanvasTexture} from "./texture/DepthCanvasTexture.js";
import {Measurement} from "./object/Measurement.js";
import {DepthDataTexture} from "./texture/DepthDataTexture.js";

var container = null;

/**
 * Light probe used to acess the lighting estimation for the scene.
 */
var xrLightProbe = null;

/**
 * Physics world used for interaction.
 */
var world = null;

/**
 * Phsyics floor plane should be set to the lowest plane intersection found.
 */
var floor = null;

/**
 * If true the depth data is shown.
 */
var debugDepth = false;

/**
 * XR Viewer pose object.
 */
var pose = null;

/**
 * Canvas to draw depth information for debug.
 */
var depthCanvas = null;

/**
 * Depth canvas texture with the calculated depth used to debug.
 */
var depthTexture = null;

/**
 * Depth data texture.
 */
var depthDataTexture = null;

/**
 * Camera used to view the scene.
 */
var camera = new PerspectiveCamera(60, 1, 0.1, 10);

/**
 * Scene to draw into the screen.
 */
var scene = new Scene();

var directionalLight = new DirectionalLight();
scene.add(directionalLight);

var lightProbe = new LightProbe();
scene.add(lightProbe);

/**
 * Time of the last frame.
 */
var lastTime = 0;

/**
 * WebGL renderer used to draw the scene.
 */
var renderer = null;

/**
 * WebXR hit test source, (null until requested).
 */
var xrHitTestSource = null;

/**
 * Indicates if a hit test source was requested.
 */
var hitTestSourceRequested = false;

/**
 * Cursor to hit test the scene.
 */
var cursor = null;

/**
 * Measurement being created currently.
 */
var measurement = null;

/**
 * Size of the rendererer.
 */
var resolution = new Vector2();

/**
 * WebGL 2.0 context used to render.
 */
var glContext = null;

/**
 * XRWebGLBinding object used get additional gl data.
 */
var xrGlBinding = null;

var NORMAL = 0;
var DEBUG_ZBUFFER = 1;
var DEBUG_AR_DEPTH = 2;
var DEBUG_NO_OCCLUSION = 3;
var DEBUG_CAMERA_IMAGE = 4;

var mode = NORMAL;

export class App
{
	nextMode()
	{
		mode++;

		if (mode === DEBUG_CAMERA_IMAGE)
		{
			mode = NORMAL;
		}

		if (mode === NORMAL) {
			scene.overrideMaterial = null;
			scene.traverse(function(child)
			{
				if(child.isMesh && child.material && child.material.isAgumentedMaterial)
				{
					child.material.userData.uOcclusionEnabled.value = true;
					child.material.uniformsNeedUpdate = true;
				}
			});
		}
		else if (mode === DEBUG_ZBUFFER)
		{
			scene.overrideMaterial = new MeshDepthMaterial();
		}
		else if (mode === DEBUG_AR_DEPTH)
		{
			scene.overrideMaterial = null;
			debugDepth = true;
			depthCanvas.style.width = "100%";
			depthCanvas.style.height = "100%";
			depthCanvas.style.right = "0px";
			depthCanvas.style.bottom = "0px";
			depthCanvas.style.borderRadius = "0px";
		}
		else if (mode === DEBUG_NO_OCCLUSION)
		{
			this.resetDepthCanvas();
			scene.overrideMaterial = null;
			scene.traverse(function(child)
			{
				if(child.isMesh && child.material && child.material.isAgumentedMaterial)
				{
					child.material.userData.uOcclusionEnabled.value = false;
					child.material.uniformsNeedUpdate = true;
				}
			});
		}
		else if (mode === DEBUG_CAMERA_IMAGE)
		{
			scene.overrideMaterial = new MeshBasicMaterial({transparent: true, opacity: 0.0});
		}
	}

	/**
	 * Create and setup webgl renderer object.
	 *
	 * @param {*} canvas
	 */
	createRenderer(canvas)
	{
		glContext = canvas.getContext("webgl2", {xrCompatible: true});

		renderer = new WebGLRenderer(
		{
			context: glContext,
			antialias: true,
			alpha: true,
			canvas: canvas,
			depth: true,
			powerPreference: "high-performance",
			precision: "highp"
		});

		renderer.shadowMap.enabled = false;

		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.xr.enabled = true;
	}

	/**
	 * Create physics world for collistion simulation.
	 */
	createWorld()
	{
		world = new World();
		world.gravity.set(0, -9.8, 0);
		world.defaultContactMaterial.contactEquationStiffness = 1e9;
		world.defaultContactMaterial.contactEquationRelaxation = 4;
		world.quatNormalizeSkip = 0;
		world.quatNormalizeFast = false;
		world.broadphase = new NaiveBroadphase();
		world.solver = new SplitSolver(new GSSolver());
		world.solver.tolerance = 0.01;
		world.solver.iterations = 7;

		floor = new Body();
		floor.type = Body.STATIC;
		floor.position.set(0, 0, 0);
		floor.velocity.set(0, 0, 0);
		floor.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), -Math.PI / 2)
		floor.addShape(new Plane());
		world.addBody(floor);
	}

	/**
	 * Create a augmented reality occlusion enabled material from a standard three.js material.
	 *
	 * Can be used to test multiple material models with the AR functionality.
	 *
	 * @param {*} colorMap
	 * @param {*} depthMap
	 */
	createAugmentedMaterial(material, depthMap) {
		material.userData = {
			uDepthTexture: {value: depthMap},
			uWidth: {value: 1.0},
			uHeight: {value: 1.0},
			uUvTransform: {value: new Matrix4()},
			uOcclusionEnabled: {value: true}
		};

		material.isAgumentedMaterial = true;

		material.onBeforeCompile = (shader) =>
		{
			// Pass uniforms from userData to the
			for (let i in material.userData)
			{
				shader.uniforms[i] = material.userData[i];
			}

			// Fragment variables
			shader.fragmentShader = `
			uniform sampler2D uDepthTexture;
			uniform float uWidth;
			uniform float uHeight;
			uniform mat4 uUvTransform;

			uniform bool uOcclusionEnabled;

			varying float vDepth;
			` + shader.fragmentShader;

			// Fragment depth logic
			shader.fragmentShader =  shader.fragmentShader.replace("void main",
			`float getDepthInMillimeters(in sampler2D depthText, in vec2 uv)
			{
				vec2 packedDepth = texture2D(depthText, uv).ra;
				return dot(packedDepth, vec2(255.0, 256.0 * 255.0));
			}

			void main`);


			shader.fragmentShader =  shader.fragmentShader.replace("#include <dithering_fragment>", `
			#include <dithering_fragment>

			if(uOcclusionEnabled)
			{
				// Normalize x, y to range [0, 1]
				float x = gl_FragCoord.x / uWidth;
				float y = gl_FragCoord.y / uHeight;
				vec2 depthUV = (uUvTransform * vec4(vec2(x, y), 0, 1)).xy;

				float depth = getDepthInMillimeters(uDepthTexture, depthUV) / 1000.0;
				if (depth < vDepth)
				{
					discard;
				}
			}
			`);

			// Vertex variables
			shader.vertexShader = `
			varying float vDepth;
			` + shader.vertexShader;

			// Vertex depth logic
			shader.vertexShader =  shader.vertexShader.replace("#include <fog_vertex>", `
			#include <fog_vertex>

			vDepth = gl_Position.z;
			`);
		}

		return material;
	}

	loadGLTFMesh(url, scene, rotation, scale) {
		if (cursor.visible)
		{
			var position = new Vector3();
			position.setFromMatrixPosition(cursor.matrix);

			const loader = new GLTFLoader();
			loader.loadAsync(url).then((gltf) =>
			{
				var object = gltf.scene;
				scene.add(object);

				object.traverse((child) =>
				{
					if (child instanceof Mesh)
					{
						child.material = this.createAugmentedMaterial(child.material, depthDataTexture);
					}
				});

				object.scale.set(scale, scale, scale);
				object.rotation.copy(rotation);
				object.updateMatrix();
				object.updateMatrixWorld(true);

				var box = ObjectUtils.calculateBoundingBox(object);
				var center = new Vector3();
				box.getCenter(center);

				var size = new Vector3();
				box.getSize(size);

				console.log(center, size);

				object.position.set(-center.x, -center.y / 2, -center.z);
				object.position.add(position);
			});
		}
	}

	resetDepthCanvas()
	{
		if(!depthCanvas)
		{
			depthCanvas = document.createElement("canvas");
			container.appendChild(depthCanvas);
			depthTexture = new DepthCanvasTexture(depthCanvas);
		}

		depthCanvas.style.position = "absolute";
		depthCanvas.style.right = "10px";
		depthCanvas.style.bottom = "10px";
		depthCanvas.style.borderRadius = "20px";
		depthCanvas.style.width = "180px";
		depthCanvas.style.height = "320px";
	}

	initialize()
	{
		this.createWorld();

		resolution.set(window.innerWidth, window.innerHeight);

		container = document.createElement("div");
		container.style.position = "absolute";
		container.style.top = "0px";
		container.style.left = "0px";
		container.style.width = "100%";
		container.style.height = "100%";
		document.body.appendChild(container);

		container.appendChild(GUIUtils.createButton("./assets/icon/ruler.svg", function()
		{
			if (cursor.visible)
			{
				if (measurement)
				{
					measurement = null;
				}
				else
				{
					var position = new Vector3();
					position.setFromMatrixPosition(cursor.matrix);
					measurement = new Measurement(position);
					scene.add(measurement);
				}
			}
		}));


		container.appendChild(GUIUtils.createButton("./assets/icon/shadow.svg", () =>
		{
			this.nextMode();
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/3d.svg", function()
		{
			debugDepth = !debugDepth;
			depthCanvas.style.display = debugDepth ? "block" : "none";
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/911.svg", () =>
		{
			this.loadGLTFMesh("./assets/3d/car/scene.gltf", scene, new Euler(0, 0, 0), 0.003);
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/bottle.svg", () =>
		{
			this.loadGLTFMesh("./assets/3d/gltf/WaterBottle.glb", scene, new Euler(0, 0, 0), 1.0);
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/tripod.svg", () =>
		{
			this.loadGLTFMesh("./assets/3d/gltf/AntiqueCamera.glb", scene, new Euler(0, 0, 0), 0.1);
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/dots.svg", () =>
		{
			this.loadGLTFMesh("./assets/3d/gltf/MetalRoughSpheresNoTextures.glb", scene, new Euler(0, 0, 0), 100.0);
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/fish.svg", () =>
		{
			this.loadGLTFMesh("./assets/3d/gltf/BarramundiFish.glb", scene, new Euler(0, 0, 0), 1.0);
		}));


		container.appendChild(GUIUtils.createButton("./assets/icon/flower.svg",  () =>
		{
			this.loadGLTFMesh("./assets/3d/flower/scene.gltf", scene, new Euler(0, 0, 0), 0.007);
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/cube.svg", function()
		{
			if(pose !== null)
			{
				var viewOrientation = pose.transform.orientation;
				var viewPosition = pose.transform.position;

				var orientation = new Quaternion(viewOrientation.x, viewOrientation.y, viewOrientation.z, viewOrientation.w);

				var direction = new Vector3(0.0, 0.0, -1.0);
				direction.applyQuaternion(orientation);
				direction.multiplyScalar(5.0);

				var position = new Vector3(viewPosition.x, viewPosition.y, viewPosition.z);

				var geometry = new SphereBufferGeometry(0.05, 24, 24);
				var material = new MeshNormalMaterial();
				var shape = new Sphere(0.05);

				var ball = new PhysicsObject(geometry, material, world);
				ball.position.copy(position);
				ball.body.velocity.set(direction.x, direction.y, direction.z);
				ball.addShape(shape);
				ball.initialize();
				scene.add(ball);
			}
		}));

		this.resetDepthCanvas();

		depthDataTexture = new DepthDataTexture();

		var button = document.createElement("div");
		button.style.position = "absolute";
		button.style.backgroundColor = "#FF6666";
		button.style.width = "100%";
		button.style.height = "100%";
		button.style.top = "0px";
		button.style.left = "0px";
		button.style.textAlign = "center";
		button.style.fontFamily = "Arial";
		button.style.fontSize = "10vh";
		button.innerText = "Enter AR";
		button.onclick = function()
		{
			XRManager.start(renderer,
			{
				optionalFeatures: ["dom-overlay"],
				domOverlay: {root: container},
				requiredFeatures: ["hit-test", "depth-sensing", "light-estimation"]
			});
		};
		document.body.appendChild(button);

		var canvas = document.createElement("canvas");
		document.body.appendChild(canvas);
		this.createRenderer(canvas);

		// Cursor to select objects
		cursor = new Cursor();
		scene.add(cursor);

		// Resize renderer
		window.addEventListener("resize", () => {this.resize();}, false);

		// Render loop
		renderer.setAnimationLoop((time, frame) => {
			this.render(time, frame);
		});
	}

	/**
	 * Resize the canvas and renderer size.
	 */
	resize()
	{
		resolution.set(window.innerWidth, window.innerHeight);

		camera.aspect = resolution.x / resolution.y;
		camera.updateProjectionMatrix();

		renderer.setSize(resolution.x, resolution.y);
		renderer.setPixelRatio(window.devicePixelRatio);
	}

	// Update uniforms of materials to match the screen size and camera configuration
	updateAugmentedMaterialUniforms(normTextureFromNormViewMatrix)
	{
		scene.traverse(function(child)
		{
			if(child.isMesh && child.material && child.material.isAgumentedMaterial)
			{
				child.material.userData.uWidth.value = Math.floor(window.devicePixelRatio * window.innerWidth);
				child.material.userData.uHeight.value = Math.floor(window.devicePixelRatio * window.innerHeight);
				child.material.userData.uUvTransform.value.fromArray(normTextureFromNormViewMatrix);
				child.material.uniformsNeedUpdate = true;
			}
		});
	}

	/**
	 * Update logic and render scene into the screen.
	 *
	 * @param {*} time
	 * @param {*} frame
	 */
	render(time, frame)
	{

		let delta = time - lastTime;
		lastTime = time;

		if (!frame)
		{
			return;
		}

		world.step(delta / 1e3);

		var referenceSpace = renderer.xr.getReferenceSpace();
		var session = renderer.xr.getSession();

		if (!xrGlBinding) {
			xrGlBinding = new XRWebGLBinding(session, glContext);
		}

		// Request hit test source
		if (!hitTestSourceRequested)
		{
			session.requestReferenceSpace("viewer").then(function(referenceSpace)
			{
				session.requestHitTestSource(
				{
					space: referenceSpace
				}).then(function(source)
				{
					xrHitTestSource = source;
				});
			});

			session.requestLightProbe().then((probe) =>
			{
				xrLightProbe = probe;

				// Get cube map for reflections
				/*xrLightProbe.addEventListener("reflectionchange", () => {
					// var glCubeMap = xrGlBinding.getReflectionCubeMap(xrLightProbe);
					// console.log(glCubeMap);
				});*/
			});

			session.addEventListener("end", function()
			{
				hitTestSourceRequested = false;
				xrHitTestSource = null;
			});

			hitTestSourceRequested = true;
		}


		// Process lighting condition from probe
		if (xrLightProbe)
		{
			let lightEstimate = frame.getLightEstimate(xrLightProbe);
			if (lightEstimate)
			{
				let intensity = Math.max(1.0, Math.max(lightEstimate.primaryLightIntensity.x, Math.max(lightEstimate.primaryLightIntensity.y, lightEstimate.primaryLightIntensity.z)));
				directionalLight.position.set(lightEstimate.primaryLightDirection.x * 10, lightEstimate.primaryLightDirection.y * 10, lightEstimate.primaryLightDirection.z * 10);
				directionalLight.color.setRGB(lightEstimate.primaryLightIntensity.x / intensity, lightEstimate.primaryLightIntensity.y / intensity, lightEstimate.primaryLightIntensity.z / intensity);
				directionalLight.intensity = intensity;

				lightProbe.sh.fromArray(lightEstimate.sphericalHarmonicsCoefficients);
			}
		}

		// Process Hit test
		if (xrHitTestSource)
		{
			var hitTestResults = frame.getHitTestResults(xrHitTestSource);
			if (hitTestResults.length)
			{
				var hit = hitTestResults[0];
				cursor.visible = true;
				cursor.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);

				// Update physics floor plane
				var position = new Vector3();
				position.setFromMatrixPosition(cursor.matrix);
				if (position.y < floor.position.y)
				{
					floor.position.y = position.y;
				}
			}
			else
			{
				cursor.visible = false;
			}

			if (measurement)
			{
				measurement.setPointFromMatrix(cursor.matrix);
			}
		}

		// Handle depth
		var viewerPose = frame.getViewerPose(referenceSpace);
		if (viewerPose)
		{
			pose = viewerPose;
			for(var view of pose.views)
			{
				var depthData = frame.getDepthInformation(view);
				if(depthData)
				{
					// Update textures
					depthDataTexture.updateDepth(depthData);

					// Draw canvas texture depth
					if (debugDepth) {
						depthTexture.updateDepth(depthData, camera.near, camera.far);
					}

					// Update normal matrix
					this.updateAugmentedMaterialUniforms(depthData.normTextureFromNormView.matrix);
				}
			}
		}

		renderer.render(scene, camera);
	}
}
