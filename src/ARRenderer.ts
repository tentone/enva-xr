import {Vector2, WebGLRenderer, Scene, PerspectiveCamera, PCFSoftShadowMap, Object3D, ShadowMapType, Raycaster, Intersection} from "three";
import {ARObject} from "./object/ARObject";
import { DepthCanvasTexture } from "./texture/DepthCanvasTexture";
import { EventManager } from "./utils/EventManager";

/**
 * Configuration of the AR renderer.
 * 
 * Indicates the capabilities required by the renderer.
 */
export class ARRendererConfig 
{
	/**
	 * DOM overlay will create a DOM container to place custom HTML elements in the screen.
	 * 
	 * Usefull to place button and other GUI elements on top of the AR scene.
	 * 
	 * Can be used alongside CSS 3D to have HTML element following the environment.
	 */
	public domOverlay = true;

	/**
	 * Hit test allow the user to ray cast into real-wolrd depth data.
	 * 
	 * Useful for interaction, object placement, etc. 
	 */
	public hitTest = true;

	/**
	 * Lighting probe allow the system to check environment ligthing.
	 * 
	 * Tracks the intensity direction and color of the main light source.
	 */
	public lightProbe = true;

	/**
	 * Reflection cube map allow the obtain visual information of the user surrondings.
	 */
	public reflectionCubeMap = false;

	/**
	 * Depth information captured from the environment.
	 */
	public depthSensing = true;

	/**
	 * Provide a canvas texture with depth information.
	 * 
	 * Automatically updated by the renderer every frame.
	 */
	public depthCanvasTexture = false;
}

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
	 * Configuration of the AR renderer.
	 */
	public config: ARRendererConfig = new ARRendererConfig();

	/**
	 * Camera used to view the this.scene.
	 */
	public camera: PerspectiveCamera = new PerspectiveCamera(60, 1, 1e-1, 1e3);

	/**
	 * Scene to draw into the screen.
	 */
	public scene: Scene = new Scene();

	/**
	 * WebGL this.renderer used to draw the this.scene.
	 */
	public renderer: WebGLRenderer = null;

	/**
	 * Size of the this.rendererer.
	 */
	public resolution: Vector2 = new Vector2();

	/**
	 * WebGL 2.0 context used to render.
	 */
	public glContext: WebGLRenderingContext = null;

	/**
	 * XR session data.
	 */
	public xrSession: XRSession = null;

	/**
	 * XR Binding object used get additional gl data.
	 */
	public xrGlBinding: XRWebGLBinding = null;

	/**
	 * XR reference space indicates the reference for tracking in the XR environment.
	 */
	public xrReferenceSpace: XRReferenceSpace = null;

	/**
	 * XR viewer pose indiactes the pose of the user or device tracked by the XR system.
	 * 
	 * It may represent a tracked piece of hardware or the observed position of a user head relative.
	 * 
	 * Updated every frame based on tracking.
	 */
	public xrViewerPose: XRViewerPose = null;

	/**
	 * List of XR views available. Will depende on the type of hardware being used.
	 * 
	 * Multi screen hardware (e.g. HMD) might have multiple views into the AR scene.
	 */
	public xrViews: XRView[] = [];

	/**
	 * Depth information for each of the views available.
	 * 
	 * Updated when config.depth is set true.
	 */
	public xrDepth: XRDepthInformation[] = [];

	/**
	 * XR hit test source.
	 * 
	 * Hit test allow the user to ray cast into real-wolrd depth data.
	 * 
	 * Available when config.hitTest is set true.
	 */
	public xrHitTestSource: XRHitTestSource = null;

	/**
	 * Lighting probe allow the system to check environment ligthing.
	 * 
	 * Tracks the intensity direction and color of the main light source.
	 * 
	 * Available when config.lightProbe is set true.
	 */
	public xrLightProbe: XRLightProbe = null;

	/**
	 * Reflection cube map contains a WebGL cube map with the surrondings of the user/device.
	 * 
	 * More information at https://developer.mozilla.org/en-US/docs/Web/API/XRWebGLBinding/getReflectionCubeMap
	 * 
	 * Available when config.lightProbe and config.reflectionCubeMap are set true.
	 */
	public xrReflectionCubeMap: WebGLTexture = null;

	/**
	 * Canvas depth texture created from depth data.
	 * 
	 * Automatically updated by the renderer when CPU depth information is available.
	 * 
	 * Available when the config.depthCanvasTexture flag is set true.
	 */
	public depthCanvasTexture: DepthCanvasTexture = null;

	/**
	 * Callback to update logic of the app before rendering.
	 */
	public onFrame:(time: number, renderer: ARRenderer) => void = null;

	/**
	 * Rendering canvas.
	 */
	public canvas: HTMLCanvasElement = null;

	/**
	 * DOM container for GUI elements visible in AR mode.
	 * 
	 * The container is only displayed when the renderer starts.
	 */
	public domContainer: HTMLElement = null;

	/**
	 * Event manager used to start and destroy browser events.
	 */
	public event: EventManager = new EventManager();

	public constructor()
	{
		if (!navigator.xr) {
			throw new Error("WebXR is not supported by the device/browser.");
		}

		if (window.isSecureContext === false)
		{
			throw new Error("WebXR is not available trough HTTP.");
		}

		this.domContainer = this.createDOMContainer();
	}

	/**
	 * Initalize the AR app.
	 */
	public async start(): Promise<void>
	{
		if (this.xrSession)
		{
			throw new Error("XR Session already running.");
		}
		
		// Set resolution 
		this.resolution.set(window.innerWidth, window.innerHeight);

		// Renderer
		if (!this.renderer) {
			await this.setupRenderer();
		}
		
		const config: any = {
			requiredFeatures: [],
			optionalFeatures: ['anchors', 'plane-detection']
		};

		if (this.config.domOverlay) 
		{
			document.body.appendChild(this.domContainer);
			config.domOverlay = {root: this.domContainer};
			config.requiredFeatures.push("dom-overlay");
		}

		if (this.config.hitTest) 
		{
			config.requiredFeatures.push("hit-test");
		}

		if (this.config.lightProbe) 
		{
			config.requiredFeatures.push("light-estimation");
		}

		if (this.config.depthSensing) 
		{
			config.requiredFeatures.push("depth-sensing");
			config.depthSensing = {
				usagePreference: ["cpu-optimized"],
				dataFormatPreference: ["luminance-alpha"]
				// usagePreference: ["gpu-optimized", "cpu-optimized"],
				// dataFormatPreference: ["luminance-alpha", "float32"]
			};	
		}

		this.xrSession = await navigator.xr.requestSession("immersive-ar", config);

		// @ts-ignore
		console.log('enva-xr: XR session ', this.xrSession);

		this.renderer.xr.setReferenceSpaceType('local');
		this.renderer.xr.setSession(this.xrSession);
		
		this.event.add(window, "resize", () => {this.resize();});
		this.event.add(this.xrSession, "end", () => {this.stop();});
		this.event.create();

		this.xrReferenceSpace = await this.xrSession.requestReferenceSpace('local');
		this.xrGlBinding = new XRWebGLBinding(this.xrSession, this.glContext);

		// Hit test source
		if (this.config.hitTest)
		{
			this.xrHitTestSource = await this.xrSession.requestHitTestSource({
				space: await this.xrSession.requestReferenceSpace('viewer'),
				entityTypes: ['plane', 'point', 'mesh'],
				offsetRay: new XRRay()
			});

			// console.log('enva-xr: XR hit test source', this.xrHitTestSource);
		}

		// Light probe
		if (this.config.lightProbe) 
		{
			// @ts-ignore
			this.xrLightProbe = await this.xrSession.requestLightProbe({
				// @ts-ignore
				reflectionFormat: this.xrSession.preferredReflectionFormat
			});

			if (this.config.reflectionCubeMap)
			{
				this.xrLightProbe.onreflectionchange = () => 
				{
					// @ts-ignore
					this.xrReflectionCubeMap = this.xrGlBinding.getReflectionCubeMap(this.xrLightProbe);
					// console.log('enva-xr: XR light probe reflection change', this.xrReflectionCubeMap);
				};
	
			}

			// console.log('enva-xr: XR light probe', this.xrLightProbe);
		}

		// Render loop
		this.renderer.setAnimationLoop((time: number, frame: any) =>
		{
			this.render(time, frame);
		});
	}

	/**
	 * Stop the XR session.
	 * 
	 * Destroys all elements related with the XR session but keeps rendering context alive.
	 * 
	 * If the renderer will no longer be used call dispose() to clean up graphics context.
	 */
	public async stop(): Promise<void> 
	{
		// Stop animation loop
		this.renderer.setAnimationLoop(null);

		// Remove DOM overlay
		if (this.config.domOverlay) 
		{
			document.body.removeChild(this.domContainer);
		}

		// End XR session
		try {
			await this.xrSession.end();
		} catch(e) {}
		
		// Destroy and clear events associated
		this.event.clear();

		// Clean XR structures
		this.xrSession = null;
		this.xrHitTestSource = null;
		this.xrReferenceSpace = null;
		this.xrGlBinding = null;
		this.xrDepth = null;
		this.xrLightProbe = null;
		this.xrReflectionCubeMap = null;
		this.xrViewerPose = null;
		this.xrViews = [];
	}


	/**
	 * Create DOM container to place DOM elements as overlay of the AR scene.
	 */
	public createDOMContainer(): HTMLElement {
		const div = document.createElement("div");
		div.style.position = "absolute";
		div.style.display = "block";
		div.style.top = "0px";
		div.style.left = "0px";
		div.style.width = "100%";
		div.style.height = "100%";
		div.style.backgroundColor = "#FF0000";

		return div;
	}

	/**
	 * Dispose renderer, should be called when the renderer is not longer necessary.
	 */
	public async dispose(): Promise<void> 
	{
		this.stop();
		this.forceContextLoss();
	}

	/**
	 * Change the shadow map rendering method.
	 * 
	 * @param shadowType - Type of shadows to use.
	 */
	public setShadowType(shadowType: ShadowMapType): void
	{
		this.renderer.shadowMap.enabled = shadowType !== null;
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

		// console.log("enva-xr: Shadow type changed to " + this.renderer.shadowMap.type);
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
	public async setupRenderer(canvas?: HTMLCanvasElement | OffscreenCanvas): Promise<void>
	{
		if (canvas) 
		{
			// @ts-ignore
			this.canvas = canvas;
		}
		else if (!this.canvas)
		{
			this.canvas = document.createElement("canvas");
			document.body.appendChild(this.canvas);
		}

		this.glContext = this.canvas.getContext("webgl2", {xrCompatible: true});

		await this.glContext.makeXRCompatible();

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

		this.renderer.sortObjects = true;

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

			this.glContext = null;
		}
		catch (e)
		{
			throw new Error("Failed to destroy WebGL context.");
		}

		// Remove canvas from DOM
		if (this.canvas && !(this.canvas instanceof OffscreenCanvas))
		{
			try 
			{
				this.canvas.parentElement.removeChild(this.canvas);
			}
			catch (e) {}
		}
	}


	/**
	 * Update the canvas and renderer size based on window size.
	 */
	public resize(): void
	{
		this.resolution.set(window.innerWidth, window.innerHeight);

		this.camera.aspect = this.resolution.x / this.resolution.y;
		this.camera.updateProjectionMatrix();

		if (this.renderer) 
		{
			this.renderer.setSize(this.resolution.x, this.resolution.y);
			this.renderer.setPixelRatio(window.devicePixelRatio);
		}
	}

	/**
	 * Raycast into the AR scene.
	 * 
	 * @param origin - Origin of the ray in screen space from -1 to 1.
	 * @param object - Object to raycast (optional). By default the entire scene is used. 
	 */
	public raycast(origin: Vector2, object?: Object3D): Intersection<Object3D<Event>>[] 
	{
		if (!object) 
		{
			object = this.scene;
		}

		const intersections: Intersection<Object3D<Event>>[] = [];
		
		const raycaster = new Raycaster();
		raycaster.setFromCamera(origin, this.camera);
		raycaster.intersectObject(object, true, intersections);

		return intersections;
	}

	/**
	 * Update logic and render this.scene into the screen.
	 *
	 * @param time - Time ellapsed since the beginning.
	 * @param frame - XR frame object.
	 */
	public async render(time: number, frame: XRFrame): Promise<void>
	{
		if (!frame)
		{
			return;
		}

		// Update viewer pose
		this.xrViewerPose = frame.getViewerPose(this.xrReferenceSpace);
		if (this.xrViewerPose)
		{
			// console.log('enva-xr: XR viewer pose', this.xrViewerPose);

			// @ts-ignore
			this.xrViews = this.xrViewerPose.views;

			// Update depth information
			if (this.config.depthSensing) 
			{
				this.xrDepth = [];
				
				for (const view of this.xrViews)
				{
					// @ts-ignore
					const depthInfo: XRDepthInformation = frame.getDepthInformation(view);

					if (depthInfo)
					{
						// console.log('enva-xr: XR depth information', depthInfo);
						this.xrDepth.push(depthInfo);
						
						if (this.config.depthCanvasTexture) {
							// @ts-ignore
							if (depthInfo instanceof XRCPUDepthInformation) 
							{
								if (!this.depthCanvasTexture) {
	
									const canvas = new OffscreenCanvas(depthInfo.width, depthInfo.height);
									// const canvas = document.createElement('canvas');
									// canvas.style.position = 'absolute';
									// canvas.style.display = 'block';
									// canvas.style.top = '0px';
									// canvas.style.left = '0px';
									// this.domContainer.appendChild(canvas);
	
									this.depthCanvasTexture = new DepthCanvasTexture(canvas);
								}
								
								this.depthCanvasTexture.updateDepth(depthInfo, 0, 2);
							}
							// @ts-ignore
							else if (depthInfo instanceof XRGPUDepthInformation) 
							{
	
							}
						}
	

						// // Update textures
						// this.depthDataTexture.updateDepth(depthInfo);

						// // Draw canvas texture depth
						// if (this.debugDepth)
						// {
						// 	this.depthTexture.updateDepth(depthInfo, this.camera.near, this.camera.far);
						// }

						// // Update normal matrix
						// AugmentedMaterial.updateUniforms(this.scene, depthInfo);
					}
					
				}
			}

		}

		// Update AR objects
		this.scene.traverse((object: Object3D): void => 
		{
			const ar = object as any as ARObject; 
			if (ar.isARObject) 
			{
				ar.beforeARUpdate(this, time, frame);
			}
		});

		// onFrame callback
		if (this.onFrame) 
		{
			this.onFrame(time, this);
		}
		
		this.renderer.render(this.scene, this.camera);
	}
}
