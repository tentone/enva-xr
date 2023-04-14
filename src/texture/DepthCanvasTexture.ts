import {CanvasTexture, Matrix4, Vector3} from "three";

/**
 * Canvas texture to stored depth data obtained from the WebXR API.
 * 
 * The data will be processed using CPU and is expected to be slow.
 */
export class DepthCanvasTexture extends CanvasTexture
{
	/**
	 * Image data to draw information into the canvas.
	 */
	public imageData: ImageData = null;

	/**
	 * Canvas 2D rendering context.
	 */
	public context: CanvasRenderingContext2D = null;

	public constructor(canvas: HTMLCanvasElement | OffscreenCanvas)
	{
		super(canvas);

		this.context = this.image.getContext("2d", {willReadFrequently: true});
	}

	/**
	 * Draw depth data to a canvas, also sets the size of the canvas.
	 *
	 * Uses the camera planes to correctly adjust the values.
	 * 
	 * @param depthData - Depth info obtained from XR.
	 * @param near - Near plane of camera.
	 * @param far - Far plane of camera.
	 */
	public updateDepth(depthData: XRCPUDepthInformation, near: number, far: number): void
	{
		// Adjust size of the canvas to match depth information
		const canvas = this.image;
		if (canvas.width !== depthData.width || canvas.height !== depthData.height)
		{
			canvas.width = depthData.width;
			canvas.height = depthData.height;
		}

		// Get image data
		if (!this.imageData) 
		{
			this.imageData = this.context.createImageData(depthData.width, depthData.height, {colorSpace: "srgb"});
		}
		
		// Matrix to transform normalized coord into view coordinates
		const viewFromNorm: Matrix4 = new Matrix4().fromArray(depthData.normDepthBufferFromNormView.inverse.matrix);
		const inverseDepth = new Vector3(1.0 / depthData.width, 1.0 / depthData.height, 0.0);

		for (let x = 0; x < depthData.width; x++)
		{
			for (let y = 0; y < depthData.height; y++)
			{	
				const coords = new Vector3(x, y, 0);
				coords.multiply(inverseDepth);
				coords.applyMatrix4(viewFromNorm);

				if (coords.x < 0.0 || coords.x > 1.0 || coords.y < 0.0 || coords.y > 1.0) 
				{
					continue;
				}
				
				const depth = depthData.getDepthInMeters(coords.x, coords.y);

				// Transform distance into values inside of the [near, far] range.
				let distance = (depth - near) / (far - near);
				if (distance > 1.0) {distance = 1.0;}
				else if (distance < 0.0) {distance = 0.0;}

				// Display depth information as RGB
				const idx = (x * depthData.width + (depthData.width - y)) * 4;
				this.imageData.data[idx] = Math.ceil(distance * 256);
				this.imageData.data[idx + 1] = Math.ceil(distance * 256);
				this.imageData.data[idx + 2] = Math.ceil(distance * 256);
				this.imageData.data[idx + 3] = 255;
			}
		}

		// Update canvas content
		this.context.putImageData(this.imageData, 0, 0);
		this.needsUpdate = true;
	}

}
