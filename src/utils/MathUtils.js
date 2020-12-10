import {Vector3} from "three";

export class MathUtils {
	/**
	 * Project a point in the world to the screen correct screen position.
	 *
	 * @param {*} point
	 * @param {*} camera
	 */
	static projectPoint(point, camera)
	{
		var vector = new Vector3();

		vector.copy(point);
		vector.project(camera);

		vector.x = (vector.x + 1) * resolution.x / 2;
		vector.y = (-vector.y + 1) * resolution.y / 2;
		vector.z = 0;

		return vector
	};
}
