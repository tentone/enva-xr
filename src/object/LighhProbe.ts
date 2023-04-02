import {Group} from "three";
import {ARRenderer} from "ARRenderer";
import {ARObject} from "./ARObject";


export class LightProbe extends Group implements ARObject
{

	public isARObject = true;


	public beforeARUpdate(renderer: ARRenderer, time: number, frame: XRFrame): void 
	{

	}	
}
