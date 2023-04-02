import {Camera, Vector2, Vector3} from "three";

/**
 * Class contain math utils to simplify common math operations.
 */
export class MathUtils 
{
	/**
	 * Project a point in the world to the screen correct screen position.
	 *
	 * @param point - Point to project from world coordinates to screen coordinates.
	 * @param camera - Camera object to extract the projection matrix used to project the point.
	 */
	static projectPoint(point: Vector3, resolution: Vector2, camera: Camera): Vector3
	{
		let vector = new Vector3();

		vector.copy(point);
		vector.project(camera);

		vector.x = (vector.x + 1) * resolution.x / 2;
		vector.y = (-vector.y + 1) * resolution.y / 2;
		vector.z = 0;

		return vector;
	}
}
