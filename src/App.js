import {Vector3, Vector2, Mesh, Euler, WebGLRenderer, Scene, PerspectiveCamera,
	BoxBufferGeometry, MeshNormalMaterial, SphereBufferGeometry, DirectionalLight,
	LightProbe, DoubleSide, MeshStandardMaterial, Matrix4} from "three";
import {XRManager} from "./utils/XRManager.js";
import {GUIUtils} from "./utils/GUIUtils.js";
import {Cursor} from "./object/Cursor.js";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {AugmentedCanvasMaterial} from "./material/AugmentedCanvasMaterial.js";
import {World, Sphere, NaiveBroadphase, SplitSolver, GSSolver, Body, Plane, Vec3, Quaternion} from "cannon";
import {PhysicsObject} from "./object/PhysicsObject.js";
import {DepthCanvasTexture} from "./texture/DepthCanvasTexture.js";
import {Measurement} from "./object/Measurement.js";
import {DepthDataTexture} from "./texture/DepthDataTexture.js";
import {AugmentedMaterial} from "./material/AugmentedMaterial.js";

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
var debugDepth = true;

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

export class App
{
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
			uUvTransform: {value: new Matrix4()}
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

			// Normalize x, y to range [0, 1]
			float x = gl_FragCoord.x / uWidth;
			float y = gl_FragCoord.y / uHeight;
			vec2 depthUV = (uUvTransform * vec4(vec2(x, y), 0, 1)).xy;

			float depth = getDepthInMillimeters(uDepthTexture, depthUV) / 1000.0;
			if (depth < vDepth) {
				discard;
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

	loadGLTFMesh(url, scene, position, rotation, scale) {

		const loader = new GLTFLoader();
		loader.load(url, (gltf) =>
		{
			gltf.scene.traverse((child) =>
			{
				if (child instanceof Mesh)
				{
					child.material = this.createAugmentedMaterial(child.material, depthDataTexture);
					/*new MeshStandardMaterial({
						alphaTest: 0.3,
						side: DoubleSide,
						map: child.material.map
					}), depthDataTexture);*/
					// child.material = new AugmentedMaterial(child.material.map, depthDataTexture);
					// child.material = new AugmentedCanvasMaterial(child.material.map, depthTexture);

				}
			});

			console.log(gltf);

			var object = gltf.scene.children[0];
			object.scale.set(scale, scale, scale);
			object.position.copy(position);
			object.rotation.copy(rotation);
			scene.add(object);
		});
	}

	initialize()
	{
		this.createWorld();

		resolution.set(window.innerWidth, window.innerHeight);

		var container = document.createElement("div");
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

		container.appendChild(GUIUtils.createButton("./assets/icon/911.svg", () =>
		{
			if (cursor.visible)
			{
				var position = new Vector3();
				position.setFromMatrixPosition(cursor.matrix);
				this.loadGLTFMesh("./assets/3d/car/scene.gltf", scene, position, new Euler(-Math.PI / 2, 0, 0), 0.01);
			}
		}));


		container.appendChild(GUIUtils.createButton("./assets/icon/tree.svg", () =>
		{
			if (cursor.visible)
			{
				var position = new Vector3();
				position.setFromMatrixPosition(cursor.matrix);
				this.loadGLTFMesh("./assets/3d/tree/scene.gltf", scene, position, new Euler(0, 0, 0), 0.002);
			}
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/flower.svg",  () =>
		{
			if (cursor.visible)
			{
				var position = new Vector3();
				position.setFromMatrixPosition(cursor.matrix);
				this.loadGLTFMesh("./assets/3d/flower/scene.gltf", scene, position, new Euler(-Math.PI / 2, 0, 0), 0.007);
			}
		}));

		container.appendChild(GUIUtils.createButton("./assets/icon/3d.svg", function()
		{
			debugDepth = !debugDepth;
			depthCanvas.style.display = debugDepth ? "block" : "none";
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

		depthCanvas = document.createElement("canvas");
		depthCanvas.style.position = "absolute";
		depthCanvas.style.right = "10px";
		depthCanvas.style.bottom = "10px";
		depthCanvas.style.borderRadius = "20px";
		container.appendChild(depthCanvas);

		depthTexture = new DepthCanvasTexture(depthCanvas);

		depthDataTexture = new DepthDataTexture();

		var button = document.createElement("div");
		button.style.position = "absolute";
		button.style.backgroundColor = "#FF6666";
		button.style.width = "100%";
		button.style.height = "20%";
		button.style.borderRadius = "20px";
		button.style.textAlign = "center";
		button.style.fontFamily = "Arial";
		button.style.fontSize = "50px";
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

		var box = new Mesh(new BoxBufferGeometry(), new MeshNormalMaterial());
		box.scale.set(0.1, 0.1, 0.1);
		box.position.x = 2;
		scene.add(box);

		var sphere = new Mesh(new SphereBufferGeometry(), new MeshNormalMaterial());
		sphere.scale.set(0.1, 0.1, 0.1);
		sphere.position.z = 2;
		scene.add(sphere);

		// Cursor to select objects
		cursor = new Cursor();
		scene.add(cursor);

		window.addEventListener("resize", () => {this.resize();}, false);

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
	updateUniforms(normTextureFromNormViewMatrix)
	{
		scene.traverse(function(child)
		{
			if(child.isMesh && child.material)
			{
				if(child.material instanceof AugmentedMaterial)
				{
					child.material.uniforms.uWidth.value = Math.floor(window.devicePixelRatio * window.innerWidth);
					child.material.uniforms.uHeight.value = Math.floor(window.devicePixelRatio * window.innerHeight);
					child.material.uniforms.uUvTransform.value.fromArray(normTextureFromNormViewMatrix);
					child.material.uniformsNeedUpdate = true;
				}
				else if(child.material instanceof AugmentedCanvasMaterial)
				{
					child.material.uniforms.uWidth.value = Math.floor(window.devicePixelRatio * window.innerWidth);
					child.material.uniforms.uHeight.value = Math.floor(window.devicePixelRatio * window.innerHeight);
					child.material.uniforms.uNear.value = camera.near;
					child.material.uniforms.uFar.value = camera.far;
					child.material.uniformsNeedUpdate = true;
				}
				else if(child.material.isAgumentedMaterial)
				{
					child.material.userData.uWidth.value = Math.floor(window.devicePixelRatio * window.innerWidth);
					child.material.userData.uHeight.value = Math.floor(window.devicePixelRatio * window.innerHeight);
					child.material.userData.uUvTransform.value.fromArray(normTextureFromNormViewMatrix);
					child.material.uniformsNeedUpdate = true;
				}
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
				directionalLight.position.set(lightEstimate.primaryLightDirection.x, lightEstimate.primaryLightDirection.y, lightEstimate.primaryLightDirection.z);
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
					depthTexture.updateDepth(depthData, camera.near, camera.far);

					// Update normal matrix
					this.updateUniforms(depthData.normTextureFromNormView.matrix);
				}
			}
		}

		renderer.render(scene, camera);
	}
}
