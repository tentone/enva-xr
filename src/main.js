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
import {XRManager} from "./XRManager.js";
import SpriteText from 'three-spritetext';

var cssContainer;
var camera, scene, renderer, light;

var hitTestSource = null;
var hitTestSourceRequested = false;

var measurements = [];

/**
 * List of labels stored with {div: ..., point: ....}
 */
var labels = [];

var cursor = null;

/**
 * Line being created currently.
 */
var currentLine = null;

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
		new MeshBasicMaterial()
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

function createCSS3DContainer()
{
	cssContainer = document.createElement("div");
	cssContainer.style.position = "absolute";
	cssContainer.style.top = "0px";
	cssContainer.style.pointerEvents = "none";
}

function createScene()
{
	scene = new Scene();

	camera = new PerspectiveCamera(70, width / height, 0.01, 20);

	light = new HemisphereLight(0xffffff, 0xbbbbff, 1);
	light.position.set(0.5, 1, 0.25);
	scene.add(light);
}

function initialize()
{
	width = window.innerWidth;
	height = window.innerHeight;

	createScene();

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
			domOverlay: {root: cssContainer},
			requiredFeatures: ["hit-test"]
		});
	};
	document.body.appendChild(button);

	var canvas = document.createElement("canvas");
	document.body.appendChild(canvas);
	createRenderer(canvas)

	createCSS3DContainer()
	document.body.appendChild(cssContainer);

	var controller = renderer.xr.getController(0);
	controller.addEventListener("select", onSelect);
	scene.add(controller);

	var box = new Mesh(new BoxBufferGeometry(), new MeshNormalMaterial());
	box.scale.set(0.1, 0.1, 0.1);
	scene.add(box);

	// var text = new SpriteText("Sprite text");
	// text.position.x = 2;
	// scene.add(text);

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

			var text = document.createElement("div");
			text.style.fontFamily = "Arial, Helvetica, sans-serif";
			text.style.position = "absolute";
			text.style.color = "rgb(255,255,255)";
			text.textContent = distance + " cm";
			cssContainer.appendChild(text);

			var line = new Line3(measurements[0], measurements[1])

 			labels.push(
			{
				div: text,
				point: line.getCenter()
			});

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
		if (hitTestSourceRequested === false)
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

		labels.map((label) =>
		{
			var pos = projectPoint(label.point, renderer.xr.getCamera(camera));
			var x = pos.x;
			var y = pos.y;
			label.div.style.transform = "translate(-50%, -50%) translate(" + x + "px," + y + "px)";
		})

	}
	renderer.render(scene, camera);
}

initialize();
