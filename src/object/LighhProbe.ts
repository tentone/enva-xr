import {Group} from "three";
import {ARObject} from "./ARObject";
import {ARRenderer} from "ARRenderer";


export class LightProbe extends Group implements ARObject
{

	public isARObject: boolean = true;


	public beforeARUpdate(renderer: ARRenderer, time: number, frame: XRFrame): void {

	}	
}
