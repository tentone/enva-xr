import {ARRenderer} from "ARRenderer";

/**
 * Interface to indicate that the object is an AR object.
 */
export interface ARObject
{
    /**
     * Set true for AR objects.
     */
    isARObject: boolean;

    /**
     * Called before the scene is rendered in AR.
     * 
     * @param renderer - AR renderer instance.
     * @param frame - XR frame
     */
    beforeARUpdate(renderer: ARRenderer, time: number, frame: XRFrame)
}
