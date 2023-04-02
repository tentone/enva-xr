import {AmbientLightProbe, DirectionalLight, Group, Vector3} from "three";
import {ARRenderer} from "ARRenderer";
import {ARObject} from "./ARObject";

/**
 * Light probe can be used to cast light the mirror the lighting conditions in real world.
 */
export class LightProbe extends Group implements ARObject
{
	/**
	 * Directional shadow casting light.
	 */
	public directionalLight: DirectionalLight = null;

	/**
	 * Light probe object using spherical harmonics.
	 */
	public lightProbe: AmbientLightProbe = null;

	public isARObject = true;

	public constructor() {
		super();

		this.directionalLight = new DirectionalLight();
		this.directionalLight.castShadow = true;
		this.directionalLight.shadow.mapSize.set(1024, 1024);
		this.directionalLight.shadow.camera.far = 20;
		this.directionalLight.shadow.camera.near = 0.1;
		this.directionalLight.shadow.camera.left = -5;
		this.directionalLight.shadow.camera.right = 5;
		this.directionalLight.shadow.camera.bottom = -5;
		this.directionalLight.shadow.camera.top = 5;
		this.add(this.directionalLight);

		this.lightProbe = new AmbientLightProbe();
		this.add(this.lightProbe);
	}

	public beforeARUpdate(renderer: ARRenderer, time: number, frame: XRFrame): void 
	{
		// Process lighting condition from probe
		if (renderer.xrLightProbe)
		{
			// @ts-ignore
			let lightEstimate = frame.getLightEstimate(renderer.xrLightProbe);
			if (lightEstimate)
			{
				let directionalPosition = new Vector3(lightEstimate.primaryLightDirection.x, lightEstimate.primaryLightDirection.y, lightEstimate.primaryLightDirection.z);
				directionalPosition.multiplyScalar(5);

				let intensity = Math.max(1.0, Math.max(lightEstimate.primaryLightIntensity.x, Math.max(lightEstimate.primaryLightIntensity.y, lightEstimate.primaryLightIntensity.z)));
				this.directionalLight.position.copy(directionalPosition);
				this.directionalLight.color.setRGB(lightEstimate.primaryLightIntensity.x / intensity, lightEstimate.primaryLightIntensity.y / intensity, lightEstimate.primaryLightIntensity.z / intensity);
				this.directionalLight.intensity = intensity;

				this.lightProbe.sh.fromArray(lightEstimate.sphericalHarmonicsCoefficients);
			}
		}

	}	
}
