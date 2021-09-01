const fs = require('fs')

const StopIteration = Symbol()
const inside = xs => x => xs.includes(x)
const outside = xs => x => !xs.includes(x)
const whitespace = ' \n\t\r'
const K = x => () => x
const any_symbol = K(true)

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

	expect(f) {
		const x = this.next()
		if (x === StopIteration) end_of_stream()
		else if (f(x)) return x
		else unexpected_token(x)
	}

	until(f, err=true) {
		while(!this.done()) {
			const x = this.next()
			if (f(x)) return x
		}
		if (err) end_of_stream()
		else return StopIteration
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
	const x = xs.until(outside(whitespace), false)
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
	const x = xs.next()
	if (x === '"') return parse_string(xs)
	else {
		xs.revert()
		return parse_symbol(xs)
	}
}

function parse_string(xs) {
	const atom = []
	while(true) {
		const x = xs.expect(any_symbol)
		if (x === '"') break
		else if (x === '\\') atom.push(xs.expect(any_symbol))
		else atom.push(x)
	}
	return '"' + atom.join('') + '"'
}

function parse_symbol(xs) {
	const atom = []
	while (true) {
		const x = xs.next()
		if (whitespace.includes(x) || x === StopIteration)
			break
		else if (x === '(' || x === ')') {
			xs.revert()
			break
		} else if (x === '\\')
			atom.push(xs.expect(K(true)))
		else atom.push(x)
	}
	return atom.join('')
}

module.exports = console.log(parse(fs.readFileSync(0).toString()))
