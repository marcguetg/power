import os
import numpy as np
import pandas as pd
import pickle
import time
from py_mini_racer import py_mini_racer


def parse_factory():
	with open('../docs/parse.js') as fid:
		src = fid.read()

	ctx = py_mini_racer.MiniRacer()
	ctx.eval('''
		class TextEncoder {
		  encode(raw) {
		  	return [...Array(raw.length).keys()].map(i => raw.charCodeAt(i))
		  }
		}
	''')
	ctx.eval(src)
	return ctx


def load_folder(path):
	parser = parse_factory()

	for file in sorted(os.listdir(path)):
		if file[0] == '2':
			with open(f'{path}/{file}') as fid:
				print(file, end='\r')
				yield (file, parser.call('parse', fid.read()))


def parse(obj):
	sol = obj[1]['solar']
	con = obj[1]['power_unten']

	return {
		'status': obj[0],
		'solar': pd.DataFrame({
			'date': np.array(sol['date']),
			'Power [W]': np.array(sol['power']),
			'Voltage [V]': np.array(sol['voltage']),
			'Frequency [Hz]': np.array(sol['frequency'])
		}),
		'consumption': pd.DataFrame({
			'date': np.array(con['date']),
			'Power [W]': np.array(con['power']),
		})
	}


def load_and_parse(path):
	return {key: parse(raw) for key, raw in load_folder(path)}
	# for key, obj in load_folder(path):
	# 	# print(obj)
	# 	a = parse(obj)
	# 	print(a)
	# 	break


def load_file(path):
	parser = parse_factory()

	with open(f'{path}') as fid:
		return parser.call('parse', fid.read())


def load(path, deep_load):
	if deep_load:
		data = load_and_parse(path)
		with open(path + 'file.pkl', 'wb') as fid:
			pickle.dump(data, fid)
		return data
	else:
		with open(path + 'file.pkl', 'rb') as fid:
			return pickle.load(fid)


if __name__ == '__main__':
	t0 = time.time()
	data = load('../data/', True)
	print(time.time() - t0)
