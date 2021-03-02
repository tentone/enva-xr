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
		this.reset(false);

		/**
		 * Indicates if the meter is active or not.
		 *
		 * It is set active on reset.
		 */
		this.active = false;

		/**
		 * List of values registered.
		 */
		this.values = [];

		/**
		 * Last value registered for comparison.
		 */
		this.last = null;

		/**
		 * Maximum value registered
		 */
		this.max = null;

		/**
		 * Minimum value registered
		 */
		this.min = null;

		/**
		 * Number of samples to take from the meter.
		 */
		this.samples = samples ? samples : 100;

		/**
		 * Function used to read measurement, by default performance.now is used.
		 */
		this.read = function() {return performance.now();};
	}

	/**
	 * Check if the meter is filled with values.
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
			var time = this.read();

			if (this.last !== null)
			{
				var delta = time - this.last;

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
