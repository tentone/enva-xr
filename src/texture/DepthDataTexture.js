import {DataTexture, LuminanceAlphaFormat, UnsignedByteType, NearestFilter, LinearFilter} from "three";

/**
 * Stores the raw depth values in a 16 bit value packed texture.
 *
 * The distance to the camera is stored in millimeters.
 */
export class DepthDataTexture extends DataTexture
{
	constructor()
	{
		var width = 160;
		var height = 90;
		var data = new Uint8Array(width * height);

		super(data, width, height, LuminanceAlphaFormat, UnsignedByteType);

		this.magFilter = LinearFilter;
		this.minFilter = LinearFilter; // LinearFilter
	}

	/**
	 * Update the texture with new depth data.
	 *
	 * Depth data is retrieved from the WebXR API.
	 *
	 * @param {*} depthData
	 */
	updateDepth(depthData)
	{
		var dataBuffer = depthData.data;
		this.image.data = new Uint8Array(dataBuffer.buffer, dataBuffer.byteOffset, dataBuffer.byteLength);
		this.needsUpdate = true;
	}
}
