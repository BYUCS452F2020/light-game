"use strict";
exports.__esModule = true;
exports.priorityQueue = void 0;
exports.priorityQueue = function () {
    var heap = [];
    var parent = function (index) { return Math.floor((index - 1) / 2); };
    var left = function (index) { return 2 * index + 1; };
    var right = function (index) { return 2 * index + 2; };
    var hasLeft = function (index) { return left(index) < heap.length; };
    var hasRight = function (index) { return right(index) < heap.length; };
    var swap = function (a, b) {
        var tmp = heap[a];
        heap[a] = heap[b];
        heap[b] = tmp;
    };
    return {
        isEmpty: function () { return heap.length == 0; },
        peek: function () { return heap.length == 0 ? null : heap[0].value; },
        size: function () { return heap.length; },
        insert: function (item, prio) {
            heap.push({ key: prio, value: item });
            var i = heap.length - 1;
            while (i > 0) {
                var p = parent(i);
                if (heap[p].key < heap[i].key)
                    break;
                var tmp = heap[i];
                heap[i] = heap[p];
                heap[p] = tmp;
                i = p;
            }
        },
        pop: function () {
            if (heap.length == 0)
                return null;
            swap(0, heap.length - 1);
            var item = heap.pop();
            var current = 0;
            while (hasLeft(current)) {
                var smallerChild = left(current);
                if (hasRight(current) && heap[right(current)].key < heap[left(current)].key)
                    smallerChild = right(current);
                if (heap[smallerChild].key > heap[current].key)
                    break;
                swap(current, smallerChild);
                current = smallerChild;
            }
            return item.value;
        }
    };
};
