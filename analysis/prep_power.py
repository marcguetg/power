from load_data import load
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import numpy as np
import pandas as pd
import numba


def get_range(array):
	if array.size:
		return array[0], array[-1]
	else:
		return np.inf, -np.inf


def get_daterange(a, b, steps):
	min_a, max_a = get_range(a)
	min_b, max_b = get_range(b)
	return np.arange(min(min_a, min_b), max(max_a, max_b), 60)


# @numba.njit
def merge_power(data):
	date = []
	consumption = []
	solar = []

	for day in data.values():
		solar_start_i = 0
		consumption_start_i = 0

		solar_date = day['solar']['date'].to_numpy()
		consumption_date = day['consumption']['date'].to_numpy()
		solar_power = day['solar']['Power [W]'].to_numpy()

		times = get_daterange(consumption_date, solar_date, 60)
		date.extend(times)

		for t0 in times:
			for i in range(solar_start_i, len(solar_date)):
				if solar_date[i] > t0:
					solar.append(np.mean(solar_power[solar_start_i:i]))
					solar_start_i = i
					break
			else:
				solar.append(0)

			for i in range(consumption_start_i, len(consumption_date)):
				if consumption_date[i] > t0:
					consumption.append((i - consumption_start_i) / 10000 * 60 * 1000)
					consumption_start_i = i
					break
			else:
				consumption.append(0)

		# break

	return pd.DataFrame({'date': date, 'consumption': consumption, 'production': solar})


def add_power_management(data, batter_capacity):
	batter_capacity *= 1000 * 60

	power_balance = data['production'] - data['consumption']
	buy = np.zeros_like(power_balance)
	sell = np.zeros_like(power_balance)
	battery = np.zeros_like(power_balance)
	battery_now = 0

	for (i, power) in enumerate(power_balance):
		if np.isnan(power):
			continue

		if power > 0:
			if (battery_now + power) > batter_capacity:
				sell[i] = power
			else:
				battery_now += power
		else:
			if (battery_now + power) < 0:
				buy[i] = power
			else:
				battery_now += power
		battery[i] = battery_now

	data['power balance'] = power_balance
	data['buy'] = buy
	data['sell'] = sell
	data['battery'] = battery / (1000 * 60)


def run_prep_power():
	data = load('../data/', False)

	power = merge_power(data)
	battery_capacity = 10
	add_power_management(power, battery_capacity)

	ax = plt.subplots(nrows=3, figsize=(15, 7), sharex=True)[1]

	# ax.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M:%S'))

	# for (i, (key, day)) in enumerate(reversed(data.items())):
	# 	day['solar'].plot('date', 'Power [W]', ax=ax, label=key)
	# 	day['consumption'].plot('date', 'Power [W]', ax=ax, label=key)

	power.plot('date', 'production', ax=ax[0])
	power.plot('date', 'consumption', ax=ax[0])
	power.plot('date', 'power balance', ax=ax[1])
	power.plot('date', 'buy', ax=ax[1], label=f"Bought {int(-power['buy'].sum()/power['consumption'].sum() * 100)}%")
	power.plot('date', 'sell', ax=ax[1], label=f"Sold {int(power['sell'].sum()/power['production'].sum() * 100)}%")
	power.plot('date', 'battery', ax=ax[2])
	ax[2].axhline(y=battery_capacity, color='r', linestyle=':')

	ax[0].grid()
	ax[1].grid()
	ax[2].grid()
	plt.show(block=False)


if __name__ == '__main__':
	run_prep_power()
