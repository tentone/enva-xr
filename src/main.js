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
    HemisphereLight} from "three";
import {ARButton} from "three/examples/jsm/webxr/ARButton.js";
import {BufferGeometryUtils} from "three/examples/jsm/utils/BufferGeometryUtils.js";

let container, css3DContainer;
let camera, scene, renderer, light;
let controller;

let hitTestSource = null;
let hitTestSourceRequested = false;

let measurements = [];
let labels = [];

let cursor = null;
let currentLine = null;

let width, height;
   
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
	let lineMaterial = new LineBasicMaterial(
	{
		color: 0xffffff,
		linewidth: 5,
		linecap: "round"
	});

    let lineGeometry = new BufferGeometry().setFromPoints([point, point]);
    
	return new Line(lineGeometry, lineMaterial);
}

function updateLine(matrix)
{
	let positions = currentLine.geometry.attributes.position.array;
	positions[3] = matrix.elements[12]
	positions[4] = matrix.elements[13]
	positions[5] = matrix.elements[14]
	currentLine.geometry.attributes.position.needsUpdate = true;
	currentLine.geometry.computeBoundingSphere();
}

function createSelector()
{
	let ring = new RingBufferGeometry(0.045, 0.05, 32).rotateX(-Math.PI / 2);
	let dot = new CircleBufferGeometry(0.005, 32).rotateX(-Math.PI / 2);
	cursor = new Mesh(
		BufferGeometryUtils.mergeBufferGeometries([ring, dot]),
		new MeshBasicMaterial()
	);
	cursor.matrixAutoUpdate = false;
	cursor.visible = false;
}

function createRenderer()
{
	renderer = new WebGLRenderer(
	{
		antialias: true,
		alpha: true
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.xr.enabled = true;
}

function createCSS3DContainer()
{
	css3DContainer = document.createElement("div");
	css3DContainer.style.position = "absolute";
	css3DContainer.style.top = "0px";
	css3DContainer.style.pointerEvents = "none";
	css3DContainer.setAttribute("id", "container");
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
	container = document.createElement("div");
	document.body.appendChild(container);

	width = window.innerWidth;
	height = window.innerHeight;

	createScene();

	createRenderer()
	container.appendChild(renderer.domElement);

	createCSS3DContainer()
	container.appendChild(css3DContainer);

	document.body.appendChild(ARButton.createButton(renderer,
	{
		optionalFeatures: ["dom-overlay"],
		domOverlay:
		{
			root: document.querySelector("#container")
		},
		requiredFeatures: ["hit-test"]
	}));

	controller = renderer.xr.getController(0);
	controller.addEventListener("select", onSelect);
	scene.add(controller);

	createSelector();
	scene.add(cursor);

    window.addEventListener("resize", resize, false);
    
	renderer.setAnimationLoop(render);
}

function onSelect()
{
	if (cursor.visible)
	{
        // Get cursor position
        let position = new Vector3();
        position.setFromMatrixPosition(cursor.matrix);

        // Add to the measurements list
        measurements.push(position);
        
		if (measurements.length == 2)
		{
			let distance = Math.round(measurements[0].distanceTo(measurements[1]) * 100);

			let text = document.createElement("div");
			text.className = "label";
			text.style.color = "rgb(255,255,255)";
			text.textContent = distance + " cm";
			document.querySelector("#container").appendChild(text);

            let line = new Line3(measurements[0], measurements[1])

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
		let referenceSpace = renderer.xr.getReferenceSpace();
		let session = renderer.xr.getSession();
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
			let hitTestResults = frame.getHitTestResults(hitTestSource);
			if (hitTestResults.length)
			{
				let hit = hitTestResults[0];
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
			let pos = projectPoint(label.point, renderer.xr.getCamera(camera));
			let x = pos.x;
			let y = pos.y;
			label.div.style.transform = "translate(-50%, -50%) translate(" + x + "px," + y + "px)";
		})

	}
	renderer.render(scene, camera);
}

export {initialize};