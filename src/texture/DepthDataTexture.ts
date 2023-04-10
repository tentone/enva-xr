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
	public constructor(width = 160, height = 90)
	{
		super(new Uint8Array(width * height), width, height, RGFormat, UnsignedByteType);

		this.magFilter = LinearFilter;
		this.minFilter = LinearFilter;
	}

	/**
	 * Update the texture with new depth data.
	 *
	 * Depth data is retrieved from the WebXR API.
	 *
	 * @param depthInfo
	 */
	public updateDepth(depthInfo: XRCPUDepthInformation): void
	{
		const dataBuffer = depthInfo.data;

		// @ts-ignore
		this.image.data = new Uint8Array(dataBuffer.buffer, dataBuffer.byteOffset, dataBuffer.byteLength);
		this.needsUpdate = true;
	}
}
