import {Vector3, Vector2,
	Line3,
	LineBasicMaterial,
	BufferGeometry,
	Line,
	RingBufferGeometry,
	CircleBufferGeometry,
	Mesh,
	MeshBasicMaterial,
	WebGLRenderer,
	Scene,
	PerspectiveCamera,
	HemisphereLight,
	BoxBufferGeometry,
	MeshNormalMaterial,
    DataTexture,
	SphereBufferGeometry} from "three";
import {BufferGeometryUtils} from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {XRManager} from "./utils/XRManager.js";
import {BillboardGroup} from "./object/BillboardGroup.js";
import {Text} from 'troika-three-text'

/**
 * Camera used to view the scene.
 */
var camera;

/**
 * Scene to draw into the screen.
 */
var scene;

/**
 * WebGL renderer used to draw the scene.
 */
var renderer;

/**
 * WebXR hit test source, (null until requested).
 */
var hitTestSource = null;
var hitTestSourceRequested = false;

/**
 * List of measurement points.
 */
var measurements = [];

/**
 * Cursor to hit test the scene.
 */
var cursor = null;

/**
 * Line being created currently.
 */
var currentLine = null;

/**
 * Size of the rendererer.
 */
var resolution = new Vector2();

var depthCanvas;

/**
 * Project a point in the world to the screen correct screen position.
 *
 * @param {*} point
 * @param {*} camera
 */
function projectPoint(point, camera)
{
	var vector = new Vector3();

	vector.copy(point);
	vector.project(camera);

	vector.x = (vector.x + 1) * resolution.x / 2;
	vector.y = (-vector.y + 1) * resolution.y / 2;
	vector.z = 0;

	return vector
};

/**
 * Create a line object to draw the measurement in the scene.
 *
 * @param {*} point
 */
function createLine(point)
{
	var lineMaterial = new LineBasicMaterial(
	{
		color: 0xffffff,
		linewidth: 5,
		linecap: "round"
	});

	var lineGeometry = new BufferGeometry().setFromPoints([point, point]);

	return new Line(lineGeometry, lineMaterial);
}

function updateLine(matrix)
{
	var positions = currentLine.geometry.attributes.position.array;
	positions[3] = matrix.elements[12]
	positions[4] = matrix.elements[13]
	positions[5] = matrix.elements[14]
	currentLine.geometry.attributes.position.needsUpdate = true;
	currentLine.geometry.computeBoundingSphere();
}

function createCursor()
{
	var ring = new RingBufferGeometry(0.045, 0.05, 32).rotateX(-Math.PI / 2);
	var dot = new CircleBufferGeometry(0.005, 32).rotateX(-Math.PI / 2);

	var cursor = new Mesh(
		BufferGeometryUtils.mergeBufferGeometries([ring, dot]),
		new MeshBasicMaterial({opacity: 0.4, transparent: true})
	);
	cursor.matrixAutoUpdate = false;
	cursor.visible = false;

	return cursor;
}

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
    renderer.extensions.get("WEBGL_depth_texture");

	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.xr.enabled = true;
}

function createScene()
{
	scene = new Scene();

	camera = new PerspectiveCamera(60, resolution.x / resolution.y, 0.1, 20);

	var light = new HemisphereLight(0xffffff, 0xBBBBff, 1);
	light.position.set(0.5, 1, 0.25);
	scene.add(light);
}

function initialize()
{
	resolution.set(window.innerWidth, window.innerHeight);

	createScene();

	var container = document.createElement("div");
	container.style.width = "100%";
	container.style.height = "100%";
	document.body.appendChild(container);

	var toolButton = document.createElement("div");
	toolButton.style.width = "70px";
	toolButton.style.height = "70px";
	toolButton.style.position = "absolute";
	toolButton.style.left = "10px";
	toolButton.style.bottom = "10px";
	toolButton.style.backgroundColor = "#FFFFFF66";
	toolButton.style.borderRadius = "20px";
	container.appendChild(toolButton);

	var ruler = document.createElement("img");
	ruler.src = "./assets/ruler.svg";
	ruler.style.width = "80%";
	ruler.style.height = "80%";
	ruler.style.top = "10%";
	ruler.style.left = "10%";
	ruler.style.position = "absolute";
	toolButton.appendChild(ruler);

	depthCanvas = document.createElement("canvas");
	depthCanvas.style.position = "absolute";
	depthCanvas.style.right = "10px";
	depthCanvas.style.bottom = "10px";
	depthCanvas.style.height = "160px";
	depthCanvas.style.width = "90px";
	container.appendChild(depthCanvas);

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
	createRenderer(canvas)

	var controller = renderer.xr.getController(0);
	controller.addEventListener("select", onSelect);
	scene.add(controller);

	var box = new Mesh(new BoxBufferGeometry(), new MeshNormalMaterial());
    box.scale.set(0.1, 0.1, 0.1);
    box.position.x = 2;
	scene.add(box);

	var sphere = new Mesh(new SphereBufferGeometry(), new MeshNormalMaterial());
    sphere.scale.set(0.1, 0.1, 0.1);
    sphere.position.z = 2;
	scene.add(sphere);

	// Cursor to select objects
	cursor = createCursor();
	scene.add(cursor);

	window.addEventListener("resize", resize, false);

	renderer.setAnimationLoop(render);
}

function onSelect()
{
	if (cursor.visible)
	{
		// Get cursor position
		var position = new Vector3();
		position.setFromMatrixPosition(cursor.matrix);

		// Add to the measurements list
		measurements.push(position);

		if (measurements.length == 2)
		{
			var distance = Math.round(measurements[0].distanceTo(measurements[1]) * 100);
			var line = new Line3(measurements[0], measurements[1]);

			var group = new BillboardGroup();
			line.getCenter(group.position);
			scene.add(group);

			var text = new Text();
			text.text = distance + " cm";
			text.fontSize = 0.1
			text.color = 0xFFFFFF;
			text.anchorX = "center";
			text.anchorY = "middle";
			text.rotation.set(Math.PI, Math.PI, Math.PI);
			text.sync();
			group.add(text);

			measurements = [];
			currentLine = null;
		}
		else
		{
			currentLine = createLine(measurements[0]);
			scene.add(currentLine);
		}
	}
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
}

function render(timestamp, frame)
{
	if (frame)
	{
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
			}
			else
			{
				cursor.visible = false;
			}

			if (currentLine)
			{
				updateLine(cursor.matrix);
			}
		}

		// Handle depth
		var pose = frame.getViewerPose(referenceSpace);
		if (pose)
		{
			for(var view of pose.views)
			{
				var depthData = frame.getDepthInformation(view);
				if(depthData)
				{
					depthCanvas.width = depthData.width;
					depthCanvas.height = depthData.height;

					var context = depthCanvas.getContext("2d");
					var imageData = context.getImageData(0, 0, depthCanvas.width, depthCanvas.height);

					/*var maxDistance = 0;
					for(var x = 0; x < depthData.width; x++)
					{
						for(var y = 0; y < depthData.height; y++)
						{
							var distance = depthData.getDepth(x, y);
							if(distance > maxDistance)
							{
								maxDistance = distance;
							}
						}
					}*/

					for(var x = 0; x < depthData.width; x++)
					{
						for(var y = 0; y < depthData.height; y++)
						{
							var distance = depthData.getDepth(x, y) / 3.0;
							var j = ((depthData.height - y) * depthCanvas.width + x) * 4;

							if (distance > 1.0) {
								distance = 1.0;
							}

							imageData.data[j] = Math.ceil(distance * 256);
							imageData.data[j + 1] = Math.ceil(distance * 256);
							imageData.data[j + 2] = Math.ceil(distance * 256);
							imageData.data[j + 3] = 255;
						}
					}

					context.putImageData(imageData, 0, 0);
				}

			}
		}
	}

	renderer.render(scene, camera);
}

initialize();
