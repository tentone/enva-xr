import {Vec3, Box, Body, World} from "cannon-es";

/**
 * Voxel landscape can be used to represent voxel based enviroment.
 */
export class VoxelLandscape
{
	public nx = 0;

	public ny = 0;

	public nz = 0;

	public sx = 0;

	public sy = 0;

	public sz = 0;

	public world: World = null;

	public map: any[] = [];

	public boxified: any[] = [];

	public boxes: any[] = [];

	public boxShape: Box = null;

	/**
	 * Constructor for the voxel landscape.
	 *
	 * The user must manually update the map for the first time.
	 *
	 * @param {World} world Physics world where the voxel landscape will be used.
	 * @param {number} nx Amount of voxels in X.
	 * @param {number} ny Amount of voxels in Y.
	 * @param {number} nz Amount of voxels in Z.
	 * @param {number} sx Size of the lanscape X.
	 * @param {number} sy Size of the lanscape Y.
	 * @param {number} sz Size of the lanscape Z.
	 */
	public constructor(world, nx, ny, nz, sx, sy, sz)
	{
		this.nx = nx;
		this.ny = ny;
		this.nz = nz;

		this.sx = sx;
		this.sy = sy;
		this.sz = sz;

		this.world = world;
		this.boxShape = new Box(new Vec3(sx*0.5, sy*0.5, sz*0.5));

		let map = this.map;
		let boxified = this.boxified;

		// Prepare map
		for (let i=0; i!==nx; i++)
		{
			for (let j=0; j!==ny; j++)
			{
				for (let k=0; k!==nz; k++)
				{
					map.push(true);
					boxified.push(false);
				}
			}
		}
	}

	/**
	 * Get the index of a voxel stored in the list from its coordinates.
	 *
	 * @param {number} xi X coordinate.
	 * @param {number} yi Y coordinate.
	 * @param {number} zi Z coordinate.
	 * @returns Return the index of the voxel from its coordinates.
	 */
	getBoxIndex(xi, yi, zi)
	{
		let nx = this.nx;
		let ny = this.ny;
		let nz = this.nz;

		if (xi >= 0 && xi < nx && yi >= 0 && yi < ny && zi >= 0 && zi < nz)
		{
			return xi + nx * yi + nx * ny * zi;
		}

		return -1;
	}

	/**
	 * Set the filled state of a position in the voxel volume.
	 *
	 * @param {number} xi X coordinate.
	 * @param {number} yi Y coordinate.
	 * @param {number} zi Z coordinate.
	 * @param {boolean} filled State to be set.
	 */
	setFilled(xi, yi, zi, filled)
	{
		let i = this.getBoxIndex(xi, yi, zi);
		if (i!==-1)
		{
			this.map[i] = Boolean(filled);
		}
	}

	/**
	 * Check if a position is already occupied.
	 *
	 * @param {number} xi X coordinate.
	 * @param {number} yi Y coordinate.
	 * @param {number} zi Z coordinate.
	 * @returns True if the coordinate is filled, false otherwise.
	 */
	isFilled(xi, yi, zi)
	{
		let i = this.getBoxIndex(xi, yi, zi);
		return i !== -1 ? this.map[i] : false;
	}

	/**
	 * Check if a voxel position is boxified.
	 *
	 * @param {number} xi X coordinate.
	 * @param {number} yi Y coordinate.
	 * @param {number} zi Z coordinate.
	 */
	isBoxified(xi, yi, zi)
	{
		let i = this.getBoxIndex(xi, yi, zi);
		return i!==-1 ? this.boxified[i] : false;
	}

	/**
	 * Set the boxified status of a specific voxel.
	 *
	 * @param {number} xi X coordinate.
	 * @param {number} yi Y coordinate.
	 * @param {number} zi Z coordinate.
	 * @param {boolean} boxified Boxified status to be set.
	 * @returns The boxified status set in the position.
	 */
	setBoxified(xi, yi, zi, boxified)
	{
		return this.boxified[this.getBoxIndex(xi, yi, zi)] = Boolean(boxified);
	}

	/**
	 * Updates boxes has to be called manually after everychange to the voxel landscape.
	 *
	 * Should not be called in the main loop it takes a while to update.
	 */
	public update(): void
	{
		let boxes = this.boxes;
		let world = this.world;
		let boxified = this.boxified;
		let nx = this.nx;
		let ny = this.ny;
		let nz = this.nz;

		// Remove all old boxes
		for (let i = 0; i!== boxes.length; i++)
		{
			world.removeBody(boxes[i]);
		}

		boxes.length = 0;

		// Set whole map to unboxified
		for (let i = 0; i !== boxified.length; i++)
		{
			boxified[i] = false;
		}

		while (true)
		{
			let box;

			// 1. Get a filled box that we haven't boxified yet
			for (let i=0; !box && i<nx; i++)
			{
				for (let j=0; !box && j<ny; j++)
				{
					for (let k=0; !box && k<nz; k++)
					{
						if (this.isFilled(i, j, k) && !this.isBoxified(i, j, k))
						{
							box = new Body({mass: 0});
							box.xi = i; // Position
							box.yi = j;
							box.zi = k;
							box.nx = 0; // Size
							box.ny = 0;
							box.nz = 0;
							this.boxes.push(box);
						}
					}
				}
			}

			// 2. Check if we can merge it with its neighbors
			if (box)
			{
				// Check what can be merged
				let xi = box.xi;
				let yi = box.yi;
				let zi = box.zi;

				box.nx = nx; // merge=1 means merge just with the self box
				box.ny = ny;
				box.nz = nz;

				// Merge in x
				for (let i=xi; i<nx+1; i++)
				{
					if (!this.isFilled(i, yi, zi) || this.isBoxified(i, yi, zi) && this.getBoxIndex(i, yi, zi)!==-1)
					{
						// Can't merge this box. Make sure we limit the mergeing
						box.nx = i-xi;
						break;
					}
				}

				// Merge in y
				let found = false;
				for (let i=xi; !found && i<xi+box.nx; i++)
				{
					for (let j=yi; !found && j<ny+1; j++)
					{
						if (!this.isFilled(i, j, zi) || this.isBoxified(i, j, zi) && this.getBoxIndex(i, j, zi)!==-1)
						{
							// Can't merge this box. Make sure we limit the mergeing
							if (box.ny>j-yi) {box.ny = j-yi;}
						}
					}
				}

				// Merge in z
				found = false;
				for (let i=xi; !found && i<xi+box.nx; i++)
				{
					for (let j=yi; !found && j<yi+box.ny; j++)
					{
						for (let k=zi; k<nz+1; k++)
						{
							if (!this.isFilled(i, j, k) || this.isBoxified(i, j, k) && this.getBoxIndex(i, j, k)!==-1)
							{
								// Can't merge this box. Make sure we limit the mergeing
								if (box.nz>k-zi) {box.nz = k-zi;}
							}
						}
					}
				}

				if (box.nx === 0) {box.nx = 1;}
				if (box.ny === 0) {box.ny = 1;}
				if (box.nz === 0) {box.nz = 1;}

				// Set the merged boxes as boxified
				for (let i=xi; i<xi+box.nx; i++)
				{
					for (let j=yi; j<yi+box.ny; j++)
					{
						for (let k=zi; k<zi+box.nz; k++)
						{
							if ( i >= xi && i <= xi+box.nx && j >= yi && j <= yi + box.ny && k >= zi && k <= zi + box.nz)
							{
								this.setBoxified(i, j, k, true);
							}
						}
					}
				}

				box = false;
			}
			else
			{
				break;
			}
		}

		// Set box positions
		let sx = this.sx;
		let sy = this.sy;
		let sz = this.sz;

		for (let i=0; i<this.boxes.length; i++)
		{
			let b = this.boxes[i];

			b.position.set(
				b.xi * sx + b.nx*sx*0.5,
				b.yi * sy + b.ny*sy*0.5,
				b.zi * sz + b.nz*sz*0.5
			);

			// Replace box shapes
			b.addShape(new Box(new Vec3(b.nx*sx*0.5, b.ny*sy*0.5, b.nz*sz*0.5)));
			b.aabbNeedsUpdate = true;
			world.addBody(b);
		}
	}
}
