import {Box2, Box3, CanvasTexture, Matrix4, Vector2, Vector3, Vector4} from "three";

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
	 * Calculate a colorized pixel for depth visualization using turbo color map.
	 * 
	 * More information at https://ai.googleblog.com/2019/08/turbo-improved-rainbow-colormap-for.html
	 * 
	 * @param depth Normalized depth value.
	 * @returns Colorized depth using the turbo color map.
	 */
	public static turboColorMap(x: number): Vector3 
	{
		const kRedVec4 = new Vector4(0.55305649, 3.00913185, -5.46192616, -11.11819092);
		const kGreenVec4 = new Vector4(0.16207513, 0.17712472, 15.24091500, -36.50657960);
		const kBlueVec4 = new Vector4(-0.05195877, 5.18000081, -30.94853351, 81.96403246);
		const kRedVec2 = new Vector2(27.81927491, -14.87899417);
		const kGreenVec2 = new Vector2(25.95549545, -5.02738237);
		const kBlueVec2 = new Vector2(-86.53476570, 30.23299484);

		// Adjusts color space via 6 degree poly interpolation to avoid pure red.
		x = Math.min(Math.max(x * 0.9 + 0.03, 0.0), 1.0);
		const v4 = new Vector4( 1.0, x, x * x, x * x * x);
		const v2 = new Vector2(v4.z * v4.z, v4.w * v4.z);

		return new Vector3(
			v4.dot(kRedVec4) + v2.dot(kRedVec2),
			v4.dot(kGreenVec4) + v2.dot(kGreenVec2),
			v4.dot(kBlueVec4) + v2.dot(kBlueVec2)
		);
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

		// Box to check wich depth data is inside screen coordinates.
		const box = new Box2(new Vector2(depthData.width, depthData.height), new Vector2(0, 0));

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

				if (x < box.min.x) {box.min.x = x;}
				if (y < box.min.y) {box.min.y = y;}
				if (x > box.max.x) {box.max.x = x;}
				if (y > box.max.y) {box.max.y = y;}

				const depth = depthData.getDepthInMeters(coords.x, coords.y);

				// Transform distance into values inside of the [near, far] range.
				let depthNorm = (depth - near) / (far - near);
				if (depthNorm > 1.0) {depthNorm = 1.0;}
				else if (depthNorm < 0.0) {depthNorm = 0.0;}

				// Display depth information as RGB
				const idx = (y * depthData.width + x) * 4;

				const color = DepthCanvasTexture.turboColorMap(depthNorm);
				this.imageData.data[idx] = Math.ceil(color.x * 256);
				this.imageData.data[idx + 1] = Math.ceil(color.y * 256);
				this.imageData.data[idx + 2] = Math.ceil(color.z * 256);
				this.imageData.data[idx + 3] = 255;
			}
		}
		
		// console.log('enva-xr: Depth box is ', box, depthData);

		// Update canvas content
		this.context.putImageData(this.imageData, 0, 0);
		this.needsUpdate = true;
	}

}
