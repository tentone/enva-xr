import {BufferGeometry, BufferAttribute, Vector3, Group, Mesh, ShadowMaterial, Material, MeshBasicMaterial} from "three";
import {AugmentedMaterial} from "material/AugmentedMaterial";
import {ARRenderer} from "../ARRenderer";
import {ARObject} from "./ARObject";

/**
 * Data of a specific plane being managed in the Planes object.
 */
export class PlaneData 
{
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
 * 
 * Planes can be used for objects to cast shadows and for physics interaction.
 * 
 * More detail at https://immersive-web.github.io/real-world-geometry/plane-detection.html.
 */
export class Planes extends Group implements ARObject 
{
	public isARObject = true;
	
	/**
	 * ID counter.
	 */
	public static id = 0; 

	/**
	 * Shadow material, only renders shadow map.
	 */
	public material: Material = null;

	/**
	 * Map with all existing planes.
	 */
	public planes: Map<number, PlaneData> = new Map();

	/**
	 * Callback method called when a plane has been created.
	 */
	public onCreate: (data: PlaneData) => void = null;

	/**
	 * Callback method called when a plane is updated.
	 */
	public onUpdate: (data: PlaneData) => void = null;

	/**
	 * Callback method called when a plane is deleted.
	 */
	public onDelete: (data: PlaneData) => void = null;


	public constructor() 
	{
		super();

		this.material = new ShadowMaterial({opacity: 0.5});
		this.material = AugmentedMaterial.transform(this.material);
	}

	public beforeARUpdate(renderer: ARRenderer, time: number, frame: XRFrame) 
	{
		// @ts-ignore
		if (frame.detectedPlanes) 
		{
			// Delete planes that are no longer visible
			this.planes.forEach((planeData: PlaneData, plane: any) => 
			{
				// @ts-ignore
				if (!frame.detectedPlanes.has(plane)) 
				{
					// plane was removed
					this.planes.delete(plane);
					this.remove(planeData.mesh);

					if (this.onDelete)
					{
						this.onDelete(planeData);
					}
				}
			});

			// @ts-ignore
			frame.detectedPlanes.forEach((plane) => 
			{
				const planePose = frame.getPose(plane.planeSpace, renderer.xrReferenceSpace);

				let mesh: Mesh;
				
				// Existing plane (update)
				if (this.planes.has(plane)) 
				{
					const planeData = this.planes.get(plane);
					mesh = planeData.mesh;
					
					// Compare timestamp to check for updates
					if (planeData.timestamp < plane.lastChangedTime) 
					{
						planeData.timestamp = plane.lastChangedTime;
						const geometry = Planes.createGeometry(plane.polygon);
						planeData.mesh.geometry.dispose();
						planeData.mesh.geometry = geometry;

						if (this.onUpdate)
						{
							this.onUpdate(planeData);
						}
					}
				}
				// Create new plane
				else
				{
					const geometry = Planes.createGeometry(plane.polygon);
					mesh = new Mesh(geometry, this.material);
					mesh.castShadow = false;
					mesh.receiveShadow = true;
					mesh.matrixAutoUpdate = false;
					this.add(mesh);

					const data: PlaneData = {
						id: Planes.id++,
						timestamp: plane.lastChangedTime,
						mesh: mesh
					};

					this.planes.set(plane, data);
					
					if (this.onCreate)
					{
						this.onCreate(data);
					}
					

					Planes.id++;
				}
				
				if (planePose) 
				{
					mesh.visible = true;
					mesh.matrix.fromArray(planePose.transform.matrix);
				}
				else 
				{
					mesh.visible = false;
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
	public static createGeometry(polygon: Vector3[]): BufferGeometry 
	{
		const geometry = new BufferGeometry();

		const vertices = [];
		const uvs = [];

		polygon.forEach((point) => 
		{
			vertices.push(point.x, point.y, point.z);
			uvs.push(point.x, point.z);
		});

		const indices = [];
		for (let i = 2; i < polygon.length; i++) 
		{
			indices.push(0, i - 1, i);
		}

		geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
		geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
		geometry.setIndex(indices);

		return geometry;
	}
}
