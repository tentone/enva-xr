import {Body} from "cannon-es";

export class VoxelBody extends Body
{
	/**
	 * Indicates if the body is enabled of disabled.
	 */
	public active = false;

	/**
	 * Voxel enviroment manager to wich this voxel body belongs.
	 */
	public manager = null;

	/**
	 * Current probability of this voxel belonging to the enviroment.
	 */
	public probability = 0.0;

	public constructor(manager: any, x: number, y: number, z: number)
	{
		super();

		this.manager = manager;

		this.type = Body.STATIC;
		this.position.set(x, y, z);
		this.velocity.set(0, 0, 0);
		this.addShape(this.manager.shape);
	}

	/**
	 * Update the voxel internal probability.
	 *
	 * If the probability of the voxels goes bellow the threshold the voxel is deactivated.
	 *
	 * @param {number} hit If the 1 the voxel is occupied by depth, otherwise is not occupied. A value inbetween can be used for antialiasing like calculation.
	 * @param {number} factor The update factor based on the the time elapsed between frames and the update probability
	 */
	public update(hit: number, factor: number): void
	{
		this.probability = this.probability * (1 - factor) + factor * hit;

		if (this.probability > 1)
		{
			this.probability = 1.0;
		}
		else if (this.probability < 0)
		{
			this.probability = 0.0;
		}

		this.active = this.probability > this.manager.threshold;
	}
}
