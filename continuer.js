// -----------------------------------------------------------------------------
// -- Continuer: continue sequence of functions
// -- Author: Aimingoo, aimingoo@wandoujia.com
// -- Copyright (c) 2014.12.29
//
// usages:
// 		require('continuer')
//			.next(func, [arg1, ...])
//			.next(...)
//			// more and more...
//			.do()
// or support custom callback (args position isnt last)
// 		c = require('continuer')
// 		c.next(func, [arg1, ..., c.isCallback(cbFunc), ...]).do()
// -----------------------------------------------------------------------------

var Continuator = {
	'do': function() {
		try {
			var item = this.shift();
			item && item.shift().apply(this, item.shift());
		}
		catch (e) {
			console.log(e);
			console.log('[Queue]: \n', this.slice(0));
		}
	}
}

var isCallback = function(func, args, continuator) {
	continuator = (continuator && continuator.do) ? continuator : this;
	return function() {
		continuator.do(func.apply(this, args||arguments));
	}
}

// Callback Must Die!
var Queue = function() {
	var queue = new Array;
	queue.isCallback = isCallback;
	queue.do = Continuator.do.bind(queue);

	queue.next = function(func, args, continuator) {
		if (continuator && continuator.do) {
			this.push([this.isCallback(func, args, continuator)])
		}
		else {
			// <continuator> as lastIsntCallback
			if (!continuator && args) {
				var cb = args[args.length-1];
				if (cb && cb instanceof Function) {
					args = [].slice.call(args, 0, -1).concat(this.isCallback(cb))
				}
			}
			this.push([func, args]);
		}
		return this
	}

	return queue;
}

// q is singleton continuer
var Continuer = Queue;
void function(q) {
	Continuer.isCallback = isCallback;
	Continuer.next = q.next.bind(q);
	Continuer.do = q.do;
}(new Queue)

module.exports = Continuer;