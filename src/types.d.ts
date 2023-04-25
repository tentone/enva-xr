declare module "*.glsl" {
	const value: string;
	export default value;
}

declare module "*.vs" {
	const value: string;
	export default value;
}

declare module "*.fs" {
	const value: string;
	export default value;
}

export type XRLightProbe = any;


export type XRDepthInformation = any;

export type XRCPUDepthInformation = {
	data: ArrayBuffer,
	width: number,
	height: number,
	normDepthBufferFromNormView: XRRigidTransform,
	rawValueToMeters: number
	getDepthInMeters: (x: number, y: number) => number,
};

export type XRGPUDepthInformation = any;
export type XRWebGLDepthInformation = any;
