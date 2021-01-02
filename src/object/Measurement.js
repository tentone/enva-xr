import {BufferGeometry, Line, Line3, LineBasicMaterial, Vector3} from "three";
import {Text} from "troika-three-text"

/**
 * Represents a measurement from a point to another.
 */
export class Measurement extends Line
{
	constructor(point)
	{
		if (!point)
		{
			point = new Vector3(0, 0, 0);
		}

		var geometry = new BufferGeometry().setFromPoints([point, point]);

		super(geometry, new LineBasicMaterial(
		{
			color: 0xffffff,
			linewidth: 5
		}));

		/**
		 * List of points that compose the measurement.
		 */
		this.measurements = [point.clone(), point.clone()];

		/**
		 * Text used to display the measurement value.
		 */
		this.text = new Text();
		this.text.fontSize = 0.1
		this.text.color = 0xFFFFFF;
		this.text.anchorX = "center";
		this.text.anchorY = "middle";
		this.text.rotation.set(Math.PI, Math.PI, Math.PI);
		this.add(this.text);
	}

	/**
	 * Update the second measurement line with new position.
	 *
	 * Useful for preview in real time the measurement.
	 *
	 * @param {*} matrix
	 */
	setPointFromMatrix(matrix)
	{
		this.measurements[1].set(matrix.elements[12], matrix.elements[13], matrix.elements[14])

		this.updateGeometry();
		this.updateText();
	}

	/**
	 * Update the line geometry of the measurement to match the measurements array.
	 *
	 * Also recalculates the bouding sphere of the geometry to ensure proper camera culling.
	 */
	updateGeometry() {
		var positions = this.geometry.attributes.position.array;
		positions[0] = this.measurements[0].x;
		positions[1] = this.measurements[0].y;
		positions[2] = this.measurements[0].z;
		positions[3] = this.measurements[1].x;
		positions[4] = this.measurements[1].y;
		positions[5] = this.measurements[1].z;
		this.geometry.attributes.position.needsUpdate = true;
		this.geometry.computeBoundingSphere();
	}

	/**
	 * Update the text of the measurement.
	 */
	updateText() {
		var distance = Math.round(this.measurements[0].distanceTo(this.measurements[1]) * 100);
		var line = new Line3(this.measurements[0], this.measurements[1]);

		line.getCenter(this.text.position);
		this.text.position.y += 0.1;

		this.text.text = distance + " cm";
		this.text.sync();
	}
}
