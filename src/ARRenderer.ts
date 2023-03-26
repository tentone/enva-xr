import {Vector2, WebGLRenderer, Scene, PerspectiveCamera, PCFSoftShadowMap, Object3D} from "three";
import {XRManager} from "./utils/XRManager";

/**
 * AR renderer is responsible for rendering the scene in AR environment.
 * 
 * The scene and internal WebGL renderer are managed by the AR renderer.
 * 
 * The renderer handles the render loop execution.
 */
export class ARRenderer
{
	/**
	 * Camera used to view the this.scene.
	 */
	public camera = new PerspectiveCamera(60, 1, 1e-1, 1e3);

	/**
	 * Scene to draw into the screen.
	 */
	public scene = new Scene();

	/**
	 * WebGL this.renderer used to draw the this.scene.
	 */
	public renderer = null;

	/**
	 * Size of the this.rendererer.
	 */
	public resolution = new Vector2();

	/**
	 * WebGL 2.0 context used to render.
	 */
	public glContext = null;

	/**
	 * Callback to update logic of the app before rendering.
	 */
	public beforeframe = null;

	/**
	 * Rendering canvas.
	 */
	public canvas = null;

	/**
	 * DOM container for GUI elements visible in AR mode.
	 */
	public domContainer = document.createElement("div");

	public constructor()
	{
		if (window.isSecureContext === false)
		{
			throw new Error("WebXR is not available trough HTTP.");
		}

		this.domContainer.style.position = "absolute";
		this.domContainer.style.top = "0px";
		this.domContainer.style.left = "0px";
		this.domContainer.style.width = "100%";
		this.domContainer.style.height = "100%";

		this.setupRenderer();
	}

	/**
	 * Initalize the AR app.
	 */
	public start(): void
	{
		this.resolution.set(window.innerWidth, window.innerHeight);
		document.body.appendChild(this.domContainer);

		// Resize this.renderer
		window.addEventListener("resize", () => {this.resize();}, false);

		XRManager.start(this.renderer,
			{
				optionalFeatures: ["dom-overlay"],
				domOverlay: {root: this.domContainer},
				requiredFeatures: ["depth-sensing", "hit-test", "light-estimation"],
				depthSensing: {
					usagePreference: ["cpu-optimized", "gpu-optimized"],
					dataFormatPreference: ["luminance-alpha", "float32"],
				},
			}, function()
			{
				alert("Error starting the AR session. ");
			});

		// Render loop
		this.renderer.setAnimationLoop((time, frame) =>
		{
			this.render(time, frame);
		});
	}

	/**
	 * Dispose renderer, should be called when the renderer is not longer necessary.
	 */
	public dispose(): void {
		this.forceContextLoss();
		this.renderer.setAnimationLoop(null);
	}

	/**
	 * Change the shadow map rendering method.
	 * 
	 * @param shadowType - Type of shadows to use.
	 */
	public setShadowType(shadowType: number): void
	{
		this.renderer.shadowMap.enabled === shadowType !== null;
		this.renderer.shadowMap.type = shadowType;
		this.renderer.shadowMap.needsUpdate = true;

		// Update materials
		this.scene.traverse(function(child: Object3D)
		{
			// @ts-ignore
			if (child.material)
			{
				// @ts-ignore
				child.material.needsUpdate = true;
			}
		});

		console.log("enva-xr: Shadow type changed to " + this.renderer.shadowMap.type);
	}

	/**
	 * Create and setup webglrenderer.
	 * 
	 * Creates a webgl2 renderer with XR compatibility enabled.
	 * 
	 * If the canvas
	 *
	 * @param canvas - Optional param with canvas to be used for rendering.
	 */
	public setupRenderer(canvas?: HTMLCanvasElement | OffscreenCanvas): void
	{
		if (canvas) {
			this.canvas = canvas;
		} else {
			this.canvas = document.createElement("canvas");
			document.body.appendChild(this.canvas);
		}

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

	/**
	 * Force the loss of webgl rendering context.
	 * 
	 * To ensure that all webgl resources are dealocatted and the context destroyed.
	 */
	public forceContextLoss(): void
	{
		try
		{
			if (this.renderer)
			{
				this.renderer.dispose();
				this.renderer.forceContextLoss();
				this.renderer = null;
			}
		}
		catch (e)
		{
			this.renderer = null;
			throw new Error("Failed to destroy WebGL context.");
		}

		// Remove canvas from DOM
		if (this.canvas)
		{
			this.canvas.parent.removeChild(this.canvas);
		}
	};


	/**
	 * Update the canvas and renderer size based on window size.
	 */
	public resize(): void
	{
		this.resolution.set(window.innerWidth, window.innerHeight);

		this.camera.aspect = this.resolution.x / this.resolution.y;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(this.resolution.x, this.resolution.y);
		this.renderer.setPixelRatio(window.devicePixelRatio);
	}


	/**
	 * Update logic and render this.scene into the screen.
	 *
	 * @param time - Time ellapsed since the beginning.
	 * @param frame - XR frame object.
	 */
	public render(time: number, frame: XRFrame): void
	{
		if (!frame)
		{
			return;
		}

		if(this.beforeframe) {
			this.beforeframe(time, this);
		}
		

		// Update physics this.world
		// let delta = time - this.lastTime;
		// this.lastTime = time;
		// this.world.step(delta / 1e3);

		// let session = this.renderer.xr.getSession();
		// let referenceSpace = this.renderer.xr.getReferenceSpace();

		// if (!this.xrGlBinding)
		// {
		// 	this.xrGlBinding = new XRWebGLBinding(session, this.glContext);
		// }

		// // Request hit test source
		// if (!this.hitTestSourceRequested)
		// {
		// 	session.requestReferenceSpace("viewer").then((referenceSpace) =>
		// 	{
		// 		session.requestHitTestSource({space: referenceSpace}).then((source) =>
		// 		{
		// 			this.xrHitTestSource = source;
		// 		});
		// 	});

		// 	// session.requestLightProbe().then((probe) =>
		// 	// {
		// 	// 	this.xrLightProbe = probe;

		// 	// 	// Get cube map for reflections
		// 	// 	/* this.xrLightProbe.addEventListener("reflectionchange", () => {
		// 	// 		let glCubeMap = this.xrGlBinding.getReflectionCubeMap(this.xrLightProbe);
		// 	// 		console.log(glCubeMap);
		// 	// 	}); */
		// 	// });

		// 	session.addEventListener("end", () =>
		// 	{
		// 		this.hitTestSourceRequested = false;
		// 		this.xrHitTestSource = null;
		// 	});

		// 	this.hitTestSourceRequested = true;
		// }


		// Process lighting condition from probe
		// if (this.xrLightProbe)
		// {
		// 	let lightEstimate = frame.getLightEstimate(this.xrLightProbe);
		// 	if (lightEstimate)
		// 	{
		// 		let directionalPosition = new Vector3(lightEstimate.primaryLightDirection.x, lightEstimate.primaryLightDirection.y, lightEstimate.primaryLightDirection.z);
		// 		directionalPosition.multiplyScalar(5);

		// 		let intensity = Math.max(1.0, Math.max(lightEstimate.primaryLightIntensity.x, Math.max(lightEstimate.primaryLightIntensity.y, lightEstimate.primaryLightIntensity.z)));
		// 		this.directionalLight.position.copy(directionalPosition);
		// 		this.directionalLight.color.setRGB(lightEstimate.primaryLightIntensity.x / intensity, lightEstimate.primaryLightIntensity.y / intensity, lightEstimate.primaryLightIntensity.z / intensity);
		// 		this.directionalLight.intensity = intensity;

		// 		this.lightProbe.sh.fromArray(lightEstimate.sphericalHarmonicsCoefficients);
		// 	}
		// }

		// // Process Hit test
		// if (this.xrHitTestSource)
		// {
		// 	let hitTestResults = frame.getHitTestResults(this.xrHitTestSource);
		// 	if (hitTestResults.length)
		// 	{
		// 		let hit = hitTestResults[0];
				
		// 		this.cursor.visible = true;
		// 		this.cursor.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);

		// 		// // Update physics floor plane
		// 		// let position = new Vector3();
		// 		// position.setFromMatrixPosition(this.cursor.matrix);
		// 		// if (position.y < this.floor.position.y)
		// 		// {
		// 		// 	this.floor.position.y = position.y;
		// 		// }

		// 		// // Shadow plane
		// 		// this.floorMesh.position.y = position.y;
		// 	}
		// 	else
		// 	{
		// 		this.cursor.visible = false;
		// 	}

		// 	if (this.measurement)
		// 	{
		// 		this.measurement.setPointFromMatrix(this.cursor.matrix);
		// 	}
		// }

		// Handle depth
		// let viewerPose = frame.getViewerPose(referenceSpace);
		// if (viewerPose)
		// {
		// 	this.pose = viewerPose;
		// 	for (let view of this.pose.views)
		// 	{
		// 		let depthInfo = frame.getDepthInformation(view);
		// 		if (depthInfo)
		// 		{
		// 			// Voxel environment
		// 			// this.voxelEnvironment.update(this.camera, depthData);

		// 			// Update textures
		// 			this.depthDataTexture.updateDepth(depthInfo);

		// 			// Draw canvas texture depth
		// 			if (this.debugDepth)
		// 			{
		// 				this.depthTexture.updateDepth(depthInfo, this.camera.near, this.camera.far);
		// 			}

		// 			// Update normal matrix
		// 			AugmentedMaterial.updateUniforms(this.scene, depthInfo);
		// 		}
		// 	}
		// }

		this.renderer.render(this.scene, this.camera);

		// this.timeMeterFrame.tock();

		// if (this.timeMeter.finished() && this.timeMeterFrame.finished())
		// {
		// 	let a = this.timeMeter.stats();
		// 	this.timeMeter.reset(false);

		// 	let b = this.timeMeterFrame.stats();
		// 	this.timeMeterFrame.reset(false);
			
		// 	// Log performance metrics
		// 	console.log(`${c++};${a.average};${a.max};${a.min};${b.average};${b.max};${b.min}`);
		// }
	}
}
