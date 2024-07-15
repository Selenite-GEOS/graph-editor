export async function getElementCenter(child: HTMLElement, parent: HTMLElement) {
	while (!child.offsetParent) {
		await new Promise((res) => setTimeout(res, 0));
	}

	let x = child.offsetLeft;
	let y = child.offsetTop;
	let currentElement = child.offsetParent as HTMLElement | null;

	if (!currentElement) throw new Error('child has null offsetParent');

	while (currentElement !== null && currentElement !== parent) {
		x += currentElement.offsetLeft + currentElement.clientLeft;
		y += currentElement.offsetTop + currentElement.clientTop;
		currentElement = currentElement.offsetParent as HTMLElement | null;
	}
	const width = child.offsetWidth;
	const height = child.offsetHeight;

	return {
		x: x + width / 2,
		y: y + height / 2
	};
}
export class EventEmitter<T> {
	listeners = new Set<(data: T) => void>();

	emit(data: T) {
		this.listeners.forEach((listener) => listener(data));
	}

	listen(handler: (data: T) => void) {
		this.listeners.add(handler);

		return () => {
			this.listeners.delete(handler);
		};
	}
}
