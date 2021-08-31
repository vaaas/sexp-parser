const fs = require('fs')

const StopIteration = Symbol()
const inside = xs => x => xs.includes(x)
const outside = xs => x => !xs.includes(x)
const whitespace = ' \n\t\r'

function unexpected_token(x) { throw `unexpected token at ${x.i}: ${x.x[x.i-1]}` }
function end_of_stream() { throw 'unexpected end of stream' }

class Stream {
	constructor(x) {
		this.len = x.length
		this.x = x
		this.i = 0
	}

	next() { return this.done() ? StopIteration : this.x[this.i++] }
	done() { return this.i >= this.len }
	revert(i=1) { this.i -= i ; return this }

	until(f) {
		while(!this.done()) {
			const x = this.next()
			if (f(x)) return x
		}
		return StopIteration
	}
}

function parse(x) {
	const tree = []
	const stream = new Stream(x)
	while (true) {
		const x = parse_sexp(stream)
		if (x === StopIteration) return tree
		else tree.push(x)
	}
}

function parse_sexp(xs) {
	const x = xs.until(outside(whitespace))
	switch(x) {
		case StopIteration:
			return StopIteration
			break
		case '(':
			return parse_expression(xs)
			break
		case ')':
			unexpected_token(xs)
			break
		default:
			xs.revert()
			return parse_atom(xs)
			break
	}
}

function parse_expression(xs) {
	const exp = []
	while (true) {
		const x = xs.until(outside(whitespace))
		switch(x) {
			case StopIteration:
				end_of_stream()
				break
			case '(':
				exp.push(parse_expression(xs))
				break
			case ')':
				return exp
				break
			default:
				xs.revert()
				exp.push(parse_atom(xs))
				break
		}
	}
}

function parse_atom(xs) {
	const atom = []
	while (true) {
		const x = xs.next()
		if (whitespace.includes(x) || x === StopIteration)
			break
		else if (x === '(' || x === ')') {
			xs.revert()
			break
		} else if (x === '\\') {
			const y = xs.next()
			if (y === StopIteration) end_of_stream()
			else atom.push(y)
		} else atom.push(x)
	}
	return atom.join('')
}

module.exports = console.log(parse(fs.readFileSync(0).toString()))
