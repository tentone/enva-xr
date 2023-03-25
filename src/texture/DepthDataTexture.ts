import {DataTexture, RGFormat, UnsignedByteType, LinearFilter} from "three";

/**
 * Stores the raw depth values in a 16 bit value packed texture.
 *
 * The distance to the camera is stored in millimeters.
 *
 * This depth has to be unpacked in shader and multiplied by the normalization matrix to obtain rectified UV coordinates.
 */
export class DepthDataTexture extends DataTexture
{
	constructor()
	{
		let width = 160;
		let height = 90;
		let data = new Uint8Array(width * height);

		super(data, width, height, RGFormat, UnsignedByteType);

		this.magFilter = LinearFilter;
		this.minFilter = LinearFilter;
	}

	/**
	 * Update the texture with new depth data.
	 *
	 * Depth data is retrieved from the WebXR API.
	 *
	 * @param {*} depthInfo
	 */
	updateDepth(depthInfo)
	{
		let dataBuffer = depthInfo.data;
		this.image.data = new Uint8Array(dataBuffer.buffer, dataBuffer.byteOffset, dataBuffer.byteLength);
		this.needsUpdate = true;
	}
}
