export class Stack<T> {
	private stack: T[]; // Array of items

	constructor() {
		this.stack = [];
	}

	// Push an item
	push(item: T): void {
		this.stack.push(item);
	}

	// Pop an item
	pop(): T | undefined {
		return this.stack.pop();
	}

	// Peek at the top item
	peek(): T | undefined {
		return this.stack.at(-1);
	}

	// Check if the stack is empty
	isEmpty(): boolean {
		return this.stack.length === 0;
	}

	// Get the stack length
	size(): number {
		return this.stack.length;
	}
}
