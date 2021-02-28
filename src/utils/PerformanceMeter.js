/**
 * Auxiliary tools to measure performance of the application.
 *
 * Ticks measurements between frames and provides metrics from the times measured.
 *
 * Can also be used to measure specific time deltas.
 */
export class PerformanceMeter
{
	constructor(samples)
	{
		this.reset();

		this.values = [];

		this.last = null;

		this.max = null;

		this.min = null;

		this.samples = samples ? samples : 1000;
	}

	/**
	 * Tick a clean measurement
	 */
	tick()
	{
		this.last = performance.now();
	}

	/**
	 * Finish measurement and add it to the list of measurements.
	 *
	 * Tock can be used by itselt to measure times by being called multiple times.
	 */
	tock()
	{
		var time = performance.now();
		var delta = time - this.last;

		if (this.values.length < this.samples)
		{
			if (this.max === null || delta > max)
			{
				this.max = delta;
			}

			if (this.min === null || delta < min)
			{
				this.min = delta;
			}

			this.values.push(delta);
		}

		this.last = time;
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
	reset()
	{
		this.values = [];
		this.last = null;
		this.max = Infinity;
		this.min = -Infinity;
	}
}
