import os
import numpy as np
import pandas as pd
from contextlib import suppress
from py_mini_racer import py_mini_racer


class Score(dict):
	def __missing__(self, key):
		return 0


def info(tokens):
	score = Score()

	for token in tokens:
		score[f'{chr(token[0])}{len(token)}'] += 1

	print(*(f'{k}:{v}' for [k, v] in score.items()), sep='  ')


def tokenize(raw):
	headers, = np.where(raw > 96)
	assert headers[0] == 0
	tokens = list(raw[s:e] for [s, e] in zip(headers[:-1], headers[1:]))
	tokens.append(raw[headers[-1]:])
	return tokens


def purge(header, length):
	return lambda token: (token[0] != header) or (len(token) != length)


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


def compare_parsed(ori, new):
	if (ori == new):
		print('\033[32mOK\033[0m')
	else:
		print('\033[33mUnequal\033[0m')
		for key in ori.keys():
			if ori[key] == new[key]:
				print(f'{key} OK')
			else:
				print(f'{key}, old({len(ori[key]["date"])}) new({len(new[key]["date"])})')

				for key2 in ori[key].keys():
					if key2[0] == '_':
						continue

					if ori[key][key2] == new[key][key2]:
						print(f'  {key2} OK')
					else:
						print(f'  {key2}, old({len(ori[key][key2])}) new({len(new[key][key2])})')
	return ori == new


if __name__ == '__main__':
	parser = parse_factory()

	for file in sorted(os.listdir('src')):
		print(f'\033[35;1m{file}\033[0m')

		with open(f'src/{file}', 'br') as fid:
			txt = fid.read()

		tokens = tokenize(np.frombuffer(txt, np.uint8))
		info(tokens)

		old = parser.call('parse', txt.decode())[1]

		tokens = list(filter(purge(ord('c'), 8), tokens))
		tokens = list(filter(purge(ord('x'), 9), tokens))

		new_t = b''.join(tokens)
		new = parser.call('parse', new_t.decode())[1]

		info(tokens)
		compare_parsed(old, new)

		with open(f'trg/{file}', 'bw') as fid:
			fid.write(b''.join(tokens))
