import { ARRenderer } from "../ARRenderer";
import { BufferGeometry, BufferAttribute, Vector3, Group, Mesh, MeshBasicMaterial } from "three";
import { ARObject } from "./ARObject";

/**
 * Data of a specific plane being managed in the Planes object.
 */
export class PlaneData {
	/**
	 * ID of the plane.
	 */
	public id: number;

	/**
	 * Timestamp of the last udpate.
	 */
	public timestamp: number;

	/**
	 * Mesh associated with the plane.
	 */
	public mesh: Mesh;
}

/**
 * AR planes can be created using the "plane-detection" feature when available.
 */
export class Planes extends Group implements ARObject {
	public isARObject: boolean = true;
	
	/**
	 * ID counter.
	 */
	public static id: number = 0; 

	/**
	 * Map with all existing planes.
	 */
	public planes: Map<number, PlaneData> = new Map();

	public constructor() {
		super();

	}

	public beforeARUpdate(renderer: ARRenderer, time: number, frame: XRFrame) {
		// @ts-ignore
		if (frame.detectedPlanes) {

			// Delete planes that are no longer visible
			this.planes.forEach((planeData: PlaneData, plane: any) => {
				// @ts-ignore
				if (!frame.detectedPlanes.has(plane)) {
					// plane was removed
					this.planes.delete(plane);
					this.remove(planeData.mesh);
				}
			});

			// @ts-ignore
			frame.detectedPlanes.forEach(plane => {
				const planePose = frame.getPose(plane.planeSpace, renderer.xrReferenceSpace);

				let planeMesh: Mesh;
				
				// Existing plane (update)
				if (this.planes.has(plane)) {
					const planeData = this.planes.get(plane);
					planeMesh = planeData.mesh;
					
					// Compare timestamp to check for updates
					if (planeData.timestamp < plane.lastChangedTime) {
						planeData.timestamp = plane.lastChangedTime;
						const geometry = Planes.createGeometryFromPolygon(plane.polygon);
						planeData.mesh.geometry.dispose();
						planeData.mesh.geometry = geometry;
					}
				}
				// Create new plane
				else
				{
					const geometry = Planes.createGeometryFromPolygon(plane.polygon);
					planeMesh = new Mesh(geometry, new MeshBasicMaterial({color: 0xFF0000, opacity: 0.4, transparent: true}));
					planeMesh.matrixAutoUpdate = false;
					this.add(planeMesh);

					this.planes.set(plane, {
						id: Planes.id++,
						timestamp: plane.lastChangedTime,
						mesh: planeMesh,
					});

					Planes.id++;
				}
				
				if (planePose) {
					planeMesh.visible = true;
					planeMesh.matrix.fromArray(planePose.transform.matrix);
				}
				else {
					planeMesh.visible = false;
				}
			});
		}
	}

	/**
	 * Create a geometry from polygon data obtained from the API.
	 * 
	 * @param polygon Vertices that compose the polygon
	 * @returns The geometry created to represent the plane.
	 */
	public static createGeometryFromPolygon(polygon: Vector3[]): BufferGeometry {
		const geometry = new BufferGeometry();

		const vertices = [];
		const uvs = [];

		polygon.forEach(point => {
			vertices.push(point.x, point.y, point.z);
			uvs.push(point.x, point.z);
		})

		const indices = [];
		for(let i = 2; i < polygon.length; ++i) {
			indices.push(0, i-1, i);
		}

		geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
		geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2))
		geometry.setIndex(indices);

		return geometry;
	}
}