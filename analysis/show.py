#!/usr/bin/env python

import matplotlib.pyplot as plt
from matplotlib.dates import DateFormatter
import numpy as np
from datetime import datetime
import json



def plot_meta_data(data):
	plt.plot(data)


def plot_general(data):
	_, ax = plt.subplots(4, sharex=True)
	ax[0].plot(data['date'], data['power'])
	ax[1].plot(data['date'], data['voltage'])
	ax[2].plot(data['date'], data['frequency'])
	ax[3].plot(data['date'][1:], data['date'][1:] - data['date'][:-1])
	ax[-1].xaxis.set_major_formatter(DateFormatter("%d.%m %H:%M:%S"))


if __name__ == '__main__':
	data = json.load(open('power.json'))
	for [key, value] in data.items():
		data[key] = np.array(value)

	data['date'] = np.array(data['date'], dtype='datetime64[s]')
	print(data)

	plot_general(data)

	# print(data)
	# data.info()
	plt.show(block=False)
