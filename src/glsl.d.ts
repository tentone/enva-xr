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

type XRLightProbe = any;


type XRDepthInformation = any;

type XRCPUDepthInformation = {
	data: ArrayBuffer,
	width: number,
	height: number,
	normDepthBufferFromNormView: XRRigidTransform,
	rawValueToMeters: number
	getDepthInMeters: (x: number, y: number) => number,
};

type XRGPUDepthInformation = any;
type XRWebGLDepthInformation = any;
