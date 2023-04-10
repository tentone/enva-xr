/**
 * EventManager is used to manage DOM events from multiple element.
 *
 * Events can be created for multiple DOM objects and managed from a single point.
 */
export class EventManager 
{
	/**
	 * Stores all events in the manager, their target and callback.
	 *
	 * Format [target, event, callback, active]
	 */
	private events: [any, string, Function, boolean][] = [];

	/**
	 * Add new event to the manager, the event is not created immediately the create() method had to be called to create the event.
	 *
	 * @param target - Event target element.
	 * @param event - Event name.
	 * @param callback - Callback function.
	 */
	public add(target: any, event: string, callback: Function): void 
	{
		this.events.push([target, event, callback, false]);
	}

	/**
	 * Add and create and event to the event manager.
	 *
	 * Creates the event and attaches it to the DOM element immediately.
	 *
	 * @param target - Event target element.
	 * @param event - Event name.
	 * @param callback - Callback function.
	 */
	public addAndCreate(target: any, event: string, callback: Function): void 
	{
		target.addEventListener(event, callback);
		this.events.push([target, event, callback, true]);
	}

	/**
	 * Destroys this manager and remove all events.
	 */
	public clear(): void 
	{
		this.destroy();
		this.events = [];
	}

	/**
	 * Remove and destroy event(s) from a DOM element and from the manager.
	 *
	 * @param target - Event target element to remove elements from.
	 * @param event - Event name to be removed.
	 */
	public remove(target: any, event: string): void 
	{
		for (let i = this.events.length - 1; i >= 0; i--) 
		{
			// Check if the target and event matches
			if (this.events[i][0] === target && this.events[i][1] === event) 
			{
				// Destroy event if it is active
				if (this.events[i][3]) 
				{
					this.events[i][0].removeEventListener(this.events[i][1], this.events[i][2]);
					this.events[i][3] = false;
				}

				this.events.splice(i, 1);
			}
		}
	}

	/**
	 * Creates all events in this manager.
	 */
	public create(): void 
	{
		for (let i = 0; i < this.events.length; i++) 
		{
			const event = this.events[i];
			event[0].addEventListener(event[1], event[2]);
			event[3] = true;
		}
	}

	/**
	 * Removes all events in this manager.
	 */
	public destroy(): void 
	{
		for (let i = 0; i < this.events.length; i++) 
		{
			const event = this.events[i];
			event[0].removeEventListener(event[1], event[2]);
			event[3] = false;
		}
	}
}
