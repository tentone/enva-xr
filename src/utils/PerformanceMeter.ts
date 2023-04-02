/**
 * Auxiliary tools to measure performance of the application.
 *
 * Ticks measurements between frames and provides metrics from the times measured.
 *
 * Can also be used to measure specific time deltas.
 */
export class PerformanceMeter
{
	/**
	 * Indicates if the meter is active or not.
	 *
	 * It is set active on reset.
	 */
	public active = false;

	/**
	 * List of values registered.
	 */
	public values: number[] = [];

	/**
	 * Last value registered for comparison.
	 */
	public last: number = null;

	/**
	 * Maximum value registered
	 */
	public max: number = null;

	/**
	 * Minimum value registered
	 */
	public min: number = null;

	/**
	 * Number of samples to take from the meter.
	 */
	public samples = 0;

	/**
	 * Function used to read measurement, by default performance.now is used.
	 */
	public read: () => number = function() 
	{
		return performance.now();
	};

	/**
	 * @param samples - Number of samples to read performance metrics. 
	 */
	public constructor(samples = 100)
	{
		this.reset(false);

		this.samples = samples;
	}

	/**
	 * Check if the meter is filled with values.
	 * 
	 * @returns {boolean} - True if the performance metris where acquired. 
	 */
	finished()
	{
		return this.values.length >= this.samples && !this.active;
	}

	/**
	 * Tick a clean measurement
	 */
	tick()
	{
		this.last = this.read();
	}

	/**
	 * Finish measurement and add it to the list of measurements.
	 *
	 * Tock can be used by itselt to measure times by being called multiple times.
	 */
	tock()
	{
		if (this.active)
		{
			let time = this.read();

			if (this.last !== null)
			{
				let delta = time - this.last;

				if (this.values.length < this.samples)
				{
					if (this.max === null || delta > this.max)
					{
						this.max = delta;
					}

					if (this.min === null || delta < this.min)
					{
						this.min = delta;
					}

					this.values.push(delta);
				}
				else
				{
					this.active = false;
				}
			}

			this.last = time;
		}
	}

	/**
	 * Get stats from the performance meter.
	 */
	stats()
	{
		return {
			max: this.max,
			min: this.min,
			average: this.average()
		};
	}

	/**
	 * Get the average value from all samples in the performance meter.
	 */
	average()
	{
		return this.values.reduce(function(a, b) {return a + b;}, 0) / this.values.length;
	}

	/**
	 * Reset the performance meter.
	 */
	reset(active)
	{
		this.active = active !== undefined ? active : true;
		this.values = [];
		this.last = null;
		this.max = null;
		this.min = null;
	}
}
