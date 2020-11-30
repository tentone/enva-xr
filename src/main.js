import {Vector3,
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
	MeshNormalMaterial} from "three";
import {BufferGeometryUtils} from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {XRManager} from "./utils/XRManager.js";
import {Text} from 'troika-three-text'

var camera;
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
var width, height;

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

	vector.x = (vector.x + 1) * width / 2;
	vector.y = (-vector.y + 1) * height / 2;
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
	renderer = new WebGLRenderer(
	{
		antialias: true,
		alpha: true,
		canvas: canvas
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.xr.enabled = true;
}

function createScene()
{
	scene = new Scene();

	camera = new PerspectiveCamera(70, width / height, 0.01, 20);

	var light = new HemisphereLight(0xffffff, 0xbbbbff, 1);
	light.position.set(0.5, 1, 0.25);
	scene.add(light);
}

function initialize()
{
	width = window.innerWidth;
	height = window.innerHeight;

	createScene();

	var container = document.createElement("div");
	container.style.width = "100%";
	container.style.height = "100%";
	document.body.appendChild(container);
	var test = document.createElement("div");
	test.style.width = "100px";
	test.style.height = "100px";
	test.style.position = "absolute";
	test.style.left = "10px";
	test.style.top = "10px";
	test.style.backgroundColor = "#FF000077";
	container.appendChild(test);

	var button = document.createElement("div");
	button.style.backgroundColor = "#FF6666";
	button.style.width = "200px";
	button.style.height = "200px";
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
	scene.add(box);

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

			const text = new Text()
			text.text = distance + " cm";
			text.fontSize = 0.1
			text.position.z = -2
			text.color = 0x9966FF
			text.anchorX = "center";
			text.anchorY = "middle";
			text.position.copy(line.getCenter())
			text.sync();
			scene.add(text);

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

function resize()
{
	width = window.innerWidth;
	height = window.innerHeight;
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
	renderer.setSize(width, height);
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

		const pose = frame.getViewerPose(referenceSpace);
		if (pose)
		{
			for(const view of pose.views)
			{

				const depthData = frame.getDepthInformation(view);
				if(depthData)
				{
					// renderDepthInformationGPU(depthData, view, viewport);
				}

			}
		}
	}
	renderer.render(scene, camera);
}

initialize();
