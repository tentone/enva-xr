import {DataTexture, RGBFormat} from "three";

/**
 * Stores the raw depth values in a 16 bit value packed texture.
 *
 * The distance to the camera is stored in millimeters.
 */
export class DepthDataTexture extends DataTexture
{
	constructor(width, height) {
		const size = width * height;
		const data = new Uint8Array(3 * size);

		super(data, width, height, RGBFormat);
	}

	updateDepth(depth)
	{

	}

}
