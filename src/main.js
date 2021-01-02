import {Vector3, Vector2, Mesh, Euler, WebGLRenderer, Scene, PerspectiveCamera, BoxBufferGeometry, MeshNormalMaterial, SphereBufferGeometry, AmbientLight, Matrix4} from "three";
import {XRManager} from "./utils/XRManager.js";
import {GUIUtils} from "./utils/GUIUtils.js";
import {Cursor} from "./object/Cursor.js";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {AugmentedCanvasMaterial} from "./material/AugmentedCanvasMaterial.js";
import {World, Sphere, NaiveBroadphase, SplitSolver, GSSolver, Body, Plane, Vec3, Quaternion} from "cannon";
import {PhysicsObject} from "./object/PhysicsObject.js";
import {DepthCanvasTexture} from "./texture/DepthCanvasTexture.js";
import {Measurement} from "./object/Measurement.js";

/**
 * Physics world used for interaction.
 */
var world = null;

/**
 * Phsyics floor plane should be set to the lowest plane intersection found.
 */
var floor = null;

/**
 * Physics depth particles. Matches the same size of the depth map provided by WebXR.
 */
var depthParticles = null;

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
 * Camera used to view the scene.
 */
var camera = new PerspectiveCamera(60, 1, 0.1, 10);

/**
 * Scene to draw into the screen.
 */
var scene = new Scene();

/**
 * WebGL renderer used to draw the scene.
 */
var renderer = null;

/**
 * WebXR hit test source, (null until requested).
 */
var hitTestSource = null;

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
 * Create and setup webgl renderer object.
 *
 * @param {*} canvas
 */
function createRenderer(canvas)
{
	var context = canvas.getContext("webgl2", {xrCompatible: true});

	renderer = new WebGLRenderer(
	{
		context: context,
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

function createWorld()
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

function loadGLTFMesh(url, scene, position, rotation, scale) {

	const loader = new GLTFLoader();
	loader.load(url, function(gltf)
	{
		gltf.scene.traverse(function(child)
		{
			if (child instanceof Mesh)
			{
				child.material = new AugmentedCanvasMaterial(child.material.map, depthTexture);
				child.scale.set(scale, scale, scale);
				child.position.copy(position);
				child.rotation.copy(rotation);
				scene.add(child);
			}
		});
	});
}

function initialize()
{
	createWorld();

	resolution.set(window.innerWidth, window.innerHeight);
	scene.add(new AmbientLight(0xFFFFFF, 1));

	var container = document.createElement("div");
	container.style.width = "100%";
	container.style.height = "100%";
	document.body.appendChild(container);

	var rulerButton = GUIUtils.createButton("./assets/icon/ruler.svg", 10, 10, 70, 70, function()
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
	});
	container.appendChild(rulerButton);

	var treeButton = GUIUtils.createButton("./assets/icon/tree.svg", 10, 90, 70, 70, function()
	{
		if (cursor.visible)
		{
			var position = new Vector3();
			position.setFromMatrixPosition(cursor.matrix);

			loadGLTFMesh("./assets/3d/tree/scene.gltf", scene, position, new Euler(0, 0, 0), 0.002);
		}
	});
	container.appendChild(treeButton);

	var flowerButton = GUIUtils.createButton("./assets/icon/flower.svg", 10, 170, 70, 70, function()
	{
		if (cursor.visible)
		{
			var position = new Vector3();
			position.setFromMatrixPosition(cursor.matrix);

			loadGLTFMesh("./assets/3d/flower/scene.gltf", scene, position, new Euler(Math.PI, 0, 0), 0.007);
		}
	});
	container.appendChild(flowerButton);

	var depthButton = GUIUtils.createButton("./assets/icon/3d.svg", 10, 250, 70, 70, function()
	{
		debugDepth = !debugDepth;
		depthCanvas.style.display = debugDepth ? "block" : "none";
	});
	container.appendChild(depthButton);

	var physicsButton = GUIUtils.createButton("./assets/icon/cube.svg", 10, 330, 70, 70, function()
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
	});
	container.appendChild(physicsButton);

	depthCanvas = document.createElement("canvas");
	depthCanvas.style.position = "absolute";
	depthCanvas.style.right = "10px";
	depthCanvas.style.bottom = "10px";
	depthCanvas.style.borderRadius = "20px";
	container.appendChild(depthCanvas);

	depthTexture = new DepthCanvasTexture(depthCanvas);

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
			requiredFeatures: ["hit-test", "depth-sensing"]
		});
	};
	document.body.appendChild(button);

	var canvas = document.createElement("canvas");
	document.body.appendChild(canvas);
	createRenderer(canvas);

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

	window.addEventListener("resize", resize, false);

	renderer.setAnimationLoop(render);
}

/**
 * Resize the canvas and renderer size.
 */
function resize()
{
	resolution.set(window.innerWidth, window.innerHeight);

	camera.aspect = resolution.x / resolution.y;
	camera.updateProjectionMatrix();

	renderer.setSize(resolution.x, resolution.y);
	renderer.setPixelRatio(window.devicePixelRatio);
}

/**
 * Update logic and render scene into the screen.
 *
 * @param {*} time
 * @param {*} frame
 */
function render(time, frame)
{
	if (!frame)
	{
		return;
	}

	world.step(0.0166);

	scene.traverse(function(child)
	{
		if(child.isMesh && child.material && child.material instanceof AugmentedCanvasMaterial)
		{
			child.material.uniforms.uWidth.value = Math.floor(window.devicePixelRatio * window.innerWidth);
			child.material.uniforms.uHeight.value = Math.floor(window.devicePixelRatio * window.innerHeight);
			child.material.uniforms.uNear.value = camera.near;
			child.material.uniforms.uFar.value = camera.far;

			child.material.uniformsNeedUpdate = true;
		}
	});

	var referenceSpace = renderer.xr.getReferenceSpace();
	var session = renderer.xr.getSession();

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
				hitTestSource = source;
			});
		});

		session.addEventListener("end", function()
		{
			hitTestSourceRequested = false;
			hitTestSource = null;
		});

		hitTestSourceRequested = true;
	}



	// Process Hit test
	if (hitTestSource)
	{
		var hitTestResults = frame.getHitTestResults(hitTestSource);
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
				depthTexture.updateDepth(depthData, camera.near, camera.far);
			}
		}
	}

	renderer.render(scene, camera);
}

/**
 * Update the physics particle model to match the depth information.
 */
function updateDepthPhysics(depth)
{
	if(depthParticles === null)
	{
        depthParticles = new Array(depth.width * depth.height);
    }

	var i = 0;
    for(var x = 0; x < depth.width; x++)
    {
        for(var y = 0; y < depth.height; y++)
        {
			// TODO <UPDATE PARTICLE>
			var distance = depth.getDepth(x, y);
			depthParticles[i] = distance;
			i++;
        }
	}
}


initialize();
