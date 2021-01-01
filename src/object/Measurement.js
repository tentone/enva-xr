import {BufferGeometry, Line, LineBasicMaterial} from "three";

/**
 * Represents a measurement from a point to another.
 */
export class Measurement extends Line
{
	constructor(point)
	{
		var geometry = new BufferGeometry().setFromPoints([point, point]);

		super(geometry, new LineBasicMaterial(
		{
			color: 0xffffff,
			linewidth: 5
		}));

		/**
		 * List of points that compose the measurement.
		 */
		this.measurements = [point, point];
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
		var positions = this.geometry.attributes.position.array;
		positions[3] = matrix.elements[12]
		positions[4] = matrix.elements[13]
		positions[5] = matrix.elements[14]
		this.geometry.attributes.position.needsUpdate = true;
		// this.geometry.computeBoundingSphere();
	}

	/**
	 * Update the text of the measurement.
	 */
	updateText() {
		var distance = Math.round(this.measurements[0].distanceTo(this.measurements[1]) * 100);
		var line = new Line3(this.measurements[0], this.measurements[1]);

		var group = new BillboardGroup();
		line.getCenter(group.position);
		group.position.y += 0.1;
		this.add(group);

		var text = new Text();
		text.text = distance + " cm";
		text.fontSize = 0.1
		text.color = 0xFFFFFF;
		text.anchorX = "center";
		text.anchorY = "middle";
		text.rotation.set(Math.PI, Math.PI, Math.PI);
		text.sync();
		group.add(text);
	}
}
