import {
	Vector3, Vector2, Mesh, WebGLRenderer, Scene, PerspectiveCamera,
	DirectionalLight, AmbientLightProbe,
	MeshBasicMaterial, MeshDepthMaterial, Matrix4, PlaneBufferGeometry,
	ShadowMaterial, BasicShadowMap, PCFShadowMap, PCFSoftShadowMap, VSMShadowMap
} from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {World, NaiveBroadphase, SplitSolver, GSSolver, Body, Plane, Vec3} from "cannon-es";
import {threeToCannon} from 'three-to-cannon';
import cannonDebugger from 'cannon-es-debugger';
import {XRManager} from "./utils/XRManager.js";
import {ObjectUtils} from "./utils/ObjectUtils.js";
import {Cursor} from "./object/Cursor.js";
import {DepthCanvasTexture} from "./texture/DepthCanvasTexture.js";
import {DepthDataTexture} from "./texture/DepthDataTexture.js";

/**
 * Render everything.
 */
var NORMAL = 0;

/**
 * Render Z Depth only.
 */
var DEBUG_ZBUFFER = 1;

/**
 * Render AR depth only.
 */
var DEBUG_AR_DEPTH = 2;

/**
 * No occlusion estimation.
 */
var DEBUG_NO_OCCLUSION = 3;

/**
 * Draw nothign just the AR base image.
 */
var DEBUG_CAMERA_IMAGE = 4;

export class App
{
	constructor()
	{
		/**
		 * GUI of the application.
		 */
		this.gui = null;

		/**
		 * Light probe used to acess the lighting estimation for the this.scene.
		 */
		this.xrLightProbe = null;

		/**
		 * Physics this.world used for interaction.
		 */
		this.world = null;

		/**
		 * Phsyics floor plane should be set to the lowest plane intersection found.
		 */
		this.floor = null;

		/**
		 * If true the depth data is shown.
		 */
		this.debugDepth = false;

		/**
		 * XR Viewer pose object.
		 */
		this.pose = null;

		/**
		 * Canvas to draw depth information for debug.
		 */
		this.depthCanvas = null;

		/**
		 * Depth canvas texture with the calculated depth used to debug.
		 */
		this.depthTexture = null;

		/**
		 * Depth data texture.
		 */
		this.depthDataTexture = null;

		/**
		 * Camera used to view the this.scene.
		 */
		this.camera = new PerspectiveCamera(60, 1, 0.1, 10);

		/**
		 * Scene to draw into the screen.
		 */
		this.scene = new Scene();

		/**
		 * Directional shadow casting light.
		 */
		this.directionalLight;

		/**
		 * Light probe object using spherical harmonics.
		 */
		this.lightProbe;

		/**
		 * Mesh used as floor.
		 */
		this.shadowMaterial;

		/**
		 * Mesh used to cast shadows into the floor.
		 */
		this.floorMesh;

		/**
		 * Time of the last frame.
		 */
		this.lastTime = 0;

		/**
		 * WebGL this.renderer used to draw the this.scene.
		 */
		this.renderer = null;

		/**
		 * WebXR hit test source, (null until requested).
		 */
		this.xrHitTestSource = null;

		/**
		 * Indicates if a hit test source was requested.
		 */
		this.hitTestSourceRequested = false;

		/**
		 * Cursor to hit test the this.scene.
		 */
		this.cursor = null;

		/**
		 * Measurement being created currently.
		 */
		this.measurement = null;

		/**
		 * Size of the this.rendererer.
		 */
		this.resolution = new Vector2();

		/**
		 * WebGL 2.0 context used to render.
		 */
		this.glContext = null;

		/**
		 * XRWebGLBinding object used get additional gl data.
		 */
		this.xrGlBinding = null;

		/**
		 * Rendering canvas.
		 */
		this.canvas = null;

		this.performanceCounterFull = [];
		this.performanceCounterRender = [];
		this.performanceCounterEnabled = false;
		this.performanceCounterSamples = 100;

		/**
		 * Rendering mode in use.
		 */
		this.mode = NORMAL;
	}

	createScene()
	{
		this.depthDataTexture = new DepthDataTexture();

		this.directionalLight = new DirectionalLight();
		this.directionalLight.castShadow = true;
		this.directionalLight.shadow.mapSize.set(1024, 1024);
		this.directionalLight.shadow.camera.far = 20;
		this.directionalLight.shadow.camera.near = 0.1;
		this.directionalLight.shadow.camera.left = -5;
		this.directionalLight.shadow.camera.right = 5;
		this.directionalLight.shadow.camera.bottom = -5;
		this.directionalLight.shadow.camera.top = 5;
		this.scene.add(this.directionalLight);

		this.lightProbe = new AmbientLightProbe();
		this.scene.add(this.lightProbe);

		this.shadowMaterial = new ShadowMaterial({opacity: 0.5});
		this.shadowMaterial = this.createAugmentedMaterial(this.shadowMaterial, this.depthDataTexture);

		this.floorMesh = new Mesh(new PlaneBufferGeometry(100, 100, 1, 1), this.shadowMaterial);
		this.floorMesh.rotation.set(-Math.PI / 2, 0, 0);
		this.floorMesh.castShadow = false;
		this.floorMesh.receiveShadow = true;
		this.scene.add(this.floorMesh);
	}

	nextShadowType()
	{
		if (!this.renderer.shadowMap.enabled)
		{
			this.renderer.shadowMap.enabled = true;
			this.renderer.shadowMap.type = BasicShadowMap;
		}
		else if (this.renderer.shadowMap.type === BasicShadowMap)
		{
			this.renderer.shadowMap.type = PCFShadowMap;
		}
		else if (this.renderer.shadowMap.type === PCFShadowMap)
		{
			this.renderer.shadowMap.type = PCFSoftShadowMap;
		}
		else if (this.renderer.shadowMap.type === PCFSoftShadowMap)
		{
			this.renderer.shadowMap.type = VSMShadowMap;
		}
		else if (this.renderer.shadowMap.type === VSMShadowMap)
		{
			this.renderer.shadowMap.enabled = false;
			this.renderer.shadowMap.type = BasicShadowMap;
		}

		this.renderer.shadowMap.needsUpdate = true;
		this.scene.traverse(function(child)
		{
			if (child.material)
			{
				child.material.needsUpdate = true;
			}
		});

		// console.log("Shadow type changed to " + this.renderer.shadowMap.type);
	}

	nextRenderMode()
	{
		this.mode++;

		if (this.mode === DEBUG_CAMERA_IMAGE)
		{
			this.mode = NORMAL;
		}

		if (this.mode === NORMAL)
		{
			this.scene.overrideMaterial = null;
			this.scene.traverse(function(child)
			{
				if (child.isMesh && child.material && child.material.isAgumentedMaterial)
				{
					child.material.userData.uOcclusionEnabled.value = true;
					child.material.uniformsNeedUpdate = true;
				}
			});
		}
		else if (this.mode === DEBUG_ZBUFFER)
		{
			this.scene.overrideMaterial = new MeshDepthMaterial();
		}
		else if (this.mode === DEBUG_AR_DEPTH)
		{
			this.scene.overrideMaterial = null;
			this.debugDepth = true;
			this.depthCanvas.style.width = "100%";
			this.depthCanvas.style.height = "100%";
			this.depthCanvas.style.right = "0px";
			this.depthCanvas.style.bottom = "0px";
			this.depthCanvas.style.borderRadius = "0px";
		}
		else if (this.mode === DEBUG_NO_OCCLUSION)
		{
			this.resetDepthCanvas();
			this.scene.overrideMaterial = null;
			this.scene.traverse(function(child)
			{
				if (child.isMesh && child.material && child.material.isAgumentedMaterial)
				{
					child.material.userData.uOcclusionEnabled.value = false;
					child.material.uniformsNeedUpdate = true;
				}
			});
		}
		else if (this.mode === DEBUG_CAMERA_IMAGE)
		{
			this.scene.overrideMaterial = new MeshBasicMaterial({transparent: true, opacity: 0.0});
		}
	}

	/**
	 * Create and setup webgl this.renderer object.
	 *
	 * @param {*} canvas
	 */
	createRenderer()
	{
		this.canvas = document.createElement("canvas");
		document.body.appendChild(this.canvas);

		this.glContext = this.canvas.getContext("webgl2", {xrCompatible: true});

		this.renderer = new WebGLRenderer(
			{
				context: this.glContext,
				antialias: true,
				alpha: true,
				canvas: this.canvas,
				depth: true,
				powerPreference: "high-performance",
				precision: "highp",
				preserveDrawingBuffer: false,
				premultipliedAlpha: true,
				logarithmicDepthBuffer: false,
				stencil: true
			});

		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = PCFSoftShadowMap;
		this.renderer.sortObjects = false;
		this.renderer.physicallyCorrectLights = true;

		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.xr.enabled = true;
	}

	forceContextLoss()
	{

		try
		{
			if (this.renderer !== null)
			{
				this.renderer.dispose();
				this.renderer.forceContextLoss();
				this.renderer = null;
			}
		}
		catch (e)
		{
			this.renderer = null;
			alert("Failed to destroy WebGL context.");
		}

		if (this.canvas !== null)
		{
			document.body.removeChild(this.canvas);
		}
	};


	/**
	 * Create physics this.world for collistion simulation.
	 */
	createWorld()
	{
		this.world = new World();
		this.world.gravity.set(0, -9.8, 0);
		this.world.defaultContactMaterial.contactEquationStiffness = 1e9;
		this.world.defaultContactMaterial.contactEquationRelaxation = 4;
		this.world.quatNormalizeSkip = 0;
		this.world.quatNormalizeFast = false;
		this.world.broadphase = new NaiveBroadphase();
		this.world.solver = new SplitSolver(new GSSolver());
		this.world.solver.tolerance = 0.01;
		this.world.solver.iterations = 7;

		this.floor = new Body();
		this.floor.type = Body.STATIC;
		this.floor.position.set(0, 0, 0);
		this.floor.velocity.set(0, 0, 0);
		this.floor.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), -Math.PI / 2);
		this.floor.addShape(new Plane());
		this.world.addBody(this.floor);
	}

	/**
	 * Enable the physics debugger.
	 *
	 * Cannot be disabled after its enabled.
	 */
	enablePhysicsDebugger()
	{
		cannonDebugger(this.scene, this.world.bodies, {
			color: 0x00ff00,
			autoUpdate: true
		});
	}

	/**
	 * Create a augmented reality occlusion enabled material from a standard three.js material.
	 *
	 * Can be used to test multiple material this.models with the AR functionality.
	 *
	 * @param {*} colorMap
	 * @param {*} depthMap
	 */
	createAugmentedMaterial(material, depthMap)
	{
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


			var fragmentEntryPoint = "#include <clipping_planes_fragment>";
			if (material instanceof ShadowMaterial)
			{
				fragmentEntryPoint = "#include <fog_fragment>";
			}

			// Fragment depth logic
			shader.fragmentShader = shader.fragmentShader.replace("void main",
				`float getDepthInMillimeters(in sampler2D depthText, in vec2 uv)
			{
				vec2 packedDepth = texture2D(depthText, uv).ra;
				return dot(packedDepth, vec2(255.0, 65280.0));
			}

			void main`);


			shader.fragmentShader = shader.fragmentShader.replace(fragmentEntryPoint, `
			${fragmentEntryPoint}

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
			shader.vertexShader = shader.vertexShader.replace("#include <fog_vertex>", `
			#include <fog_vertex>

			vDepth = gl_Position.z;
			`);
		};

		return material;
	}

	loadGLTFMesh(url, rotation, scale)
	{
		if (this.cursor.visible)
		{
			var position = new Vector3();
			position.setFromMatrixPosition(this.cursor.matrix);

			const loader = new GLTFLoader();
			loader.loadAsync(url).then((gltf) =>
			{
				var object = gltf.this.scene;
				this.scene.add(object);

				object.traverse((child) =>
				{
					if (child instanceof Mesh)
					{
						child.castShadow = true;
						child.receiveShadow = true;
						child.material = this.createAugmentedMaterial(child.material, this.depthDataTexture);
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

				object.position.set(-center.x, -center.y / 2, -center.z);
				object.position.add(position);
				object.updateMatrix();
				object.updateMatrixWorld(true);

				const shape = threeToCannon(object, {type: threeToCannon.Type.BOX});
				const body = new Body();
				body.type = Body.STATIC;
				body.position.set(object.position.x, object.position.y + size.y / 2, object.position.z);
				body.velocity.set(0, 0, 0);
				body.addShape(shape);
				this.world.addBody(body);
			});
		}
	}

	resetDepthCanvas()
	{
		if (!this.depthCanvas)
		{
			this.depthCanvas = document.createElement("canvas");
			this.gui.container.appendChild(this.depthCanvas);
			this.depthTexture = new DepthCanvasTexture(this.depthCanvas);
		}

		this.depthCanvas.style.position = "absolute";
		this.depthCanvas.style.right = "10px";
		this.depthCanvas.style.bottom = "10px";
		this.depthCanvas.style.borderRadius = "20px";
		this.depthCanvas.style.width = "180px";
		this.depthCanvas.style.height = "320px";
	}

	initialize()
	{
		this.createScene();
		this.createWorld();

		this.resolution.set(window.innerWidth, window.innerHeight);

		this.gui = new GUI(this);
		this.gui.create();

		this.resetDepthCanvas();

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
		button.onclick = () =>
		{
			XRManager.start(this.renderer,
				{
					optionalFeatures: ["dom-overlay"],
					domOverlay: {root: this.gui.container},
					requiredFeatures: ["depth-sensing", "hit-test", "light-estimation"]
				}, function(error)
				{
					alert("Error starting the AR session. " + error);
				});
		};
		document.body.appendChild(button);

		this.createRenderer();

		// Cursor to select objects
		this.cursor = new Cursor();
		this.scene.add(this.cursor);

		// Resize this.renderer
		window.addEventListener("resize", () => {this.resize();}, false);

		// Render loop
		this.renderer.setAnimationLoop((time, frame) =>
		{
			this.render(time, frame);
		});
	}

	/**
	 * Resize the canvas and this.renderer size.
	 */
	resize()
	{
		this.resolution.set(window.innerWidth, window.innerHeight);

		this.camera.aspect = this.resolution.x / this.resolution.y;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(this.resolution.x, this.resolution.y);
		this.renderer.setPixelRatio(window.devicePixelRatio);
	}

	// Update uniforms of materials to match the screen size and camera configuration
	updateAugmentedMaterialUniforms(normTextureFromNormViewMatrix)
	{
		this.scene.traverse(function(child)
		{
			if (child.isMesh && child.material && child.material.isAgumentedMaterial)
			{
				child.material.userData.uWidth.value = Math.floor(window.devicePixelRatio * window.innerWidth);
				child.material.userData.uHeight.value = Math.floor(window.devicePixelRatio * window.innerHeight);
				child.material.userData.uUvTransform.value.fromArray(normTextureFromNormViewMatrix);
				child.material.uniformsNeedUpdate = true;
			}
		});
	}

	/**
	 * Update logic and render this.scene into the screen.
	 *
	 * @param {*} time
	 * @param {*} frame
	 */
	render(time, frame)
	{
		let delta = time - this.lastTime;
		this.lastTime = time;

		if (!frame)
		{
			return;
		}

		// Update physics this.world
		this.world.step(delta / 1e3);

		var start = performance.now();

		var session = this.renderer.xr.getSession();
		var referenceSpace = this.renderer.xr.getReferenceSpace();

		// if (!this.xrGlBinding)
		// {
		// 	this.xrGlBinding = new XRWebGLBinding(session, this.glContext);
		// }

		// Request hit test source
		if (!this.hitTestSourceRequested)
		{
			session.requestReferenceSpace("viewer").then((referenceSpace) =>
			{
				session.requestHitTestSource(
					{space: referenceSpace}).then((source) =>
				{
					this.xrHitTestSource = source;
				});
			});

			session.requestLightProbe().then((probe) =>
			{
				this.xrLightProbe = probe;

				// Get cube map for reflections
				// this.xrLightProbe.addEventListener("reflectionchange", () => {
				// var glCubeMap = this.xrGlBinding.getReflectionCubeMap(this.xrLightProbe);
				// console.log(glCubeMap);
				// });
			});

			session.addEventListener("end", () =>
			{
				this.hitTestSourceRequested = false;
				this.xrHitTestSource = null;
			});

			this.hitTestSourceRequested = true;
		}


		// Process lighting condition from probe
		if (this.xrLightProbe)
		{
			let lightEstimate = frame.getLightEstimate(this.xrLightProbe);
			if (lightEstimate)
			{
				let directionalPosition = new Vector3(lightEstimate.primaryLightDirection.x, lightEstimate.primaryLightDirection.y, lightEstimate.primaryLightDirection.z);
				directionalPosition.multiplyScalar(5);

				let intensity = Math.max(1.0, Math.max(lightEstimate.primaryLightIntensity.x, Math.max(lightEstimate.primaryLightIntensity.y, lightEstimate.primaryLightIntensity.z)));
				this.directionalLight.position.copy(directionalPosition);
				this.directionalLight.color.setRGB(lightEstimate.primaryLightIntensity.x / intensity, lightEstimate.primaryLightIntensity.y / intensity, lightEstimate.primaryLightIntensity.z / intensity);
				this.directionalLight.intensity = intensity;

				this.lightProbe.sh.fromArray(lightEstimate.sphericalHarmonicsCoefficients);
			}
		}

		// Process Hit test
		if (this.xrHitTestSource)
		{
			var hitTestResults = frame.getHitTestResults(this.xrHitTestSource);
			if (hitTestResults.length)
			{
				var hit = hitTestResults[0];
				this.cursor.visible = true;
				this.cursor.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);

				// Update physics floor plane
				var position = new Vector3();
				position.setFromMatrixPosition(this.cursor.matrix);
				if (position.y < this.floor.position.y)
				{
					this.floor.position.y = position.y;
					this.floorMesh.position.y = position.y;
				}
			}
			else
			{
				this.cursor.visible = false;
			}

			if (this.measurement)
			{
				this.measurement.setPointFromMatrix(this.cursor.matrix);
			}
		}

		// Handle depth
		var viewerPose = frame.getViewerPose(referenceSpace);
		if (viewerPose)
		{
			pose = viewerPose;
			for (var view of pose.views)
			{
				var depthData = frame.getDepthInformation(view);
				if (depthData)
				{
					// Update textures
					this.depthDataTexture.updateDepth(depthData);

					// Draw canvas texture depth
					if (this.debugDepth)
					{
						this.depthTexture.updateDepth(depthData, this.camera.near, this.camera.far);
					}

					// Update normal matrix
					this.updateAugmentedMaterialUniforms(depthData.normTextureFromNormView.matrix);
				}
			}
		}

		this.renderer.render(this.scene, this.camera);

		var end = performance.now();
		if (this.performanceCounterEnabled)
		{
			this.performanceCounterFull.push(delta);
			this.performanceCounterRender.push(end - start);

			if (this.performanceCounterFull.length >= this.performanceCounterSamples)
			{

				this.performanceCounterEnabled = false;
				var avgFull = this.performanceCounterFull.reduce(function(a, b) {return a + b;}, 0) / this.performanceCounterFull.length;
				var avgRender = this.performanceCounterRender.reduce(function(a, b) {return a + b;}, 0) / this.performanceCounterRender.length;
				console.log(avgFull + ", " + avgRender + ", " + this.renderer.info.render.calls + ", " + this.renderer.info.render.triangles + ", " + this.renderer.info.memory.geometries + ", " + this.renderer.info.memory.textures);
			}
		}
	}
}

